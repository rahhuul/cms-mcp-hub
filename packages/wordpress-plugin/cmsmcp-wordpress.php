<?php
/**
 * Plugin Name: CMS MCP Hub - WordPress Connector
 * Plugin URI: https://github.com/rahhuul/cms-mcp-hub
 * Description: Companion plugin for @cmsmcp/wordpress MCP server. Enables page builder support (Elementor, Divi, Bricks, Beaver Builder, WPBakery, Oxygen), content snapshots, SEO/accessibility analysis, and advanced content operations.
 * Version: 1.0.0
 * Author: Rahul Patel
 * Author URI: https://github.com/rahhuul
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: cmsmcp
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Tested up to: 6.7
 *
 * @package CmsMcpHub
 */

defined( 'ABSPATH' ) || exit;

define( 'CMSMCP_VERSION', '1.0.0' );
define( 'CMSMCP_PLUGIN_FILE', __FILE__ );
define( 'CMSMCP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CMSMCP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Main plugin class — singleton.
 */
final class CmsMcpHub {

	/** @var self|null */
	private static $instance = null;

	/** @return self */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->load_includes();
		$this->init_hooks();
	}

	/**
	 * Load all include files.
	 */
	private function load_includes(): void {
		// Core
		require_once CMSMCP_PLUGIN_DIR . 'includes/class-api-keys.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/class-rest-api.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/class-auth.php';

		// Builder support
		require_once CMSMCP_PLUGIN_DIR . 'includes/builders/class-builder-detector.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/builders/class-builder-base.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/builders/class-elementor.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/builders/class-divi.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/builders/class-bricks.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/builders/class-beaver-builder.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/builders/class-wpbakery.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/builders/class-oxygen.php';

		// Snapshots
		require_once CMSMCP_PLUGIN_DIR . 'includes/snapshots/class-snapshot-manager.php';

		// Analysis
		require_once CMSMCP_PLUGIN_DIR . 'includes/analysis/class-seo-analyzer.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/analysis/class-accessibility-scanner.php';
		require_once CMSMCP_PLUGIN_DIR . 'includes/analysis/class-performance-analyzer.php';

		// Admin
		if ( is_admin() ) {
			require_once CMSMCP_PLUGIN_DIR . 'admin/class-admin-page.php';
		}
	}

	/**
	 * Register WordPress hooks.
	 */
	private function init_hooks(): void {
		register_activation_hook( CMSMCP_PLUGIN_FILE, [ $this, 'activate' ] );
		register_deactivation_hook( CMSMCP_PLUGIN_FILE, [ $this, 'deactivate' ] );

		add_action( 'rest_api_init', [ CmsMcp_Rest_API::class, 'register_routes' ] );
		add_action( 'admin_menu', [ $this, 'add_admin_menu' ] );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
	}

	/**
	 * Plugin activation — create custom tables.
	 */
	public function activate(): void {
		CmsMcp_Snapshot_Manager::create_table();
		CmsMcp_API_Keys::create_table();
		flush_rewrite_rules();
	}

	/**
	 * Plugin deactivation.
	 */
	public function deactivate(): void {
		flush_rewrite_rules();
	}

	/**
	 * Add admin menu page.
	 */
	public function add_admin_menu(): void {
		add_menu_page(
			__( 'CMS MCP Hub', 'cmsmcp' ),
			__( 'CMS MCP Hub', 'cmsmcp' ),
			'manage_options',
			'cmsmcp',
			[ CmsMcp_Admin_Page::class, 'render' ],
			'dashicons-rest-api',
			80
		);

		add_submenu_page(
			'cmsmcp',
			__( 'API Keys', 'cmsmcp' ),
			__( 'API Keys', 'cmsmcp' ),
			'manage_options',
			'cmsmcp-api-keys',
			[ CmsMcp_Admin_Page::class, 'render_api_keys' ]
		);

		add_submenu_page(
			'cmsmcp',
			__( 'Settings', 'cmsmcp' ),
			__( 'Settings', 'cmsmcp' ),
			'manage_options',
			'cmsmcp-settings',
			[ CmsMcp_Admin_Page::class, 'render_settings' ]
		);
	}

	/**
	 * Register plugin settings.
	 */
	public function register_settings(): void {
		register_setting( 'cmsmcp_settings', 'cmsmcp_enabled_tools', [
			'type'              => 'array',
			'sanitize_callback' => [ $this, 'sanitize_enabled_tools' ],
			'default'           => [],
		] );

		register_setting( 'cmsmcp_settings', 'cmsmcp_auto_snapshot', [
			'type'              => 'boolean',
			'sanitize_callback' => 'rest_sanitize_boolean',
			'default'           => true,
		] );
	}

	/**
	 * Sanitize enabled tools setting.
	 *
	 * @param mixed $value
	 * @return array
	 */
	public function sanitize_enabled_tools( $value ): array {
		if ( ! is_array( $value ) ) {
			return [];
		}
		return array_map( 'sanitize_text_field', $value );
	}
}

// Initialize the plugin.
CmsMcpHub::instance();
