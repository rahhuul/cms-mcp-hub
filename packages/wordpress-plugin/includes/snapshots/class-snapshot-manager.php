<?php
/**
 * Snapshot Manager — versioned content snapshots for posts.
 *
 * Stores full post content (including builder meta) in a custom table
 * so AI edits can be reviewed, diffed, and rolled back safely.
 *
 * @package CmsMcpHub
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class CmsMcp_Snapshot_Manager
 *
 * Manages content snapshots stored in a custom database table.
 * Each snapshot captures post title, content, excerpt, status,
 * builder data, and a SHA-256 content hash for optimistic locking.
 */
class CmsMcp_Snapshot_Manager {

	/**
	 * Table name without WordPress prefix.
	 *
	 * @var string
	 */
	const TABLE_NAME = 'cmsmcp_snapshots';

	/**
	 * Default number of snapshots to keep per post.
	 *
	 * @var int
	 */
	const DEFAULT_RETENTION = 50;

	/**
	 * Create the snapshots table on plugin activation.
	 *
	 * Uses dbDelta for safe table creation and upgrades.
	 *
	 * @return void
	 */
	public static function create_table(): void {
		global $wpdb;

		$table_name      = $wpdb->prefix . self::TABLE_NAME;
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table_name} (
			id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
			post_id BIGINT UNSIGNED NOT NULL,
			user_id BIGINT UNSIGNED NOT NULL,
			post_title VARCHAR(255) NOT NULL,
			post_content LONGTEXT NOT NULL,
			post_excerpt TEXT DEFAULT '',
			post_status VARCHAR(20) DEFAULT 'publish',
			builder_data LONGTEXT DEFAULT NULL,
			builder_type VARCHAR(50) DEFAULT NULL,
			meta_data TEXT DEFAULT NULL,
			reason VARCHAR(100) DEFAULT 'manual',
			content_hash VARCHAR(64) NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			INDEX idx_post_id (post_id),
			INDEX idx_created_at (created_at)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Create a snapshot of a post's current state.
	 *
	 * Captures title, content, excerpt, status, and active builder meta.
	 * Automatically cleans up old snapshots beyond the retention limit.
	 *
	 * @param int    $post_id The post ID to snapshot.
	 * @param string $reason  Reason for the snapshot (manual, auto_before_edit, bulk_operation).
	 * @return int The new snapshot ID.
	 *
	 * @throws \RuntimeException If the post does not exist or insert fails.
	 */
	public static function create_snapshot( int $post_id, string $reason = 'manual' ): int {
		global $wpdb;

		$post = get_post( $post_id );

		if ( ! $post ) {
			throw new \RuntimeException(
				sprintf(
					/* translators: %d: post ID */
					esc_html__( 'Post %d does not exist.', 'cmsmcp' ),
					$post_id
				)
			);
		}

		$table_name = $wpdb->prefix . self::TABLE_NAME;

		// Detect builder and capture builder meta.
		$builder_data = null;
		$builder_type = null;

		if ( class_exists( 'CmsMcp_Builder_Detector' ) ) {
			$builder = CmsMcp_Builder_Detector::detect_for_post( $post_id );

			if ( $builder && ! empty( $builder['slug'] ) && 'classic' !== $builder['slug'] && 'gutenberg' !== $builder['slug'] ) {
				$builder_type = sanitize_text_field( $builder['slug'] );
				$meta_key     = self::get_builder_meta_key( $builder_type );

				if ( $meta_key ) {
					$raw_meta = get_post_meta( $post_id, $meta_key, true );

					if ( ! empty( $raw_meta ) ) {
						$builder_data = is_array( $raw_meta ) ? wp_json_encode( $raw_meta ) : $raw_meta;
					}
				}
			}
		}

		// Build content hash for optimistic locking.
		$hash_input   = $post->post_title . '|' . $post->post_content . '|' . $post->post_excerpt;
		$content_hash = hash( 'sha256', $hash_input );

		$user_id = get_current_user_id();

		$data = array(
			'post_id'      => absint( $post_id ),
			'user_id'      => absint( $user_id ),
			'post_title'   => sanitize_text_field( $post->post_title ),
			'post_content' => $post->post_content,
			'post_excerpt' => $post->post_excerpt,
			'post_status'  => sanitize_text_field( $post->post_status ),
			'builder_data' => $builder_data,
			'builder_type' => $builder_type,
			'meta_data'    => null,
			'reason'       => sanitize_text_field( $reason ),
			'content_hash' => $content_hash,
			'created_at'   => current_time( 'mysql', true ),
		);

		$formats = array( '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' );

		$inserted = $wpdb->insert( $table_name, $data, $formats );

		if ( false === $inserted ) {
			throw new \RuntimeException(
				esc_html__( 'Failed to create snapshot. Please try again.', 'cmsmcp' )
			);
		}

		$snapshot_id = (int) $wpdb->insert_id;

		// Auto-cleanup: keep only the last N snapshots per post.
		$retention = (int) get_option( 'cmsmcp_snapshot_retention', self::DEFAULT_RETENTION );
		self::cleanup_post( $post_id, $retention );

		return $snapshot_id;
	}

	/**
	 * List snapshots for a specific post.
	 *
	 * @param int $post_id The post ID.
	 * @param int $limit   Maximum number of snapshots to return.
	 * @return array Array of snapshot objects (without full content for performance).
	 */
	public static function list_snapshots( int $post_id, int $limit = 20 ): array {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;

		$results = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT id, post_id, user_id, post_title, post_status, builder_type,
				        reason, content_hash, created_at,
				        LENGTH(post_content) AS content_length
				 FROM {$table_name}
				 WHERE post_id = %d
				 ORDER BY created_at DESC
				 LIMIT %d",
				absint( $post_id ),
				absint( $limit )
			)
		);

		if ( ! is_array( $results ) ) {
			return array();
		}

		return array_map(
			function ( $row ) {
				return (object) array(
					'id'             => (int) $row->id,
					'post_id'        => (int) $row->post_id,
					'user_id'        => (int) $row->user_id,
					'post_title'     => $row->post_title,
					'post_status'    => $row->post_status,
					'builder_type'   => $row->builder_type,
					'reason'         => $row->reason,
					'content_hash'   => $row->content_hash,
					'content_length' => (int) $row->content_length,
					'created_at'     => $row->created_at,
				);
			},
			$results
		);
	}

	/**
	 * Get a specific snapshot by ID.
	 *
	 * Returns the full snapshot including content and builder data.
	 *
	 * @param int $snapshot_id The snapshot ID.
	 * @return object|null The snapshot object, or null if not found.
	 */
	public static function get_snapshot( int $snapshot_id ): ?object {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE id = %d LIMIT 1",
				absint( $snapshot_id )
			)
		);

		if ( null === $row ) {
			return null;
		}

		return (object) array(
			'id'           => (int) $row->id,
			'post_id'      => (int) $row->post_id,
			'user_id'      => (int) $row->user_id,
			'post_title'   => $row->post_title,
			'post_content' => $row->post_content,
			'post_excerpt' => $row->post_excerpt,
			'post_status'  => $row->post_status,
			'builder_data' => $row->builder_data,
			'builder_type' => $row->builder_type,
			'meta_data'    => $row->meta_data,
			'reason'       => $row->reason,
			'content_hash' => $row->content_hash,
			'created_at'   => $row->created_at,
		);
	}

	/**
	 * Restore a snapshot — revert a post to a previous state.
	 *
	 * Creates a backup snapshot of the current state before restoring,
	 * then updates the post with the snapshot's data.
	 *
	 * @param int $snapshot_id The snapshot ID to restore.
	 * @return bool True on success.
	 *
	 * @throws \RuntimeException If snapshot not found or restore fails.
	 */
	public static function restore_snapshot( int $snapshot_id ): bool {
		$snapshot = self::get_snapshot( $snapshot_id );

		if ( null === $snapshot ) {
			throw new \RuntimeException(
				esc_html__( 'Snapshot not found.', 'cmsmcp' )
			);
		}

		// Create a backup of the current state before restoring.
		self::create_snapshot( $snapshot->post_id, 'auto_before_restore' );

		// Update the post with snapshot data.
		$update_data = array(
			'ID'           => $snapshot->post_id,
			'post_title'   => $snapshot->post_title,
			'post_content' => $snapshot->post_content,
			'post_excerpt' => $snapshot->post_excerpt,
		);

		$result = wp_update_post( $update_data, true );

		if ( is_wp_error( $result ) ) {
			throw new \RuntimeException(
				sprintf(
					/* translators: %s: error message */
					esc_html__( 'Failed to restore snapshot: %s', 'cmsmcp' ),
					$result->get_error_message()
				)
			);
		}

		// Restore builder data if present.
		if ( ! empty( $snapshot->builder_data ) && ! empty( $snapshot->builder_type ) ) {
			$meta_key = self::get_builder_meta_key( $snapshot->builder_type );

			if ( $meta_key ) {
				$decoded = json_decode( $snapshot->builder_data, true );
				$value   = ( null !== $decoded ) ? $decoded : $snapshot->builder_data;

				update_post_meta( $snapshot->post_id, $meta_key, $value );
			}
		}

		return true;
	}

	/**
	 * Diff two snapshots.
	 *
	 * Compares title, content, and excerpt between two snapshots
	 * and returns structured diff information.
	 *
	 * @param int $snapshot_id_a First snapshot ID.
	 * @param int $snapshot_id_b Second snapshot ID.
	 * @return array Structured diff with per-field change details.
	 *
	 * @throws \RuntimeException If either snapshot is not found.
	 */
	public static function diff_snapshots( int $snapshot_id_a, int $snapshot_id_b ): array {
		$snap_a = self::get_snapshot( $snapshot_id_a );
		$snap_b = self::get_snapshot( $snapshot_id_b );

		if ( null === $snap_a ) {
			throw new \RuntimeException(
				sprintf(
					/* translators: %d: snapshot ID */
					esc_html__( 'Snapshot %d not found.', 'cmsmcp' ),
					$snapshot_id_a
				)
			);
		}

		if ( null === $snap_b ) {
			throw new \RuntimeException(
				sprintf(
					/* translators: %d: snapshot ID */
					esc_html__( 'Snapshot %d not found.', 'cmsmcp' ),
					$snapshot_id_b
				)
			);
		}

		$fields = array( 'post_title', 'post_content', 'post_excerpt' );
		$diff   = array(
			'snapshot_a'  => $snapshot_id_a,
			'snapshot_b'  => $snapshot_id_b,
			'created_a'   => $snap_a->created_at,
			'created_b'   => $snap_b->created_at,
			'has_changes' => false,
			'fields'      => array(),
		);

		foreach ( $fields as $field ) {
			$value_a = $snap_a->$field ?? '';
			$value_b = $snap_b->$field ?? '';
			$changed = $value_a !== $value_b;

			if ( $changed ) {
				$diff['has_changes'] = true;
			}

			$lines_a = substr_count( $value_a, "\n" ) + 1;
			$lines_b = substr_count( $value_b, "\n" ) + 1;

			$diff['fields'][ $field ] = array(
				'changed'     => $changed,
				'chars_a'     => strlen( $value_a ),
				'chars_b'     => strlen( $value_b ),
				'chars_diff'  => strlen( $value_b ) - strlen( $value_a ),
				'lines_a'     => $lines_a,
				'lines_b'     => $lines_b,
				'lines_diff'  => $lines_b - $lines_a,
			);
		}

		// Builder data diff.
		$builder_changed = $snap_a->builder_data !== $snap_b->builder_data;
		$diff['fields']['builder_data'] = array(
			'changed'      => $builder_changed,
			'builder_a'    => $snap_a->builder_type,
			'builder_b'    => $snap_b->builder_type,
			'chars_a'      => strlen( $snap_a->builder_data ?? '' ),
			'chars_b'      => strlen( $snap_b->builder_data ?? '' ),
		);

		if ( $builder_changed ) {
			$diff['has_changes'] = true;
		}

		return $diff;
	}

	/**
	 * Delete old snapshots, keeping the last N per post.
	 *
	 * @param int $keep Number of snapshots to keep per post.
	 * @return int Total number of snapshots deleted.
	 */
	public static function cleanup( int $keep = 50 ): int {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;
		$keep       = max( 1, absint( $keep ) );

		// Get all post IDs that have snapshots.
		$post_ids = $wpdb->get_col( "SELECT DISTINCT post_id FROM {$table_name}" );

		if ( empty( $post_ids ) ) {
			return 0;
		}

		$total_deleted = 0;

		foreach ( $post_ids as $post_id ) {
			$total_deleted += self::cleanup_post( (int) $post_id, $keep );
		}

		return $total_deleted;
	}

	/**
	 * Count all snapshots in the database.
	 *
	 * @return int Total snapshot count.
	 */
	public static function count_all(): int {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;

		return (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name}" );
	}

	/**
	 * Clean up snapshots for a specific post, keeping the last N.
	 *
	 * @param int $post_id The post ID.
	 * @param int $keep    Number of snapshots to keep.
	 * @return int Number of snapshots deleted.
	 */
	private static function cleanup_post( int $post_id, int $keep ): int {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;
		$keep       = max( 1, absint( $keep ) );

		// Get the ID of the Nth newest snapshot for this post.
		$cutoff_id = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT id FROM {$table_name}
				 WHERE post_id = %d
				 ORDER BY created_at DESC
				 LIMIT 1 OFFSET %d",
				absint( $post_id ),
				$keep
			)
		);

		if ( null === $cutoff_id ) {
			return 0;
		}

		$deleted = $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$table_name}
				 WHERE post_id = %d AND id <= %d",
				absint( $post_id ),
				absint( $cutoff_id )
			)
		);

		return ( false !== $deleted ) ? (int) $deleted : 0;
	}

	/**
	 * Get the primary meta key for a builder slug.
	 *
	 * @param string $builder_type Builder slug.
	 * @return string|null Meta key or null if unknown.
	 */
	private static function get_builder_meta_key( string $builder_type ): ?string {
		$meta_keys = array(
			'elementor'      => '_elementor_data',
			'bricks'         => '_bricks_page_content_2',
			'beaver-builder' => '_fl_builder_data',
			'divi4'          => '_et_pb_use_builder',
			'divi5'          => '_et_builder_version',
			'wpbakery'       => '_wpb_shortcodes_custom_css',
			'oxygen'         => 'ct_builder_shortcodes',
		);

		return $meta_keys[ $builder_type ] ?? null;
	}
}
