<?php
/**
 * Builder Detector — detects which page builder(s) are active.
 *
 * @package CmsMcpHub
 */

defined( 'ABSPATH' ) || exit;

/**
 * Detects page builders installed on the site and on individual posts.
 */
class CmsMcp_Builder_Detector {

	/**
	 * Detect all active builders on the site.
	 *
	 * @return array[] List of builder info arrays.
	 */
	public static function detect_all(): array {
		include_once ABSPATH . 'wp-admin/includes/plugin.php';

		$builders = [];

		// Elementor.
		if ( defined( 'ELEMENTOR_VERSION' ) || is_plugin_active( 'elementor/elementor.php' ) ) {
			$builders[] = [
				'slug'          => 'elementor',
				'name'          => 'Elementor',
				'version'       => defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : 'unknown',
				'support_level' => 'full',
				'meta_key'      => '_elementor_data',
			];
		}

		// Divi (Theme or Plugin).
		if ( defined( 'ET_BUILDER_VERSION' ) || function_exists( 'et_setup_theme' ) ) {
			$version  = defined( 'ET_BUILDER_VERSION' ) ? ET_BUILDER_VERSION : 'unknown';
			$is_divi5 = version_compare( $version, '5.0', '>=' );

			$builders[] = [
				'slug'          => $is_divi5 ? 'divi5' : 'divi4',
				'name'          => $is_divi5 ? 'Divi 5' : 'Divi 4',
				'version'       => $version,
				'support_level' => 'full',
				'meta_key'      => $is_divi5 ? '_et_builder_version' : '_et_pb_use_builder',
			];
		}

		// Bricks.
		if ( defined( 'BRICKS_VERSION' ) || class_exists( '\\Bricks\\Database' ) ) {
			$builders[] = [
				'slug'          => 'bricks',
				'name'          => 'Bricks',
				'version'       => defined( 'BRICKS_VERSION' ) ? BRICKS_VERSION : 'unknown',
				'support_level' => 'full',
				'meta_key'      => '_bricks_page_content_2',
			];
		}

		// Beaver Builder.
		if ( defined( 'FL_BUILDER_VERSION' ) || class_exists( 'FLBuilderModel' ) ) {
			$builders[] = [
				'slug'          => 'beaver-builder',
				'name'          => 'Beaver Builder',
				'version'       => defined( 'FL_BUILDER_VERSION' ) ? FL_BUILDER_VERSION : 'unknown',
				'support_level' => 'standard',
				'meta_key'      => '_fl_builder_data',
			];
		}

		// WPBakery.
		if ( defined( 'WPB_VC_VERSION' ) || class_exists( 'Vc_Manager' ) ) {
			$builders[] = [
				'slug'          => 'wpbakery',
				'name'          => 'WPBakery Page Builder',
				'version'       => defined( 'WPB_VC_VERSION' ) ? WPB_VC_VERSION : 'unknown',
				'support_level' => 'basic',
				'meta_key'      => '_wpb_shortcodes_custom_css',
			];
		}

		// Oxygen.
		if ( defined( 'CT_VERSION' ) || class_exists( '\\Developer_Tools\\CT_CSS' ) ) {
			$builders[] = [
				'slug'          => 'oxygen',
				'name'          => 'Oxygen',
				'version'       => defined( 'CT_VERSION' ) ? CT_VERSION : 'unknown',
				'support_level' => 'basic',
				'meta_key'      => 'ct_builder_shortcodes',
			];
		}

		// Gutenberg is always available.
		$builders[] = [
			'slug'          => 'gutenberg',
			'name'          => 'Gutenberg (Block Editor)',
			'version'       => get_bloginfo( 'version' ),
			'support_level' => 'full',
			'meta_key'      => null,
		];

		return $builders;
	}

	/**
	 * Detect the builder used on a specific post.
	 *
	 * @param int $post_id Post ID.
	 * @return array|null Builder info or null if post not found.
	 */
	public static function detect_for_post( int $post_id ): ?array {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return null;
		}

		$post_meta = get_post_meta( $post_id );
		$content   = $post->post_content;

		// Elementor.
		if ( ! empty( $post_meta['_elementor_data'][0] ) ) {
			return [
				'slug'    => 'elementor',
				'name'    => 'Elementor',
				'version' => defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : 'unknown',
			];
		}

		// Bricks.
		if ( ! empty( $post_meta['_bricks_page_content_2'][0] ) ) {
			return [
				'slug'    => 'bricks',
				'name'    => 'Bricks',
				'version' => defined( 'BRICKS_VERSION' ) ? BRICKS_VERSION : 'unknown',
			];
		}

		// Beaver Builder.
		if ( ! empty( $post_meta['_fl_builder_data'][0] ) ) {
			return [
				'slug'    => 'beaver-builder',
				'name'    => 'Beaver Builder',
				'version' => defined( 'FL_BUILDER_VERSION' ) ? FL_BUILDER_VERSION : 'unknown',
			];
		}

		// Divi 5 (block-based).
		if ( strpos( $content, 'wp:divi/' ) !== false ) {
			return [
				'slug'    => 'divi5',
				'name'    => 'Divi 5',
				'version' => defined( 'ET_BUILDER_VERSION' ) ? ET_BUILDER_VERSION : 'unknown',
			];
		}

		// Divi 4 (shortcode-based).
		if ( strpos( $content, '[et_pb_' ) !== false ) {
			return [
				'slug'    => 'divi4',
				'name'    => 'Divi 4',
				'version' => defined( 'ET_BUILDER_VERSION' ) ? ET_BUILDER_VERSION : 'unknown',
			];
		}

		// WPBakery.
		if ( strpos( $content, '[vc_row' ) !== false ) {
			return [
				'slug'    => 'wpbakery',
				'name'    => 'WPBakery Page Builder',
				'version' => defined( 'WPB_VC_VERSION' ) ? WPB_VC_VERSION : 'unknown',
			];
		}

		// Oxygen.
		if ( ! empty( $post_meta['ct_builder_shortcodes'][0] ) ) {
			return [
				'slug'    => 'oxygen',
				'name'    => 'Oxygen',
				'version' => defined( 'CT_VERSION' ) ? CT_VERSION : 'unknown',
			];
		}

		// Gutenberg blocks.
		if ( has_blocks( $post_id ) ) {
			return [
				'slug'    => 'gutenberg',
				'name'    => 'Gutenberg (Block Editor)',
				'version' => get_bloginfo( 'version' ),
			];
		}

		// Classic editor (no builder detected).
		return [
			'slug'    => 'classic',
			'name'    => 'Classic Editor',
			'version' => get_bloginfo( 'version' ),
		];
	}

	/**
	 * Get detailed info about a builder by slug.
	 *
	 * @param string $builder_slug Builder slug.
	 * @return array|null Builder info or null if not found/active.
	 */
	public static function get_builder_info( string $builder_slug ): ?array {
		$all_builders = self::detect_all();

		foreach ( $all_builders as $builder ) {
			if ( $builder['slug'] === $builder_slug ) {
				return $builder;
			}
		}

		return null;
	}
}
