<?php
/**
 * Admin Pages for CMS MCP Hub.
 *
 * Renders the dashboard, API keys management, and settings pages
 * in the WordPress admin area.
 *
 * @package CmsMcpHub
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class CmsMcp_Admin_Page
 *
 * Handles all admin page rendering and form processing.
 */
class CmsMcp_Admin_Page {

	/**
	 * Render the main dashboard page.
	 *
	 * Shows plugin status, active builders, snapshot count,
	 * recent API key usage, and quick links.
	 *
	 * @return void
	 */
	public static function render(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'cmsmcp' ) );
		}

		// Gather dashboard data.
		$builders       = class_exists( 'CmsMcp_Builder_Detector' ) ? CmsMcp_Builder_Detector::detect_all() : array();
		$snapshot_count = class_exists( 'CmsMcp_Snapshot_Manager' ) ? CmsMcp_Snapshot_Manager::count_all() : 0;
		$api_keys       = class_exists( 'CmsMcp_API_Keys' ) ? CmsMcp_API_Keys::list_keys() : array();
		$auto_snapshot  = get_option( 'cmsmcp_auto_snapshot', true );

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'CMS MCP Hub', 'cmsmcp' ); ?></h1>

			<div id="cmsmcp-dashboard" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">

				<!-- Plugin Status -->
				<div class="card" style="padding: 15px 20px;">
					<h2 style="margin-top: 0;"><?php esc_html_e( 'Plugin Status', 'cmsmcp' ); ?></h2>
					<table class="widefat striped" style="border: none;">
						<tbody>
							<tr>
								<td><strong><?php esc_html_e( 'Version', 'cmsmcp' ); ?></strong></td>
								<td><?php echo esc_html( CMSMCP_VERSION ); ?></td>
							</tr>
							<tr>
								<td><strong><?php esc_html_e( 'Auto Snapshots', 'cmsmcp' ); ?></strong></td>
								<td>
									<?php if ( $auto_snapshot ) : ?>
										<span style="color: #00a32a;">&#9679; <?php esc_html_e( 'Enabled', 'cmsmcp' ); ?></span>
									<?php else : ?>
										<span style="color: #d63638;">&#9679; <?php esc_html_e( 'Disabled', 'cmsmcp' ); ?></span>
									<?php endif; ?>
								</td>
							</tr>
							<tr>
								<td><strong><?php esc_html_e( 'API Keys', 'cmsmcp' ); ?></strong></td>
								<td><?php echo esc_html( count( $api_keys ) ); ?></td>
							</tr>
							<tr>
								<td><strong><?php esc_html_e( 'Total Snapshots', 'cmsmcp' ); ?></strong></td>
								<td><?php echo esc_html( number_format_i18n( $snapshot_count ) ); ?></td>
							</tr>
						</tbody>
					</table>
				</div>

				<!-- Active Builders -->
				<div class="card" style="padding: 15px 20px;">
					<h2 style="margin-top: 0;"><?php esc_html_e( 'Active Page Builders', 'cmsmcp' ); ?></h2>
					<?php if ( empty( $builders ) ) : ?>
						<p><?php esc_html_e( 'No page builders detected.', 'cmsmcp' ); ?></p>
					<?php else : ?>
						<table class="widefat striped" style="border: none;">
							<thead>
								<tr>
									<th><?php esc_html_e( 'Builder', 'cmsmcp' ); ?></th>
									<th><?php esc_html_e( 'Version', 'cmsmcp' ); ?></th>
									<th><?php esc_html_e( 'Support', 'cmsmcp' ); ?></th>
								</tr>
							</thead>
							<tbody>
								<?php foreach ( $builders as $builder ) : ?>
									<tr>
										<td><?php echo esc_html( $builder['name'] ); ?></td>
										<td><?php echo esc_html( $builder['version'] ); ?></td>
										<td>
											<?php
											$support_colors = array(
												'full'     => '#00a32a',
												'standard' => '#dba617',
												'basic'    => '#d63638',
											);
											$color = $support_colors[ $builder['support_level'] ] ?? '#666';
											?>
											<span style="color: <?php echo esc_attr( $color ); ?>;">
												<?php echo esc_html( ucfirst( $builder['support_level'] ) ); ?>
											</span>
										</td>
									</tr>
								<?php endforeach; ?>
							</tbody>
						</table>
					<?php endif; ?>
				</div>

				<!-- Recent API Key Usage -->
				<div class="card" style="padding: 15px 20px;">
					<h2 style="margin-top: 0;"><?php esc_html_e( 'Recent API Key Usage', 'cmsmcp' ); ?></h2>
					<?php if ( empty( $api_keys ) ) : ?>
						<p><?php esc_html_e( 'No API keys created yet.', 'cmsmcp' ); ?></p>
						<p>
							<a href="<?php echo esc_url( admin_url( 'admin.php?page=cmsmcp-api-keys' ) ); ?>" class="button button-primary">
								<?php esc_html_e( 'Create API Key', 'cmsmcp' ); ?>
							</a>
						</p>
					<?php else : ?>
						<table class="widefat striped" style="border: none;">
							<thead>
								<tr>
									<th><?php esc_html_e( 'Name', 'cmsmcp' ); ?></th>
									<th><?php esc_html_e( 'Last Used', 'cmsmcp' ); ?></th>
								</tr>
							</thead>
							<tbody>
								<?php foreach ( array_slice( $api_keys, 0, 5 ) as $key ) : ?>
									<tr>
										<td><?php echo esc_html( $key->name ); ?></td>
										<td>
											<?php
											echo $key->last_used
												? esc_html( human_time_diff( strtotime( $key->last_used ), time() ) . ' ' . __( 'ago', 'cmsmcp' ) )
												: esc_html__( 'Never', 'cmsmcp' );
											?>
										</td>
									</tr>
								<?php endforeach; ?>
							</tbody>
						</table>
					<?php endif; ?>
				</div>

				<!-- Quick Links -->
				<div class="card" style="padding: 15px 20px;">
					<h2 style="margin-top: 0;"><?php esc_html_e( 'Quick Links', 'cmsmcp' ); ?></h2>
					<ul style="list-style: disc; padding-left: 20px;">
						<li>
							<a href="<?php echo esc_url( admin_url( 'admin.php?page=cmsmcp-api-keys' ) ); ?>">
								<?php esc_html_e( 'Manage API Keys', 'cmsmcp' ); ?>
							</a>
						</li>
						<li>
							<a href="<?php echo esc_url( admin_url( 'admin.php?page=cmsmcp-settings' ) ); ?>">
								<?php esc_html_e( 'Plugin Settings', 'cmsmcp' ); ?>
							</a>
						</li>
						<li>
							<a href="https://github.com/rahhuul/cms-mcp-hub" target="_blank" rel="noopener noreferrer">
								<?php esc_html_e( 'Documentation', 'cmsmcp' ); ?>
							</a>
						</li>
						<li>
							<a href="https://www.npmjs.com/package/@cmsmcp/wordpress" target="_blank" rel="noopener noreferrer">
								<?php esc_html_e( 'MCP Server (npm)', 'cmsmcp' ); ?>
							</a>
						</li>
					</ul>
				</div>

			</div><!-- #cmsmcp-dashboard -->
		</div><!-- .wrap -->
		<?php
	}

	/**
	 * Render the API Keys management page.
	 *
	 * Handles key generation form, displays existing keys,
	 * and processes key revocation.
	 *
	 * @return void
	 */
	public static function render_api_keys(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'cmsmcp' ) );
		}

		$new_key  = null;
		$message  = '';
		$msg_type = 'success';

		// Handle key generation.
		if ( isset( $_POST['cmsmcp_generate_key'] ) && check_admin_referer( 'cmsmcp_generate_key_nonce', 'cmsmcp_nonce' ) ) {
			$key_name = isset( $_POST['cmsmcp_key_name'] ) ? sanitize_text_field( wp_unslash( $_POST['cmsmcp_key_name'] ) ) : '';

			if ( empty( $key_name ) ) {
				$message  = __( 'Please enter a name for the API key.', 'cmsmcp' );
				$msg_type = 'error';
			} else {
				try {
					$new_key = CmsMcp_API_Keys::generate_key( $key_name, get_current_user_id() );
					$message = __( 'API key generated successfully. Copy it now — it will not be shown again.', 'cmsmcp' );
				} catch ( \RuntimeException $e ) {
					$message  = $e->getMessage();
					$msg_type = 'error';
				}
			}
		}

		// Handle key revocation.
		if ( isset( $_GET['action'] ) && 'revoke' === $_GET['action'] && isset( $_GET['key_id'] ) ) {
			$key_id = absint( $_GET['key_id'] );

			if ( check_admin_referer( 'cmsmcp_revoke_key_' . $key_id ) ) {
				$revoked = CmsMcp_API_Keys::revoke_key( $key_id );

				if ( $revoked ) {
					$message = __( 'API key revoked successfully.', 'cmsmcp' );
				} else {
					$message  = __( 'Failed to revoke API key.', 'cmsmcp' );
					$msg_type = 'error';
				}
			}
		}

		$api_keys = CmsMcp_API_Keys::list_keys();

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'API Keys', 'cmsmcp' ); ?></h1>

			<?php if ( ! empty( $message ) ) : ?>
				<div class="notice notice-<?php echo esc_attr( $msg_type ); ?> is-dismissible">
					<p><?php echo esc_html( $message ); ?></p>
				</div>
			<?php endif; ?>

			<?php if ( null !== $new_key ) : ?>
				<div class="notice notice-warning" style="padding: 15px; border-left-color: #00a32a;">
					<h3 style="margin-top: 0;"><?php esc_html_e( 'Your New API Key', 'cmsmcp' ); ?></h3>
					<p><?php esc_html_e( 'Copy this key now. It will not be shown again.', 'cmsmcp' ); ?></p>
					<div style="display: flex; gap: 10px; align-items: center;">
						<code id="cmsmcp-new-key" style="font-size: 14px; padding: 8px 12px; background: #f0f0f1; border: 1px solid #c3c4c7; border-radius: 4px; user-select: all; flex: 1;">
							<?php echo esc_html( $new_key ); ?>
						</code>
						<button type="button" class="button" onclick="navigator.clipboard.writeText(document.getElementById('cmsmcp-new-key').textContent.trim()).then(function(){alert('Copied!')})">
							<?php esc_html_e( 'Copy', 'cmsmcp' ); ?>
						</button>
					</div>
				</div>
			<?php endif; ?>

			<!-- Generate New Key -->
			<div class="card" style="max-width: 600px; padding: 15px 20px; margin-top: 20px;">
				<h2 style="margin-top: 0;"><?php esc_html_e( 'Generate New API Key', 'cmsmcp' ); ?></h2>
				<form method="post">
					<?php wp_nonce_field( 'cmsmcp_generate_key_nonce', 'cmsmcp_nonce' ); ?>
					<table class="form-table" role="presentation">
						<tr>
							<th scope="row">
								<label for="cmsmcp_key_name"><?php esc_html_e( 'Key Name', 'cmsmcp' ); ?></label>
							</th>
							<td>
								<input type="text"
								       id="cmsmcp_key_name"
								       name="cmsmcp_key_name"
								       class="regular-text"
								       placeholder="<?php esc_attr_e( 'e.g., Claude Desktop, Cursor IDE', 'cmsmcp' ); ?>"
								       required />
								<p class="description">
									<?php esc_html_e( 'A label to identify where this key is used.', 'cmsmcp' ); ?>
								</p>
							</td>
						</tr>
					</table>
					<?php submit_button( __( 'Generate API Key', 'cmsmcp' ), 'primary', 'cmsmcp_generate_key' ); ?>
				</form>
			</div>

			<!-- Existing Keys -->
			<div style="margin-top: 20px;">
				<h2><?php esc_html_e( 'Existing API Keys', 'cmsmcp' ); ?></h2>

				<?php if ( empty( $api_keys ) ) : ?>
					<p><?php esc_html_e( 'No API keys have been created yet.', 'cmsmcp' ); ?></p>
				<?php else : ?>
					<table class="wp-list-table widefat fixed striped">
						<thead>
							<tr>
								<th scope="col"><?php esc_html_e( 'Name', 'cmsmcp' ); ?></th>
								<th scope="col"><?php esc_html_e( 'Key Prefix', 'cmsmcp' ); ?></th>
								<th scope="col"><?php esc_html_e( 'Created', 'cmsmcp' ); ?></th>
								<th scope="col"><?php esc_html_e( 'Last Used', 'cmsmcp' ); ?></th>
								<th scope="col"><?php esc_html_e( 'Actions', 'cmsmcp' ); ?></th>
							</tr>
						</thead>
						<tbody>
							<?php foreach ( $api_keys as $key ) : ?>
								<tr>
									<td>
										<strong><?php echo esc_html( $key->name ); ?></strong>
									</td>
									<td>
										<code><?php echo esc_html( $key->key_prefix ); ?>...</code>
									</td>
									<td>
										<?php echo esc_html( date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $key->created_at ) ) ); ?>
									</td>
									<td>
										<?php
										echo $key->last_used
											? esc_html( human_time_diff( strtotime( $key->last_used ), time() ) . ' ' . __( 'ago', 'cmsmcp' ) )
											: esc_html__( 'Never', 'cmsmcp' );
										?>
									</td>
									<td>
										<?php
										$revoke_url = wp_nonce_url(
											add_query_arg(
												array(
													'page'   => 'cmsmcp-api-keys',
													'action' => 'revoke',
													'key_id' => $key->id,
												),
												admin_url( 'admin.php' )
											),
											'cmsmcp_revoke_key_' . $key->id
										);
										?>
										<a href="<?php echo esc_url( $revoke_url ); ?>"
										   class="button button-small"
										   style="color: #d63638;"
										   onclick="return confirm('<?php echo esc_js( __( 'Are you sure you want to revoke this API key? This cannot be undone.', 'cmsmcp' ) ); ?>')">
											<?php esc_html_e( 'Revoke', 'cmsmcp' ); ?>
										</a>
									</td>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				<?php endif; ?>
			</div>
		</div><!-- .wrap -->
		<?php
	}

	/**
	 * Render the settings page.
	 *
	 * Provides controls for auto-snapshot, snapshot retention,
	 * and tool governance.
	 *
	 * @return void
	 */
	public static function render_settings(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'cmsmcp' ) );
		}

		// Handle settings save.
		if ( isset( $_POST['cmsmcp_save_settings'] ) && check_admin_referer( 'cmsmcp_settings_nonce', 'cmsmcp_settings_nonce_field' ) ) {
			// Auto snapshot.
			$auto_snapshot = isset( $_POST['cmsmcp_auto_snapshot'] ) ? true : false;
			update_option( 'cmsmcp_auto_snapshot', $auto_snapshot );

			// Snapshot retention.
			$retention = isset( $_POST['cmsmcp_snapshot_retention'] ) ? absint( $_POST['cmsmcp_snapshot_retention'] ) : 50;
			$retention = max( 5, min( 500, $retention ) );
			update_option( 'cmsmcp_snapshot_retention', $retention );

			// Tool governance.
			$enabled_tools = array();
			if ( isset( $_POST['cmsmcp_enabled_tools'] ) && is_array( $_POST['cmsmcp_enabled_tools'] ) ) {
				$enabled_tools = array_map( 'sanitize_text_field', wp_unslash( $_POST['cmsmcp_enabled_tools'] ) );
			}
			update_option( 'cmsmcp_enabled_tools', $enabled_tools );

			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Settings saved.', 'cmsmcp' ) . '</p></div>';
		}

		$auto_snapshot = get_option( 'cmsmcp_auto_snapshot', true );
		$retention     = get_option( 'cmsmcp_snapshot_retention', 50 );
		$enabled_tools = get_option( 'cmsmcp_enabled_tools', array() );

		// Tool categories.
		$tool_categories = array(
			'content'       => array(
				'label'       => __( 'Content Management', 'cmsmcp' ),
				'description' => __( 'Create, read, update, delete posts and pages.', 'cmsmcp' ),
			),
			'media'         => array(
				'label'       => __( 'Media Management', 'cmsmcp' ),
				'description' => __( 'Upload, list, and manage media files.', 'cmsmcp' ),
			),
			'taxonomy'      => array(
				'label'       => __( 'Taxonomies', 'cmsmcp' ),
				'description' => __( 'Manage categories, tags, and custom taxonomies.', 'cmsmcp' ),
			),
			'users'         => array(
				'label'       => __( 'User Management', 'cmsmcp' ),
				'description' => __( 'List and manage WordPress users.', 'cmsmcp' ),
			),
			'snapshots'     => array(
				'label'       => __( 'Snapshots', 'cmsmcp' ),
				'description' => __( 'Create, list, restore, and diff content snapshots.', 'cmsmcp' ),
			),
			'analysis'      => array(
				'label'       => __( 'Analysis Tools', 'cmsmcp' ),
				'description' => __( 'SEO analysis, accessibility scanning, performance checks.', 'cmsmcp' ),
			),
			'builders'      => array(
				'label'       => __( 'Page Builder Support', 'cmsmcp' ),
				'description' => __( 'Read and write page builder data (Elementor, Divi, Bricks, etc.).', 'cmsmcp' ),
			),
			'settings'      => array(
				'label'       => __( 'Site Settings', 'cmsmcp' ),
				'description' => __( 'Read WordPress site settings and configuration.', 'cmsmcp' ),
			),
		);

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'CMS MCP Hub Settings', 'cmsmcp' ); ?></h1>

			<form method="post">
				<?php wp_nonce_field( 'cmsmcp_settings_nonce', 'cmsmcp_settings_nonce_field' ); ?>

				<!-- Snapshots Section -->
				<h2><?php esc_html_e( 'Snapshots', 'cmsmcp' ); ?></h2>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><?php esc_html_e( 'Auto Snapshots', 'cmsmcp' ); ?></th>
						<td>
							<label>
								<input type="checkbox"
								       name="cmsmcp_auto_snapshot"
								       value="1"
								       <?php checked( $auto_snapshot ); ?> />
								<?php esc_html_e( 'Automatically create a snapshot before AI edits', 'cmsmcp' ); ?>
							</label>
							<p class="description">
								<?php esc_html_e( 'When enabled, a snapshot is created before the MCP server modifies any post content. This allows you to restore the previous version.', 'cmsmcp' ); ?>
							</p>
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="cmsmcp_snapshot_retention"><?php esc_html_e( 'Snapshot Retention', 'cmsmcp' ); ?></label>
						</th>
						<td>
							<input type="number"
							       id="cmsmcp_snapshot_retention"
							       name="cmsmcp_snapshot_retention"
							       value="<?php echo esc_attr( $retention ); ?>"
							       min="5"
							       max="500"
							       step="1"
							       class="small-text" />
							<span><?php esc_html_e( 'snapshots per post', 'cmsmcp' ); ?></span>
							<p class="description">
								<?php esc_html_e( 'Number of snapshots to keep per post. Older snapshots are automatically deleted. Min: 5, Max: 500.', 'cmsmcp' ); ?>
							</p>
						</td>
					</tr>
				</table>

				<!-- Tool Governance Section -->
				<h2><?php esc_html_e( 'Tool Governance', 'cmsmcp' ); ?></h2>
				<p class="description" style="margin-bottom: 15px;">
					<?php esc_html_e( 'Control which tool categories are available to AI agents via the MCP server. Unchecked categories will be disabled.', 'cmsmcp' ); ?>
				</p>

				<table class="form-table" role="presentation">
					<?php foreach ( $tool_categories as $slug => $category ) : ?>
						<tr>
							<th scope="row"><?php echo esc_html( $category['label'] ); ?></th>
							<td>
								<label>
									<input type="checkbox"
									       name="cmsmcp_enabled_tools[]"
									       value="<?php echo esc_attr( $slug ); ?>"
									       <?php checked( empty( $enabled_tools ) || in_array( $slug, $enabled_tools, true ) ); ?> />
									<?php esc_html_e( 'Enable', 'cmsmcp' ); ?>
								</label>
								<p class="description"><?php echo esc_html( $category['description'] ); ?></p>
							</td>
						</tr>
					<?php endforeach; ?>
				</table>

				<?php submit_button( __( 'Save Settings', 'cmsmcp' ), 'primary', 'cmsmcp_save_settings' ); ?>
			</form>
		</div><!-- .wrap -->
		<?php
	}
}
