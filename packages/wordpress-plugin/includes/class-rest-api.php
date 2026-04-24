<?php
/**
 * REST API route registration for CMS MCP Hub.
 *
 * Registers all REST API endpoints under the cmsmcp/v1 namespace.
 * Routes are organized into system, builder, snapshot, and analysis groups.
 *
 * @package CmsMcpHub
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class CmsMcp_Rest_API
 *
 * Handles REST API route registration and system endpoint callbacks.
 */
class CmsMcp_Rest_API {

	/**
	 * REST API namespace.
	 *
	 * @var string
	 */
	const NAMESPACE = 'cmsmcp/v1';

	/**
	 * Register all REST API routes.
	 *
	 * Called on the rest_api_init action hook.
	 *
	 * @return void
	 */
	public static function register_routes(): void {
		self::register_system_routes();
		self::register_builder_routes();
		self::register_bricks_routes();
		self::register_builder_widget_route();
		self::register_snapshot_routes();
		self::register_analysis_routes();
	}

	/**
	 * Register system-level routes.
	 *
	 * @return void
	 */
	private static function register_system_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'get_status' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
			)
		);
	}

	/**
	 * Register builder-related routes.
	 *
	 * @return void
	 */
	private static function register_builder_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/builder/detect',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'detect_builders' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/builder/info',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'get_builder_info' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/builder/content/(?P<post_id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_builder_content' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
					'args'                => self::get_post_id_args(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'set_builder_content' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
					'args'                => self::get_post_id_args(),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/builder/elements/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'get_builder_elements' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => self::get_post_id_args(),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/builder/element/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( self::class, 'update_builder_element' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => self::get_post_id_args(),
			)
		);
	}

	/**
	 * Register snapshot-related routes.
	 *
	 * @return void
	 */
	private static function register_snapshot_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/snapshots/(?P<post_id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'list_snapshots' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
					'args'                => self::get_post_id_args(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'create_snapshot' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
					'args'                => self::get_post_id_args(),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/snapshots/(?P<post_id>\d+)/(?P<snapshot_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'get_snapshot' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => array_merge(
					self::get_post_id_args(),
					array(
						'snapshot_id' => array(
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'validate_callback' => array( self::class, 'validate_positive_int' ),
							'description'       => __( 'The snapshot ID.', 'cmsmcp' ),
						),
					)
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/snapshots/(?P<post_id>\d+)/(?P<snapshot_id>\d+)/restore',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( self::class, 'restore_snapshot' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => array_merge(
					self::get_post_id_args(),
					array(
						'snapshot_id' => array(
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'validate_callback' => array( self::class, 'validate_positive_int' ),
							'description'       => __( 'The snapshot ID to restore.', 'cmsmcp' ),
						),
					)
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/snapshots/(?P<post_id>\d+)/diff',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'diff_snapshots' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => array_merge(
					self::get_post_id_args(),
					array(
						'a' => array(
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'validate_callback' => array( self::class, 'validate_positive_int' ),
							'description'       => __( 'First snapshot ID for comparison.', 'cmsmcp' ),
						),
						'b' => array(
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'validate_callback' => array( self::class, 'validate_positive_int' ),
							'description'       => __( 'Second snapshot ID for comparison.', 'cmsmcp' ),
						),
					)
				),
			)
		);
	}

	/**
	 * Register analysis-related routes.
	 *
	 * @return void
	 */
	private static function register_analysis_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/analysis/seo/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'analyze_seo' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => self::get_post_id_args(),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/analysis/accessibility/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'analyze_accessibility' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => self::get_post_id_args(),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/analysis/performance/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'analyze_performance' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => self::get_post_id_args(),
			)
		);
	}

	/**
	 * Register Bricks builder deep-intelligence routes.
	 *
	 * @return void
	 */
	private static function register_bricks_routes(): void {
		// Global Classes — list / create.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/global-classes',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'bricks_get_global_classes' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'bricks_create_global_class' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				),
			)
		);

		// Global Classes — update / delete a single class.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/global-classes/(?P<class_id>[a-zA-Z0-9_-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'bricks_update_global_class' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
					'args'                => array(
						'class_id' => array(
							'required'          => true,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => __( 'The global class identifier.', 'cmsmcp' ),
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( self::class, 'bricks_delete_global_class' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
					'args'                => array(
						'class_id' => array(
							'required'          => true,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => __( 'The global class identifier.', 'cmsmcp' ),
						),
					),
				),
			)
		);

		// Theme Styles.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/theme-styles',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'bricks_get_theme_styles' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'bricks_update_theme_styles' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				),
			)
		);

		// Color Palette.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/color-palette',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'bricks_get_color_palette' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'bricks_update_color_palette' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				),
			)
		);

		// Typography.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/typography',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'bricks_get_typography' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'bricks_update_typography' ),
					'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				),
			)
		);

		// Components — list all.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/components',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'bricks_list_components' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
			)
		);

		// Components — get single.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/components/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'bricks_get_component' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
						'validate_callback' => array( self::class, 'validate_positive_int' ),
						'description'       => __( 'The component (template) ID.', 'cmsmcp' ),
					),
				),
			)
		);

		// Components — apply to a post.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/components/(?P<id>\d+)/apply',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( self::class, 'bricks_apply_component' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
						'validate_callback' => array( self::class, 'validate_positive_int' ),
						'description'       => __( 'The component (template) ID.', 'cmsmcp' ),
					),
				),
			)
		);

		// Search elements across posts.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/search-elements',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( self::class, 'bricks_search_elements' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
			)
		);

		// Health check for a post.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/health-check/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'bricks_health_check' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => self::get_post_id_args(),
			)
		);

		// Style profile for a post.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/style-profile/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'bricks_style_profile' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => self::get_post_id_args(),
			)
		);

		// Design system aggregate.
		register_rest_route(
			self::NAMESPACE,
			'/bricks/design-system',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'bricks_design_system' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
			)
		);
	}

	/**
	 * Register builder widget shortcut route.
	 *
	 * @return void
	 */
	private static function register_builder_widget_route(): void {
		register_rest_route(
			self::NAMESPACE,
			'/builder/widget/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( self::class, 'add_builder_widget' ),
				'permission_callback' => array( CmsMcp_Auth::class, 'check_permission' ),
				'args'                => self::get_post_id_args(),
			)
		);
	}

	// -------------------------------------------------------------------------
	// Callback implementations
	// -------------------------------------------------------------------------

	/**
	 * GET /status — Plugin and system information.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function get_status( WP_REST_Request $request ): WP_REST_Response {
		return new WP_REST_Response(
			array(
				'plugin_version'    => CMSMCP_VERSION,
				'wordpress_version' => get_bloginfo( 'version' ),
				'php_version'       => PHP_VERSION,
				'site_url'          => get_site_url(),
				'active_builders'   => CmsMcp_Builder_Detector::detect_all(),
				'snapshot_count'    => CmsMcp_Snapshot_Manager::count_all(),
				'api_namespace'     => self::NAMESPACE,
			),
			200
		);
	}

	/**
	 * GET /builder/detect — Detect active page builders.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function detect_builders( WP_REST_Request $request ): WP_REST_Response {
		return new WP_REST_Response(
			array(
				'builders' => CmsMcp_Builder_Detector::detect_all(),
			),
			200
		);
	}

	/**
	 * GET /builder/info — Detailed builder information.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function get_builder_info( WP_REST_Request $request ): WP_REST_Response {
		return new WP_REST_Response(
			array(
				'builders' => CmsMcp_Builder_Detector::get_detailed_info(),
			),
			200
		);
	}

	/**
	 * GET /builder/content/{post_id} — Extract builder content.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_builder_content( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$post    = get_post( $post_id );

		if ( ! $post ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$detector = CmsMcp_Builder_Detector::detect_for_post( $post_id );

		if ( empty( $detector ) ) {
			return new WP_REST_Response(
				array(
					'post_id' => $post_id,
					'builder' => null,
					'content' => null,
					'message' => __( 'No supported page builder detected for this post.', 'cmsmcp' ),
				),
				200
			);
		}

		$builder = CmsMcp_Builder_Detector::get_builder_instance( $detector );

		return new WP_REST_Response(
			array(
				'post_id' => $post_id,
				'builder' => $detector,
				'content' => $builder->extract_content( $post_id ),
			),
			200
		);
	}

	/**
	 * POST /builder/content/{post_id} — Inject builder content.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function set_builder_content( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$post    = get_post( $post_id );

		if ( ! $post ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$detector = CmsMcp_Builder_Detector::detect_for_post( $post_id );

		if ( empty( $detector ) ) {
			return new WP_Error(
				'cmsmcp_no_builder',
				__( 'No supported page builder detected for this post.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$builder = CmsMcp_Builder_Detector::get_builder_instance( $detector );
		$content = $request->get_json_params();
		$result  = $builder->inject_content( $post_id, $content );

		return new WP_REST_Response(
			array(
				'post_id' => $post_id,
				'builder' => $detector,
				'success' => $result,
			),
			$result ? 200 : 500
		);
	}

	/**
	 * GET /builder/elements/{post_id} — Find elements by type/class/content.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_builder_elements( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$post    = get_post( $post_id );

		if ( ! $post ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$detector = CmsMcp_Builder_Detector::detect_for_post( $post_id );

		if ( empty( $detector ) ) {
			return new WP_Error(
				'cmsmcp_no_builder',
				__( 'No supported page builder detected for this post.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$builder = CmsMcp_Builder_Detector::get_builder_instance( $detector );
		$filters = array(
			'type'    => $request->get_param( 'type' ),
			'class'   => $request->get_param( 'class' ),
			'content' => $request->get_param( 'content' ),
		);

		return new WP_REST_Response(
			array(
				'post_id'  => $post_id,
				'builder'  => $detector,
				'elements' => $builder->find_elements( $post_id, array_filter( $filters ) ),
			),
			200
		);
	}

	/**
	 * POST /builder/element/{post_id} — Update a specific element.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function update_builder_element( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$post    = get_post( $post_id );

		if ( ! $post ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$detector = CmsMcp_Builder_Detector::detect_for_post( $post_id );

		if ( empty( $detector ) ) {
			return new WP_Error(
				'cmsmcp_no_builder',
				__( 'No supported page builder detected for this post.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$builder      = CmsMcp_Builder_Detector::get_builder_instance( $detector );
		$element_data = $request->get_json_params();
		$result       = $builder->update_element( $post_id, $element_data );

		return new WP_REST_Response(
			array(
				'post_id' => $post_id,
				'builder' => $detector,
				'success' => $result,
			),
			$result ? 200 : 500
		);
	}

	/**
	 * GET /snapshots/{post_id} — List snapshots for a post.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function list_snapshots( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		return new WP_REST_Response(
			array(
				'post_id'   => $post_id,
				'snapshots' => CmsMcp_Snapshot_Manager::list_snapshots( $post_id ),
			),
			200
		);
	}

	/**
	 * POST /snapshots/{post_id} — Create a snapshot.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_snapshot( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$label    = sanitize_text_field( $request->get_param( 'label' ) ?? '' );
		$snapshot = CmsMcp_Snapshot_Manager::create_snapshot( $post_id, $label );

		return new WP_REST_Response(
			array(
				'post_id'  => $post_id,
				'snapshot' => $snapshot,
			),
			201
		);
	}

	/**
	 * GET /snapshots/{post_id}/{snapshot_id} — Get a specific snapshot.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_snapshot( WP_REST_Request $request ) {
		$post_id     = (int) $request->get_param( 'post_id' );
		$snapshot_id = (int) $request->get_param( 'snapshot_id' );

		$snapshot = CmsMcp_Snapshot_Manager::get_snapshot( $post_id, $snapshot_id );

		if ( null === $snapshot ) {
			return new WP_Error(
				'cmsmcp_snapshot_not_found',
				__( 'Snapshot not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		return new WP_REST_Response( $snapshot, 200 );
	}

	/**
	 * POST /snapshots/{post_id}/{snapshot_id}/restore — Restore a snapshot.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function restore_snapshot( WP_REST_Request $request ) {
		$post_id     = (int) $request->get_param( 'post_id' );
		$snapshot_id = (int) $request->get_param( 'snapshot_id' );

		$result = CmsMcp_Snapshot_Manager::restore_snapshot( $post_id, $snapshot_id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response(
			array(
				'post_id'     => $post_id,
				'snapshot_id' => $snapshot_id,
				'restored'    => true,
			),
			200
		);
	}

	/**
	 * GET /snapshots/{post_id}/diff — Compare two snapshots.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function diff_snapshots( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$a       = (int) $request->get_param( 'a' );
		$b       = (int) $request->get_param( 'b' );

		$diff = CmsMcp_Snapshot_Manager::diff_snapshots( $post_id, $a, $b );

		if ( is_wp_error( $diff ) ) {
			return $diff;
		}

		return new WP_REST_Response(
			array(
				'post_id' => $post_id,
				'a'       => $a,
				'b'       => $b,
				'diff'    => $diff,
			),
			200
		);
	}

	/**
	 * GET /analysis/seo/{post_id} — Server-side SEO analysis.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function analyze_seo( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		return new WP_REST_Response(
			array(
				'post_id'  => $post_id,
				'analysis' => CmsMcp_SEO_Analyzer::analyze( $post_id ),
			),
			200
		);
	}

	/**
	 * GET /analysis/accessibility/{post_id} — WCAG accessibility scan.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function analyze_accessibility( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		return new WP_REST_Response(
			array(
				'post_id'  => $post_id,
				'analysis' => CmsMcp_Accessibility_Scanner::scan( $post_id ),
			),
			200
		);
	}

	/**
	 * GET /analysis/performance/{post_id} — Performance analysis.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function analyze_performance( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		return new WP_REST_Response(
			array(
				'post_id'  => $post_id,
				'analysis' => CmsMcp_Performance_Analyzer::analyze( $post_id ),
			),
			200
		);
	}

	// -------------------------------------------------------------------------
	// Bricks callback implementations
	// -------------------------------------------------------------------------

	/**
	 * GET /bricks/global-classes — List all Bricks global classes.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function bricks_get_global_classes( WP_REST_Request $request ): WP_REST_Response {
		$classes = get_option( 'bricks_global_classes', array() );

		return new WP_REST_Response(
			array(
				'classes' => is_array( $classes ) ? $classes : array(),
			),
			200
		);
	}

	/**
	 * POST /bricks/global-classes — Create a new Bricks global class.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_create_global_class( WP_REST_Request $request ) {
		$body = $request->get_json_params();

		if ( empty( $body['name'] ) ) {
			return new WP_Error(
				'cmsmcp_missing_param',
				__( 'The "name" field is required.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$classes = get_option( 'bricks_global_classes', array() );

		if ( ! is_array( $classes ) ) {
			$classes = array();
		}

		$class_id = sanitize_title( $body['name'] );

		// Check for duplicate.
		foreach ( $classes as $existing ) {
			if ( isset( $existing['id'] ) && $existing['id'] === $class_id ) {
				return new WP_Error(
					'cmsmcp_duplicate_class',
					__( 'A global class with this name already exists.', 'cmsmcp' ),
					array( 'status' => 409 )
				);
			}
		}

		$new_class = array(
			'id'       => $class_id,
			'name'     => sanitize_text_field( $body['name'] ),
			'settings' => isset( $body['settings'] ) && is_array( $body['settings'] )
				? self::sanitize_recursive( $body['settings'] )
				: array(),
		);

		$classes[] = $new_class;
		update_option( 'bricks_global_classes', $classes );

		return new WP_REST_Response(
			array(
				'created' => true,
				'class'   => $new_class,
			),
			201
		);
	}

	/**
	 * POST /bricks/global-classes/{class_id} — Update a global class.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_update_global_class( WP_REST_Request $request ) {
		$class_id = sanitize_text_field( $request->get_param( 'class_id' ) );
		$body     = $request->get_json_params();
		$classes  = get_option( 'bricks_global_classes', array() );

		if ( ! is_array( $classes ) ) {
			$classes = array();
		}

		$found = false;

		foreach ( $classes as $index => $existing ) {
			if ( isset( $existing['id'] ) && $existing['id'] === $class_id ) {
				if ( ! empty( $body['name'] ) ) {
					$classes[ $index ]['name'] = sanitize_text_field( $body['name'] );
				}
				if ( isset( $body['settings'] ) && is_array( $body['settings'] ) ) {
					$classes[ $index ]['settings'] = self::sanitize_recursive( $body['settings'] );
				}
				$found = true;
				break;
			}
		}

		if ( ! $found ) {
			return new WP_Error(
				'cmsmcp_class_not_found',
				__( 'Global class not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		update_option( 'bricks_global_classes', $classes );

		return new WP_REST_Response(
			array(
				'updated'  => true,
				'class_id' => $class_id,
				'class'    => $classes[ $index ],
			),
			200
		);
	}

	/**
	 * DELETE /bricks/global-classes/{class_id} — Delete a global class.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_delete_global_class( WP_REST_Request $request ) {
		$class_id = sanitize_text_field( $request->get_param( 'class_id' ) );
		$classes  = get_option( 'bricks_global_classes', array() );

		if ( ! is_array( $classes ) ) {
			$classes = array();
		}

		$original_count = count( $classes );
		$classes        = array_values(
			array_filter(
				$classes,
				function ( $cls ) use ( $class_id ) {
					return ! isset( $cls['id'] ) || $cls['id'] !== $class_id;
				}
			)
		);

		if ( count( $classes ) === $original_count ) {
			return new WP_Error(
				'cmsmcp_class_not_found',
				__( 'Global class not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		update_option( 'bricks_global_classes', $classes );

		return new WP_REST_Response(
			array(
				'deleted'  => true,
				'class_id' => $class_id,
			),
			200
		);
	}

	/**
	 * GET /bricks/theme-styles — Get Bricks theme styles.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function bricks_get_theme_styles( WP_REST_Request $request ): WP_REST_Response {
		$styles = get_option( 'bricks_theme_styles', array() );

		return new WP_REST_Response(
			array(
				'theme_styles' => is_array( $styles ) ? $styles : array(),
			),
			200
		);
	}

	/**
	 * POST /bricks/theme-styles — Update Bricks theme styles.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_update_theme_styles( WP_REST_Request $request ) {
		$body = $request->get_json_params();

		if ( ! is_array( $body ) || empty( $body ) ) {
			return new WP_Error(
				'cmsmcp_invalid_data',
				__( 'Request body must be a non-empty object.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$sanitized = self::sanitize_recursive( $body );
		update_option( 'bricks_theme_styles', $sanitized );

		return new WP_REST_Response(
			array(
				'updated'      => true,
				'theme_styles' => $sanitized,
			),
			200
		);
	}

	/**
	 * GET /bricks/color-palette — Get Bricks color palette.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function bricks_get_color_palette( WP_REST_Request $request ): WP_REST_Response {
		$palette = get_option( 'bricks_color_palette', array() );

		return new WP_REST_Response(
			array(
				'color_palette' => is_array( $palette ) ? $palette : array(),
			),
			200
		);
	}

	/**
	 * POST /bricks/color-palette — Update Bricks color palette.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_update_color_palette( WP_REST_Request $request ) {
		$body = $request->get_json_params();

		if ( ! is_array( $body ) ) {
			return new WP_Error(
				'cmsmcp_invalid_data',
				__( 'Request body must be an array or object.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$sanitized = self::sanitize_recursive( $body );
		update_option( 'bricks_color_palette', $sanitized );

		return new WP_REST_Response(
			array(
				'updated'       => true,
				'color_palette' => $sanitized,
			),
			200
		);
	}

	/**
	 * GET /bricks/typography — Get Bricks typography settings.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function bricks_get_typography( WP_REST_Request $request ): WP_REST_Response {
		$typography = get_option( 'bricks_typography', array() );

		return new WP_REST_Response(
			array(
				'typography' => is_array( $typography ) ? $typography : array(),
			),
			200
		);
	}

	/**
	 * POST /bricks/typography — Update Bricks typography settings.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_update_typography( WP_REST_Request $request ) {
		$body = $request->get_json_params();

		if ( ! is_array( $body ) ) {
			return new WP_Error(
				'cmsmcp_invalid_data',
				__( 'Request body must be an array or object.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$sanitized = self::sanitize_recursive( $body );
		update_option( 'bricks_typography', $sanitized );

		return new WP_REST_Response(
			array(
				'updated'    => true,
				'typography' => $sanitized,
			),
			200
		);
	}

	/**
	 * GET /bricks/components — List all Bricks saved components (section templates).
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function bricks_list_components( WP_REST_Request $request ): WP_REST_Response {
		$query = new WP_Query(
			array(
				'post_type'      => 'bricks_template',
				'posts_per_page' => 100,
				'post_status'    => 'publish',
				'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					array(
						'key'   => '_bricks_template_type',
						'value' => 'section',
					),
				),
			)
		);

		$components = array();

		foreach ( $query->posts as $post ) {
			$components[] = array(
				'id'         => $post->ID,
				'title'      => $post->post_title,
				'slug'       => $post->post_name,
				'modified'   => $post->post_modified,
				'element_count' => self::bricks_count_elements( $post->ID ),
			);
		}

		wp_reset_postdata();

		return new WP_REST_Response(
			array(
				'components' => $components,
				'total'      => $query->found_posts,
			),
			200
		);
	}

	/**
	 * GET /bricks/components/{id} — Get a specific Bricks component.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_get_component( WP_REST_Request $request ) {
		$id   = (int) $request->get_param( 'id' );
		$post = get_post( $id );

		if ( ! $post || 'bricks_template' !== $post->post_type ) {
			return new WP_Error(
				'cmsmcp_component_not_found',
				__( 'Bricks component not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$content = get_post_meta( $id, '_bricks_page_content_2', true );

		return new WP_REST_Response(
			array(
				'id'       => $post->ID,
				'title'    => $post->post_title,
				'slug'     => $post->post_name,
				'modified' => $post->post_modified,
				'content'  => is_array( $content ) ? $content : array(),
			),
			200
		);
	}

	/**
	 * POST /bricks/components/{id}/apply — Apply a component to a post.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_apply_component( WP_REST_Request $request ) {
		$component_id = (int) $request->get_param( 'id' );
		$body         = $request->get_json_params();
		$post_id      = isset( $body['post_id'] ) ? absint( $body['post_id'] ) : 0;
		$position     = isset( $body['position'] ) ? sanitize_text_field( $body['position'] ) : 'bottom';

		if ( $post_id < 1 ) {
			return new WP_Error(
				'cmsmcp_missing_param',
				__( 'The "post_id" field is required and must be a positive integer.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$component = get_post( $component_id );

		if ( ! $component || 'bricks_template' !== $component->post_type ) {
			return new WP_Error(
				'cmsmcp_component_not_found',
				__( 'Bricks component not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Target post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$component_content = get_post_meta( $component_id, '_bricks_page_content_2', true );

		if ( ! is_array( $component_content ) || empty( $component_content ) ) {
			return new WP_Error(
				'cmsmcp_empty_component',
				__( 'Component has no Bricks content.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$post_content = get_post_meta( $post_id, '_bricks_page_content_2', true );

		if ( ! is_array( $post_content ) ) {
			$post_content = array();
		}

		// Re-generate element IDs to avoid collisions.
		$remapped = self::bricks_remap_element_ids( $component_content );

		if ( 'top' === $position ) {
			$post_content = array_merge( $remapped, $post_content );
		} else {
			$post_content = array_merge( $post_content, $remapped );
		}

		update_post_meta( $post_id, '_bricks_page_content_2', $post_content );

		return new WP_REST_Response(
			array(
				'applied'      => true,
				'component_id' => $component_id,
				'post_id'      => $post_id,
				'position'     => $position,
				'elements_added' => count( $remapped ),
			),
			200
		);
	}

	/**
	 * POST /bricks/search-elements — Search Bricks elements across posts.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function bricks_search_elements( WP_REST_Request $request ): WP_REST_Response {
		$body       = $request->get_json_params();
		$element_type = isset( $body['type'] ) ? sanitize_text_field( $body['type'] ) : '';
		$search_text  = isset( $body['text'] ) ? sanitize_text_field( $body['text'] ) : '';
		$css_class    = isset( $body['class'] ) ? sanitize_text_field( $body['class'] ) : '';
		$limit        = isset( $body['limit'] ) ? min( absint( $body['limit'] ), 100 ) : 25;

		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT post_id, meta_value FROM {$wpdb->postmeta}
				WHERE meta_key = %s
				LIMIT %d",
				'_bricks_page_content_2',
				500
			)
		);

		$results = array();

		foreach ( $rows as $row ) {
			$elements = maybe_unserialize( $row->meta_value );

			if ( ! is_array( $elements ) ) {
				continue;
			}

			foreach ( $elements as $element ) {
				if ( ! is_array( $element ) ) {
					continue;
				}

				// Filter by type.
				if ( $element_type && ( ! isset( $element['name'] ) || $element['name'] !== $element_type ) ) {
					continue;
				}

				// Filter by CSS class.
				if ( $css_class ) {
					$el_classes = isset( $element['settings']['_cssClasses'] ) ? $element['settings']['_cssClasses'] : '';
					if ( false === strpos( $el_classes, $css_class ) ) {
						continue;
					}
				}

				// Filter by text content.
				if ( $search_text ) {
					$serialized = wp_json_encode( $element );
					if ( false === stripos( $serialized, $search_text ) ) {
						continue;
					}
				}

				$results[] = array(
					'post_id'    => (int) $row->post_id,
					'element_id' => isset( $element['id'] ) ? $element['id'] : '',
					'type'       => isset( $element['name'] ) ? $element['name'] : 'unknown',
					'settings'   => isset( $element['settings'] ) ? $element['settings'] : array(),
				);

				if ( count( $results ) >= $limit ) {
					break 2;
				}
			}
		}

		return new WP_REST_Response(
			array(
				'results' => $results,
				'total'   => count( $results ),
			),
			200
		);
	}

	/**
	 * GET /bricks/health-check/{post_id} — Health check Bricks content.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_health_check( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$content = get_post_meta( $post_id, '_bricks_page_content_2', true );
		$issues  = array();
		$stats   = array(
			'element_count'    => 0,
			'nesting_depth'    => 0,
			'orphaned_children' => 0,
			'duplicate_ids'    => 0,
		);

		if ( ! is_array( $content ) || empty( $content ) ) {
			$issues[] = array(
				'severity' => 'warning',
				'message'  => __( 'No Bricks content found for this post.', 'cmsmcp' ),
			);

			return new WP_REST_Response(
				array(
					'post_id' => $post_id,
					'healthy' => empty( $issues ),
					'issues'  => $issues,
					'stats'   => $stats,
				),
				200
			);
		}

		$stats['element_count'] = count( $content );
		$ids_seen               = array();
		$parent_ids             = array();

		foreach ( $content as $element ) {
			if ( ! is_array( $element ) ) {
				$issues[] = array(
					'severity' => 'error',
					'message'  => __( 'Non-array element found in Bricks content.', 'cmsmcp' ),
				);
				continue;
			}

			$el_id = isset( $element['id'] ) ? $element['id'] : '';

			// Duplicate ID check.
			if ( $el_id && in_array( $el_id, $ids_seen, true ) ) {
				++$stats['duplicate_ids'];
				$issues[] = array(
					'severity'   => 'error',
					'message'    => __( 'Duplicate element ID found.', 'cmsmcp' ),
					'element_id' => $el_id,
				);
			}
			$ids_seen[] = $el_id;

			// Track parent IDs.
			if ( ! empty( $element['parent'] ) ) {
				$parent_ids[] = $element['parent'];
			}

			// Missing name.
			if ( empty( $element['name'] ) ) {
				$issues[] = array(
					'severity'   => 'warning',
					'message'    => __( 'Element has no type/name defined.', 'cmsmcp' ),
					'element_id' => $el_id,
				);
			}
		}

		// Check for orphaned children (parent ID doesn't exist).
		foreach ( $parent_ids as $pid ) {
			if ( ! in_array( $pid, $ids_seen, true ) ) {
				++$stats['orphaned_children'];
				$issues[] = array(
					'severity'  => 'error',
					'message'   => __( 'Element references a non-existent parent.', 'cmsmcp' ),
					'parent_id' => $pid,
				);
			}
		}

		// Calculate nesting depth.
		$stats['nesting_depth'] = self::bricks_calculate_nesting_depth( $content );

		return new WP_REST_Response(
			array(
				'post_id' => $post_id,
				'healthy' => empty( array_filter( $issues, function ( $i ) { return 'error' === $i['severity']; } ) ),
				'issues'  => $issues,
				'stats'   => $stats,
			),
			200
		);
	}

	/**
	 * GET /bricks/style-profile/{post_id} — Analyze style usage in a post.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function bricks_style_profile( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$content = get_post_meta( $post_id, '_bricks_page_content_2', true );

		if ( ! is_array( $content ) ) {
			$content = array();
		}

		$css_classes    = array();
		$inline_styles  = 0;
		$element_types  = array();
		$global_classes = array();

		foreach ( $content as $element ) {
			if ( ! is_array( $element ) ) {
				continue;
			}

			// Count element types.
			$type = isset( $element['name'] ) ? $element['name'] : 'unknown';
			if ( ! isset( $element_types[ $type ] ) ) {
				$element_types[ $type ] = 0;
			}
			++$element_types[ $type ];

			$settings = isset( $element['settings'] ) ? $element['settings'] : array();

			// Collect CSS classes.
			if ( ! empty( $settings['_cssClasses'] ) ) {
				$parts = preg_split( '/\s+/', trim( $settings['_cssClasses'] ) );
				foreach ( $parts as $cls ) {
					$cls = trim( $cls );
					if ( '' !== $cls ) {
						if ( ! isset( $css_classes[ $cls ] ) ) {
							$css_classes[ $cls ] = 0;
						}
						++$css_classes[ $cls ];
					}
				}
			}

			// Collect global class references.
			if ( ! empty( $settings['_cssGlobalClasses'] ) && is_array( $settings['_cssGlobalClasses'] ) ) {
				foreach ( $settings['_cssGlobalClasses'] as $gc ) {
					$gc_id = is_string( $gc ) ? $gc : '';
					if ( $gc_id && ! isset( $global_classes[ $gc_id ] ) ) {
						$global_classes[ $gc_id ] = 0;
					}
					if ( $gc_id ) {
						++$global_classes[ $gc_id ];
					}
				}
			}

			// Count inline styles.
			if ( ! empty( $settings['_background'] ) || ! empty( $settings['_typography'] ) || ! empty( $settings['_border'] ) ) {
				++$inline_styles;
			}
		}

		arsort( $css_classes );
		arsort( $element_types );
		arsort( $global_classes );

		return new WP_REST_Response(
			array(
				'post_id'           => $post_id,
				'element_count'     => count( $content ),
				'element_types'     => $element_types,
				'css_classes'       => $css_classes,
				'global_classes'    => $global_classes,
				'inline_style_count' => $inline_styles,
			),
			200
		);
	}

	/**
	 * GET /bricks/design-system — Aggregate design system information.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function bricks_design_system( WP_REST_Request $request ): WP_REST_Response {
		$global_classes = get_option( 'bricks_global_classes', array() );
		$theme_styles   = get_option( 'bricks_theme_styles', array() );
		$color_palette  = get_option( 'bricks_color_palette', array() );
		$typography     = get_option( 'bricks_typography', array() );

		// Count components.
		$component_count = wp_count_posts( 'bricks_template' );
		$total_components = 0;
		if ( $component_count && isset( $component_count->publish ) ) {
			$total_components = (int) $component_count->publish;
		}

		return new WP_REST_Response(
			array(
				'global_classes'   => array(
					'count'   => is_array( $global_classes ) ? count( $global_classes ) : 0,
					'classes' => is_array( $global_classes ) ? $global_classes : array(),
				),
				'theme_styles'     => is_array( $theme_styles ) ? $theme_styles : array(),
				'color_palette'    => is_array( $color_palette ) ? $color_palette : array(),
				'typography'       => is_array( $typography ) ? $typography : array(),
				'components_count' => $total_components,
			),
			200
		);
	}

	// -------------------------------------------------------------------------
	// Builder widget callback
	// -------------------------------------------------------------------------

	/**
	 * POST /builder/widget/{post_id} — Add a widget via the active builder.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function add_builder_widget( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$post    = get_post( $post_id );

		if ( ! $post ) {
			return new WP_Error(
				'cmsmcp_post_not_found',
				__( 'Post not found.', 'cmsmcp' ),
				array( 'status' => 404 )
			);
		}

		$body     = $request->get_json_params();
		$type     = isset( $body['type'] ) ? sanitize_text_field( $body['type'] ) : '';
		$settings = isset( $body['settings'] ) && is_array( $body['settings'] )
			? self::sanitize_recursive( $body['settings'] )
			: array();
		$position = isset( $body['position'] ) ? sanitize_text_field( $body['position'] ) : 'bottom';

		if ( empty( $type ) ) {
			return new WP_Error(
				'cmsmcp_missing_param',
				__( 'The "type" field is required (e.g., heading, text, image, button).', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$detector = CmsMcp_Builder_Detector::detect_for_post( $post_id );

		if ( empty( $detector ) ) {
			return new WP_Error(
				'cmsmcp_no_builder',
				__( 'No supported page builder detected for this post.', 'cmsmcp' ),
				array( 'status' => 400 )
			);
		}

		$builder = CmsMcp_Builder_Detector::get_builder_instance( $detector );

		if ( ! method_exists( $builder, 'add_widget' ) ) {
			return new WP_Error(
				'cmsmcp_unsupported_operation',
				/* translators: %s: builder name */
				sprintf( __( 'The "%s" builder does not support the add_widget operation.', 'cmsmcp' ), $detector ),
				array( 'status' => 501 )
			);
		}

		$result = $builder->add_widget( $post_id, $type, $settings, $position );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response(
			array(
				'post_id'  => $post_id,
				'builder'  => $detector,
				'type'     => $type,
				'position' => $position,
				'element'  => $result,
				'success'  => true,
			),
			201
		);
	}

	// -------------------------------------------------------------------------
	// Bricks helper methods
	// -------------------------------------------------------------------------

	/**
	 * Count Bricks elements in a post.
	 *
	 * @param int $post_id The post ID.
	 * @return int Element count.
	 */
	private static function bricks_count_elements( int $post_id ): int {
		$content = get_post_meta( $post_id, '_bricks_page_content_2', true );

		return is_array( $content ) ? count( $content ) : 0;
	}

	/**
	 * Re-map element IDs in Bricks content to avoid collisions.
	 *
	 * @param array $elements The Bricks elements array.
	 * @return array Elements with new unique IDs.
	 */
	private static function bricks_remap_element_ids( array $elements ): array {
		$id_map = array();

		// Build ID map.
		foreach ( $elements as $element ) {
			if ( isset( $element['id'] ) ) {
				$id_map[ $element['id'] ] = substr( wp_generate_uuid4(), 0, 6 );
			}
		}

		// Apply map.
		foreach ( $elements as $index => $element ) {
			if ( isset( $element['id'] ) && isset( $id_map[ $element['id'] ] ) ) {
				$elements[ $index ]['id'] = $id_map[ $element['id'] ];
			}
			if ( ! empty( $element['parent'] ) && isset( $id_map[ $element['parent'] ] ) ) {
				$elements[ $index ]['parent'] = $id_map[ $element['parent'] ];
			}
		}

		return $elements;
	}

	/**
	 * Calculate the maximum nesting depth of Bricks elements.
	 *
	 * @param array $elements The Bricks elements array.
	 * @return int Maximum nesting depth.
	 */
	private static function bricks_calculate_nesting_depth( array $elements ): int {
		$children_map = array();
		$root_ids     = array();

		foreach ( $elements as $element ) {
			$el_id = isset( $element['id'] ) ? $element['id'] : '';

			if ( ! empty( $element['parent'] ) ) {
				$children_map[ $element['parent'] ][] = $el_id;
			} else {
				$root_ids[] = $el_id;
			}
		}

		$max_depth = 0;

		foreach ( $root_ids as $root_id ) {
			$depth = self::bricks_depth_recursive( $root_id, $children_map, 1 );
			if ( $depth > $max_depth ) {
				$max_depth = $depth;
			}
		}

		return $max_depth;
	}

	/**
	 * Recursively calculate depth for a given element.
	 *
	 * @param string $element_id   The element ID.
	 * @param array  $children_map Map of parent_id => child_ids.
	 * @param int    $current      Current depth.
	 * @return int Maximum depth from this element.
	 */
	private static function bricks_depth_recursive( string $element_id, array $children_map, int $current ): int {
		if ( empty( $children_map[ $element_id ] ) ) {
			return $current;
		}

		$max = $current;

		foreach ( $children_map[ $element_id ] as $child_id ) {
			$child_depth = self::bricks_depth_recursive( $child_id, $children_map, $current + 1 );
			if ( $child_depth > $max ) {
				$max = $child_depth;
			}
		}

		return $max;
	}

	/**
	 * Recursively sanitize an array of mixed values.
	 *
	 * @param array $data The data to sanitize.
	 * @return array Sanitized data.
	 */
	private static function sanitize_recursive( array $data ): array {
		$sanitized = array();

		foreach ( $data as $key => $value ) {
			$clean_key = is_string( $key ) ? sanitize_text_field( $key ) : $key;

			if ( is_array( $value ) ) {
				$sanitized[ $clean_key ] = self::sanitize_recursive( $value );
			} elseif ( is_string( $value ) ) {
				$sanitized[ $clean_key ] = sanitize_text_field( $value );
			} elseif ( is_int( $value ) || is_float( $value ) ) {
				$sanitized[ $clean_key ] = $value;
			} elseif ( is_bool( $value ) ) {
				$sanitized[ $clean_key ] = $value;
			} else {
				$sanitized[ $clean_key ] = sanitize_text_field( (string) $value );
			}
		}

		return $sanitized;
	}

	// -------------------------------------------------------------------------
	// Argument helpers
	// -------------------------------------------------------------------------

	/**
	 * Get common post_id argument definition.
	 *
	 * @return array Argument definition array.
	 */
	private static function get_post_id_args(): array {
		return array(
			'post_id' => array(
				'required'          => true,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'validate_callback' => array( self::class, 'validate_positive_int' ),
				'description'       => __( 'The WordPress post ID.', 'cmsmcp' ),
			),
		);
	}

	/**
	 * Validate that a value is a positive integer.
	 *
	 * @param mixed           $value   The value to validate.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param   The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public static function validate_positive_int( $value, $request, $param ) {
		$value = absint( $value );

		if ( $value < 1 ) {
			return new WP_Error(
				'cmsmcp_invalid_param',
				/* translators: %s: parameter name */
				sprintf( __( '%s must be a positive integer.', 'cmsmcp' ), $param ),
				array( 'status' => 400 )
			);
		}

		return true;
	}
}
