<?php
/**
 * Authentication middleware for CMS MCP Hub REST API.
 *
 * Validates API keys from request headers or query parameters
 * and sets the current WordPress user accordingly.
 *
 * @package CmsMcpHub
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class CmsMcp_Auth
 *
 * Provides static methods used as permission callbacks for REST API routes.
 */
class CmsMcp_Auth {

	/**
	 * Header name for API key authentication.
	 *
	 * @var string
	 */
	const HEADER_NAME = 'X-CmsMcp-API-Key';

	/**
	 * Query parameter name for API key authentication.
	 *
	 * @var string
	 */
	const QUERY_PARAM = 'cmsmcp_api_key';

	/**
	 * Authenticate the current REST request.
	 *
	 * Checks for an API key in the X-CmsMcp-API-Key header first,
	 * then falls back to the cmsmcp_api_key query parameter.
	 * On success, sets the current WordPress user and returns the user ID.
	 *
	 * @param WP_REST_Request $request The incoming REST request.
	 * @return int|WP_Error The authenticated user ID, or WP_Error on failure.
	 */
	public static function authenticate( WP_REST_Request $request ) {
		$api_key = self::extract_key( $request );

		if ( empty( $api_key ) ) {
			return new WP_Error(
				'cmsmcp_missing_api_key',
				__( 'API key is required. Provide it via the X-CmsMcp-API-Key header or cmsmcp_api_key query parameter.', 'cmsmcp' ),
				array( 'status' => 401 )
			);
		}

		$user_id = CmsMcp_API_Keys::validate_key( $api_key );

		if ( false === $user_id ) {
			return new WP_Error(
				'cmsmcp_invalid_api_key',
				__( 'The provided API key is invalid or has been revoked.', 'cmsmcp' ),
				array( 'status' => 403 )
			);
		}

		// Verify the associated user still exists.
		$user = get_userdata( $user_id );

		if ( false === $user ) {
			return new WP_Error(
				'cmsmcp_user_not_found',
				__( 'The user associated with this API key no longer exists.', 'cmsmcp' ),
				array( 'status' => 403 )
			);
		}

		// Set the current user for capability checks downstream.
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Permission callback for REST routes.
	 *
	 * Used as the permission_callback in register_rest_route().
	 * Returns true if authentication succeeds, or a WP_Error on failure.
	 *
	 * @param WP_REST_Request $request The incoming REST request.
	 * @return bool|WP_Error True if authorized, WP_Error otherwise.
	 */
	public static function check_permission( WP_REST_Request $request ) {
		$result = self::authenticate( $request );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Extract the API key from the request.
	 *
	 * Checks the header first, then the query parameter.
	 *
	 * @param WP_REST_Request $request The incoming REST request.
	 * @return string|null The API key string, or null if not found.
	 */
	private static function extract_key( WP_REST_Request $request ): ?string {
		// Check header first.
		$header_key = $request->get_header( 'x_cmsmcp_api_key' );

		if ( ! empty( $header_key ) ) {
			return sanitize_text_field( $header_key );
		}

		// Fallback to query parameter.
		$query_key = $request->get_param( self::QUERY_PARAM );

		if ( ! empty( $query_key ) ) {
			return sanitize_text_field( $query_key );
		}

		return null;
	}
}
