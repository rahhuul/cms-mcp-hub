<?php
/**
 * Oxygen builder implementation.
 *
 * @package CmsMcpHub
 */

defined( 'ABSPATH' ) || exit;

/**
 * Oxygen page builder support.
 *
 * Oxygen stores content as serialized shortcodes in the `ct_builder_shortcodes`
 * post meta key. It also stores component tree data and custom CSS.
 */
class CmsMcp_Oxygen extends CmsMcp_Builder_Base {

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		return 'oxygen';
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_name(): string {
		return 'Oxygen';
	}

	/**
	 * {@inheritDoc}
	 */
	public function extract_content( int $post_id ): array {
		$shortcodes = get_post_meta( $post_id, 'ct_builder_shortcodes', true );

		if ( empty( $shortcodes ) ) {
			return [];
		}

		// Oxygen stores shortcodes as a string.
		if ( is_string( $shortcodes ) ) {
			return $this->parse_oxygen_shortcodes( $shortcodes );
		}

		return [];
	}

	/**
	 * {@inheritDoc}
	 */
	public function inject_content( int $post_id, array $content ): bool {
		$serialized = $this->serialize_shortcodes( $content );

		update_post_meta( $post_id, 'ct_builder_shortcodes', $serialized );

		// Regenerate Oxygen CSS.
		$this->regenerate_css( $post_id );

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
			[ 'name' => 'ct_section', 'title' => 'Section', 'category' => 'layout' ],
			[ 'name' => 'ct_div_block', 'title' => 'Div', 'category' => 'layout' ],
			[ 'name' => 'ct_columns', 'title' => 'Columns', 'category' => 'layout' ],
			[ 'name' => 'ct_column', 'title' => 'Column', 'category' => 'layout' ],
			[ 'name' => 'ct_text_block', 'title' => 'Text', 'category' => 'basic' ],
			[ 'name' => 'ct_headline', 'title' => 'Heading', 'category' => 'basic' ],
			[ 'name' => 'ct_image', 'title' => 'Image', 'category' => 'basic' ],
			[ 'name' => 'ct_link_button', 'title' => 'Button', 'category' => 'basic' ],
			[ 'name' => 'ct_link', 'title' => 'Link Wrapper', 'category' => 'basic' ],
			[ 'name' => 'ct_icon', 'title' => 'Icon', 'category' => 'basic' ],
			[ 'name' => 'ct_video', 'title' => 'Video', 'category' => 'media' ],
			[ 'name' => 'ct_code_block', 'title' => 'Code Block', 'category' => 'general' ],
			[ 'name' => 'ct_shortcode', 'title' => 'Shortcode', 'category' => 'general' ],
			[ 'name' => 'ct_inner_content', 'title' => 'Inner Content', 'category' => 'general' ],
			[ 'name' => 'ct_map', 'title' => 'Map', 'category' => 'general' ],
			[ 'name' => 'ct_slider', 'title' => 'Slider', 'category' => 'general' ],
			[ 'name' => 'ct_tabs', 'title' => 'Tabs', 'category' => 'general' ],
			[ 'name' => 'ct_toggle', 'title' => 'Toggle', 'category' => 'general' ],
			[ 'name' => 'ct_modal', 'title' => 'Modal', 'category' => 'general' ],
			[ 'name' => 'ct_repeater', 'title' => 'Repeater', 'category' => 'dynamic' ],
			[ 'name' => 'ct_condition', 'title' => 'Condition', 'category' => 'dynamic' ],
		];
	}

	/**
	 * {@inheritDoc}
	 */
	public function build_page( array $structure ): string {
		$elements = $this->build_structure( $structure );

		return $this->serialize_shortcodes( $elements );
	}

	/**
	 * Get children key for Oxygen tree elements.
	 *
	 * @param array $element Element data.
	 * @return string|null
	 */
	protected function get_children_key( array $element ): ?string {
		return isset( $element['children'] ) ? 'children' : null;
	}

	/**
	 * Parse Oxygen shortcodes into a structured array.
	 *
	 * @param string $content Oxygen shortcode string.
	 * @return array Parsed element tree.
	 */
	private function parse_oxygen_shortcodes( string $content ): array {
		$elements = [];

		// Match Oxygen shortcode tags (ct_*).
		$pattern = '/\[(ct_\w+)((?:\s[^\]]*)?)\](.*?)\[\/\1\]|\[(ct_\w+)((?:\s[^\]]*)?)\s*\/?\]/s';

		if ( ! preg_match_all( $pattern, $content, $matches, PREG_SET_ORDER ) ) {
			return $elements;
		}

		foreach ( $matches as $match ) {
			if ( ! empty( $match[4] ) ) {
				// Self-closing shortcode.
				$type     = $match[4];
				$settings = $this->parse_shortcode_attrs( trim( $match[5] ?? '' ) );

				$elements[] = [
					'id'       => $settings['ct_id'] ?? $this->generate_id(),
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
					'id'       => $settings['ct_id'] ?? $this->generate_id(),
					'type'     => $type,
					'settings' => $settings,
					'content'  => '',
					'children' => [],
				];

				// Check for nested shortcodes.
				if ( preg_match( '/\[ct_/', $inner ) ) {
					$element['children'] = $this->parse_oxygen_shortcodes( $inner );
				} else {
					$element['content'] = trim( $inner );
				}

				$elements[] = $element;
			}
		}

		return $elements;
	}

	/**
	 * Serialize elements back to Oxygen shortcodes.
	 *
	 * @param array $elements Element tree.
	 * @return string Shortcode string.
	 */
	private function serialize_shortcodes( array $elements ): string {
		$output = '';

		foreach ( $elements as $element ) {
			$type  = $element['type'] ?? 'ct_text_block';
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

		foreach ( $structure as $section_def ) {
			$section = [
				'id'       => $this->generate_id(),
				'type'     => 'ct_section',
				'settings' => $section_def['settings'] ?? [],
				'children' => [],
			];

			$children = $section_def['children'] ?? [];
			foreach ( $children as $child_def ) {
				$section['children'][] = [
					'id'       => $this->generate_id(),
					'type'     => $child_def['type'] ?? 'ct_text_block',
					'settings' => $child_def['settings'] ?? [],
					'content'  => $child_def['content'] ?? '',
					'children' => [],
				];
			}

			$elements[] = $section;
		}

		return $elements;
	}

	/**
	 * Regenerate Oxygen CSS for a post.
	 *
	 * @param int $post_id Post ID.
	 */
	private function regenerate_css( int $post_id ): void {
		// Delete cached CSS so Oxygen regenerates it.
		delete_post_meta( $post_id, 'ct_css_cache' );
		delete_post_meta( $post_id, 'ct_builder_json' );

		// Clear the universal CSS cache if available.
		delete_option( 'oxygen_vsb_universal_css_cache' );
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
