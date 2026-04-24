<?php
/**
 * WPBakery Page Builder implementation.
 *
 * @package CmsMcpHub
 */

defined( 'ABSPATH' ) || exit;

/**
 * WPBakery page builder support.
 *
 * WPBakery stores content as shortcodes in post_content
 * (e.g., [vc_row][vc_column][vc_column_text]...[/vc_column_text][/vc_column][/vc_row]).
 * Custom CSS is stored in `_wpb_shortcodes_custom_css` meta.
 */
class CmsMcp_WPBakery extends CmsMcp_Builder_Base {

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		return 'wpbakery';
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_name(): string {
		return 'WPBakery Page Builder';
	}

	/**
	 * {@inheritDoc}
	 */
	public function extract_content( int $post_id ): array {
		$content = get_post_field( 'post_content', $post_id );

		if ( empty( $content ) || strpos( $content, '[vc_row' ) === false ) {
			return [];
		}

		return $this->parse_wpbakery_shortcodes( $content );
	}

	/**
	 * {@inheritDoc}
	 */
	public function inject_content( int $post_id, array $content ): bool {
		$serialized = $this->serialize_shortcodes( $content );

		$result = wp_update_post( [
			'ID'           => $post_id,
			'post_content' => $serialized,
		], true );

		if ( is_wp_error( $result ) ) {
			return false;
		}

		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	public function find_elements( int $post_id, array $criteria ): array {
		$content = $this->extract_content( $post_id );

		return $this->search_recursive( $content, $criteria );
	}

	/**
	 * {@inheritDoc}
	 */
	public function update_element( int $post_id, string $element_id, array $updates ): bool {
		$content = $this->extract_content( $post_id );

		if ( empty( $content ) ) {
			return false;
		}

		$updated = false;
		$content = $this->update_element_recursive( $content, $element_id, $updates, $updated );

		if ( ! $updated ) {
			return false;
		}

		return $this->inject_content( $post_id, $content );
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_widget_types(): array {
		return [
			[ 'name' => 'vc_row', 'title' => 'Row', 'category' => 'layout' ],
			[ 'name' => 'vc_row_inner', 'title' => 'Inner Row', 'category' => 'layout' ],
			[ 'name' => 'vc_column', 'title' => 'Column', 'category' => 'layout' ],
			[ 'name' => 'vc_column_inner', 'title' => 'Inner Column', 'category' => 'layout' ],
			[ 'name' => 'vc_column_text', 'title' => 'Text Block', 'category' => 'basic' ],
			[ 'name' => 'vc_single_image', 'title' => 'Single Image', 'category' => 'basic' ],
			[ 'name' => 'vc_gallery', 'title' => 'Image Gallery', 'category' => 'media' ],
			[ 'name' => 'vc_btn', 'title' => 'Button', 'category' => 'basic' ],
			[ 'name' => 'vc_separator', 'title' => 'Separator', 'category' => 'basic' ],
			[ 'name' => 'vc_empty_space', 'title' => 'Empty Space', 'category' => 'basic' ],
			[ 'name' => 'vc_icon', 'title' => 'Icon', 'category' => 'basic' ],
			[ 'name' => 'vc_video', 'title' => 'Video Player', 'category' => 'media' ],
			[ 'name' => 'vc_tta_tabs', 'title' => 'Tabs', 'category' => 'general' ],
			[ 'name' => 'vc_tta_accordion', 'title' => 'Accordion', 'category' => 'general' ],
			[ 'name' => 'vc_tta_tour', 'title' => 'Tour', 'category' => 'general' ],
			[ 'name' => 'vc_custom_heading', 'title' => 'Custom Heading', 'category' => 'basic' ],
			[ 'name' => 'vc_raw_html', 'title' => 'Raw HTML', 'category' => 'general' ],
			[ 'name' => 'vc_raw_js', 'title' => 'Raw JS', 'category' => 'general' ],
			[ 'name' => 'vc_widget_sidebar', 'title' => 'Sidebar', 'category' => 'general' ],
			[ 'name' => 'vc_gmaps', 'title' => 'Google Maps', 'category' => 'general' ],
			[ 'name' => 'vc_progress_bar', 'title' => 'Progress Bar', 'category' => 'general' ],
			[ 'name' => 'vc_pie', 'title' => 'Pie Chart', 'category' => 'general' ],
			[ 'name' => 'vc_message', 'title' => 'Message Box', 'category' => 'general' ],
			[ 'name' => 'vc_toggle', 'title' => 'Toggle', 'category' => 'general' ],
			[ 'name' => 'vc_posts_grid', 'title' => 'Posts Grid', 'category' => 'dynamic' ],
		];
	}

	/**
	 * {@inheritDoc}
	 */
	public function build_page( array $structure ): string {
		return $this->serialize_shortcodes( $this->build_structure( $structure ) );
	}

	/**
	 * Get children key for WPBakery tree elements.
	 *
	 * @param array $element Element data.
	 * @return string|null
	 */
	protected function get_children_key( array $element ): ?string {
		return isset( $element['children'] ) ? 'children' : null;
	}

	/**
	 * Parse WPBakery shortcodes into a structured array.
	 *
	 * @param string $content Post content with WPBakery shortcodes.
	 * @return array Parsed element tree.
	 */
	private function parse_wpbakery_shortcodes( string $content ): array {
		$elements = [];

		// Match top-level shortcodes (vc_row).
		$pattern = '/\[vc_row((?:\s[^\]]*)?)\](.*?)\[\/vc_row\]/s';

		if ( ! preg_match_all( $pattern, $content, $matches, PREG_SET_ORDER ) ) {
			return $elements;
		}

		foreach ( $matches as $match ) {
			$settings = $this->parse_shortcode_attrs( trim( $match[1] ) );
			$inner    = $match[2];

			$element = [
				'id'       => $settings['el_id'] ?? $this->generate_id(),
				'type'     => 'vc_row',
				'settings' => $settings,
				'content'  => '',
				'children' => $this->parse_inner_shortcodes( $inner ),
			];

			$elements[] = $element;
		}

		return $elements;
	}

	/**
	 * Parse inner shortcodes recursively.
	 *
	 * @param string $content Inner content.
	 * @return array Parsed elements.
	 */
	private function parse_inner_shortcodes( string $content ): array {
		$elements = [];

		// Match WPBakery shortcode tags.
		$pattern = '/\[(vc_\w+|rev_slider\w*)((?:\s[^\]]*)?)\](.*?)\[\/\1\]|\[(vc_\w+)((?:\s[^\]]*)?)\s*\/?\]/s';

		if ( ! preg_match_all( $pattern, $content, $matches, PREG_SET_ORDER ) ) {
			return $elements;
		}

		foreach ( $matches as $match ) {
			if ( ! empty( $match[4] ) ) {
				// Self-closing shortcode.
				$type     = $match[4];
				$settings = $this->parse_shortcode_attrs( trim( $match[5] ?? '' ) );

				$elements[] = [
					'id'       => $settings['el_id'] ?? $this->generate_id(),
					'type'     => $type,
					'settings' => $settings,
					'content'  => '',
					'children' => [],
				];
			} else {
				// Paired shortcode.
				$type     = $match[1];
				$settings = $this->parse_shortcode_attrs( trim( $match[2] ) );
				$inner    = $match[3];

				$element = [
					'id'       => $settings['el_id'] ?? $this->generate_id(),
					'type'     => $type,
					'settings' => $settings,
					'content'  => '',
					'children' => [],
				];

				// Check for nested shortcodes.
				if ( preg_match( '/\[vc_/', $inner ) ) {
					$element['children'] = $this->parse_inner_shortcodes( $inner );
				} else {
					$element['content'] = trim( $inner );
				}

				$elements[] = $element;
			}
		}

		return $elements;
	}

	/**
	 * Serialize elements back to WPBakery shortcodes.
	 *
	 * @param array $elements Element tree.
	 * @return string Shortcode string.
	 */
	private function serialize_shortcodes( array $elements ): string {
		$output = '';

		foreach ( $elements as $element ) {
			$type  = $element['type'] ?? 'vc_column_text';
			$attrs = $this->build_shortcode_attrs( $element['settings'] ?? [] );

			$output .= "[{$type}{$attrs}]";

			if ( ! empty( $element['children'] ) ) {
				$output .= $this->serialize_shortcodes( $element['children'] );
			} elseif ( ! empty( $element['content'] ) ) {
				$output .= $element['content'];
			}

			$output .= "[/{$type}]";
		}

		return $output;
	}

	/**
	 * Build a structured element tree from declarative input.
	 *
	 * @param array $structure Declarative page structure.
	 * @return array Element tree.
	 */
	private function build_structure( array $structure ): array {
		$elements = [];

		foreach ( $structure as $row_def ) {
			$row = [
				'id'       => $this->generate_id(),
				'type'     => 'vc_row',
				'settings' => $row_def['settings'] ?? [],
				'children' => [],
			];

			$columns = $row_def['columns'] ?? [ $row_def ];
			foreach ( $columns as $col_def ) {
				$width = $col_def['width'] ?? '1/1';
				$col   = [
					'id'       => $this->generate_id(),
					'type'     => 'vc_column',
					'settings' => array_merge( [ 'width' => $width ], $col_def['settings'] ?? [] ),
					'children' => [],
				];

				$modules = $col_def['modules'] ?? [];
				foreach ( $modules as $module_def ) {
					$col['children'][] = [
						'id'       => $this->generate_id(),
						'type'     => $module_def['type'] ?? 'vc_column_text',
						'settings' => $module_def['settings'] ?? [],
						'content'  => $module_def['content'] ?? '',
						'children' => [],
					];
				}

				$row['children'][] = $col;
			}

			$elements[] = $row;
		}

		return $elements;
	}

	/**
	 * Parse shortcode attributes string.
	 *
	 * @param string $attrs_str Attributes string.
	 * @return array Parsed attributes.
	 */
	private function parse_shortcode_attrs( string $attrs_str ): array {
		if ( empty( $attrs_str ) ) {
			return [];
		}

		$attrs = shortcode_parse_atts( $attrs_str );

		return is_array( $attrs ) ? $attrs : [];
	}

	/**
	 * Build shortcode attributes string.
	 *
	 * @param array $attrs Attributes array.
	 * @return string Formatted attributes string.
	 */
	private function build_shortcode_attrs( array $attrs ): string {
		if ( empty( $attrs ) ) {
			return '';
		}

		$parts = [];
		foreach ( $attrs as $key => $value ) {
			if ( is_numeric( $key ) ) {
				continue;
			}
			$parts[] = sprintf( ' %s="%s"', esc_attr( $key ), esc_attr( $value ) );
		}

		return implode( '', $parts );
	}

	/**
	 * Recursively update an element by ID.
	 *
	 * @param array  $elements   Element tree.
	 * @param string $element_id Target element ID.
	 * @param array  $updates    Updates to apply.
	 * @param bool   &$updated   Whether the element was found and updated.
	 * @return array Modified tree.
	 */
	private function update_element_recursive( array $elements, string $element_id, array $updates, bool &$updated ): array {
		foreach ( $elements as &$element ) {
			$el_id = $element['id'] ?? '';

			if ( $el_id === $element_id ) {
				if ( isset( $updates['settings'] ) ) {
					$element['settings'] = array_merge( $element['settings'] ?? [], $updates['settings'] );
				}
				if ( isset( $updates['content'] ) ) {
					$element['content'] = $updates['content'];
				}
				if ( isset( $updates['type'] ) ) {
					$element['type'] = $updates['type'];
				}
				$updated = true;
				break;
			}

			if ( ! empty( $element['children'] ) ) {
				$element['children'] = $this->update_element_recursive(
					$element['children'],
					$element_id,
					$updates,
					$updated
				);
				if ( $updated ) {
					break;
				}
			}
		}
		unset( $element );

		return $elements;
	}
}
