<?php
/**
 * API Key management for CMS MCP Hub.
 *
 * Handles generation, validation, listing, and revocation of API keys
 * used to authenticate REST API requests from MCP servers.
 *
 * @package CmsMcpHub
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class CmsMcp_API_Keys
 *
 * Manages API keys stored as SHA-256 hashes in a custom database table.
 * Plaintext keys are only returned once at generation time.
 */
class CmsMcp_API_Keys {

	/**
	 * Table name without WordPress prefix.
	 *
	 * @var string
	 */
	const TABLE_NAME = 'cmsmcp_api_keys';

	/**
	 * Key prefix used to identify CMS MCP Hub keys.
	 *
	 * @var string
	 */
	const KEY_PREFIX = 'cmsmcp_';

	/**
	 * Create the API keys table on plugin activation.
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
			name VARCHAR(255) NOT NULL,
			key_hash VARCHAR(64) NOT NULL,
			key_prefix VARCHAR(12) NOT NULL,
			user_id BIGINT UNSIGNED NOT NULL,
			permissions TEXT DEFAULT NULL,
			last_used DATETIME DEFAULT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			INDEX idx_key_hash (key_hash),
			INDEX idx_user_id (user_id)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Generate a new API key.
	 *
	 * Creates a random key with the cmsmcp_ prefix, stores a SHA-256 hash
	 * in the database, and returns the plaintext key. The plaintext key
	 * is only available at creation time and cannot be retrieved later.
	 *
	 * @param string   $name    A human-readable label for the key.
	 * @param int      $user_id The WordPress user ID to associate with this key.
	 * @param string[] $permissions Optional. Array of allowed tool names. Null means all tools allowed.
	 * @return string The plaintext API key (shown only once).
	 *
	 * @throws \RuntimeException If the key could not be inserted into the database.
	 */
	public static function generate_key( string $name, int $user_id, ?array $permissions = null ): string {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;

		// Generate a random key: cmsmcp_ + 32 hex chars.
		$random_bytes = random_bytes( 16 );
		$plaintext    = self::KEY_PREFIX . bin2hex( $random_bytes );

		// Store the SHA-256 hash — never the plaintext.
		$key_hash   = hash( 'sha256', $plaintext );
		$key_prefix = substr( $plaintext, 0, 12 );

		$data = array(
			'name'        => sanitize_text_field( $name ),
			'key_hash'    => $key_hash,
			'key_prefix'  => $key_prefix,
			'user_id'     => absint( $user_id ),
			'permissions' => null !== $permissions ? wp_json_encode( array_map( 'sanitize_text_field', $permissions ) ) : null,
			'created_at'  => current_time( 'mysql', true ),
		);

		$formats = array( '%s', '%s', '%s', '%d', '%s', '%s' );

		$inserted = $wpdb->insert( $table_name, $data, $formats );

		if ( false === $inserted ) {
			throw new \RuntimeException(
				esc_html__( 'Failed to create API key. Please try again.', 'cmsmcp' )
			);
		}

		return $plaintext;
	}

	/**
	 * Validate an API key.
	 *
	 * Hashes the provided key and looks it up in the database.
	 * Updates the last_used timestamp on successful validation.
	 *
	 * @param string $key The plaintext API key to validate.
	 * @return int|false The associated user_id on success, false on failure.
	 */
	public static function validate_key( string $key ) {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;

		// Quick format check.
		if ( 0 !== strpos( $key, self::KEY_PREFIX ) || strlen( $key ) !== 39 ) {
			return false;
		}

		$key_hash = hash( 'sha256', $key );

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id, user_id FROM {$table_name} WHERE key_hash = %s LIMIT 1",
				$key_hash
			)
		);

		if ( null === $row ) {
			return false;
		}

		// Update last_used timestamp.
		$wpdb->update(
			$table_name,
			array( 'last_used' => current_time( 'mysql', true ) ),
			array( 'id' => $row->id ),
			array( '%s' ),
			array( '%d' )
		);

		return (int) $row->user_id;
	}

	/**
	 * List all API keys.
	 *
	 * Returns metadata for all keys. The actual key values (hashes) are
	 * never exposed — only the prefix is returned for identification.
	 *
	 * @return array Array of key metadata objects.
	 */
	public static function list_keys(): array {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;

		$results = $wpdb->get_results(
			"SELECT id, name, key_prefix, user_id, permissions, last_used, created_at
			 FROM {$table_name}
			 ORDER BY created_at DESC"
		);

		if ( ! is_array( $results ) ) {
			return array();
		}

		return array_map(
			function ( $row ) {
				return (object) array(
					'id'          => (int) $row->id,
					'name'        => $row->name,
					'key_prefix'  => $row->key_prefix,
					'user_id'     => (int) $row->user_id,
					'permissions' => null !== $row->permissions ? json_decode( $row->permissions, true ) : null,
					'last_used'   => $row->last_used,
					'created_at'  => $row->created_at,
				);
			},
			$results
		);
	}

	/**
	 * Revoke (delete) an API key by its ID.
	 *
	 * @param int $key_id The key ID to revoke.
	 * @return bool True on success, false on failure.
	 */
	public static function revoke_key( int $key_id ): bool {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;

		$deleted = $wpdb->delete(
			$table_name,
			array( 'id' => absint( $key_id ) ),
			array( '%d' )
		);

		return false !== $deleted && $deleted > 0;
	}

	/**
	 * Get a single API key by its ID.
	 *
	 * @param int $key_id The key ID to retrieve.
	 * @return object|null Key metadata object or null if not found.
	 */
	public static function get_key( int $key_id ): ?object {
		global $wpdb;

		$table_name = $wpdb->prefix . self::TABLE_NAME;

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id, name, key_prefix, user_id, permissions, last_used, created_at
				 FROM {$table_name}
				 WHERE id = %d
				 LIMIT 1",
				absint( $key_id )
			)
		);

		if ( null === $row ) {
			return null;
		}

		return (object) array(
			'id'          => (int) $row->id,
			'name'        => $row->name,
			'key_prefix'  => $row->key_prefix,
			'user_id'     => (int) $row->user_id,
			'permissions' => null !== $row->permissions ? json_decode( $row->permissions, true ) : null,
			'last_used'   => $row->last_used,
			'created_at'  => $row->created_at,
		);
	}
}
