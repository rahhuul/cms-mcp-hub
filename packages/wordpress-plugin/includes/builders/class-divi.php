<?php
/**
 * Divi builder implementation.
 *
 * Supports both Divi 4 (shortcode-based) and Divi 5 (block-based).
 *
 * @package CmsMcpHub
 */

defined( 'ABSPATH' ) || exit;

/**
 * Divi page builder support.
 *
 * Divi 4 stores content as shortcodes in post_content (e.g., [et_pb_section]).
 * Divi 5 stores content as block comments in post_content (e.g., <!-- wp:divi/section -->).
 */
class CmsMcp_Divi extends CmsMcp_Builder_Base {

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		$version = defined( 'ET_BUILDER_VERSION' ) ? ET_BUILDER_VERSION : '4.0';
		return version_compare( $version, '5.0', '>=' ) ? 'divi5' : 'divi4';
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_name(): string {
		$version = defined( 'ET_BUILDER_VERSION' ) ? ET_BUILDER_VERSION : '4.0';
		return version_compare( $version, '5.0', '>=' ) ? 'Divi 5' : 'Divi 4';
	}

	/**
	 * {@inheritDoc}
	 */
	public function extract_content( int $post_id ): array {
		$content = get_post_field( 'post_content', $post_id );

		if ( empty( $content ) ) {
			return [];
		}

		// Detect Divi 5 blocks.
		if ( strpos( $content, 'wp:divi/' ) !== false ) {
			return $this->parse_divi5_blocks( $content );
		}

		// Fall back to Divi 4 shortcodes.
		return $this->parse_divi4_shortcodes( $content );
	}

	/**
	 * {@inheritDoc}
	 */
	public function inject_content( int $post_id, array $content ): bool {
		$version = defined( 'ET_BUILDER_VERSION' ) ? ET_BUILDER_VERSION : '4.0';

		if ( version_compare( $version, '5.0', '>=' ) ) {
			$serialized = $this->serialize_divi5_blocks( $content );
		} else {
			$serialized = $this->serialize_divi4_shortcodes( $content );
		}

		$result = wp_update_post( [
			'ID'           => $post_id,
			'post_content' => $serialized,
		], true );

		if ( is_wp_error( $result ) ) {
			return false;
		}

		// Set builder active flag for Divi 4.
		update_post_meta( $post_id, '_et_pb_use_builder', 'on' );
		update_post_meta( $post_id, '_et_pb_old_content', '' );

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
			[ 'name' => 'et_pb_text', 'title' => 'Text', 'category' => 'basic' ],
			[ 'name' => 'et_pb_image', 'title' => 'Image', 'category' => 'basic' ],
			[ 'name' => 'et_pb_button', 'title' => 'Button', 'category' => 'basic' ],
			[ 'name' => 'et_pb_blurb', 'title' => 'Blurb', 'category' => 'basic' ],
			[ 'name' => 'et_pb_slider', 'title' => 'Slider', 'category' => 'basic' ],
			[ 'name' => 'et_pb_gallery', 'title' => 'Gallery', 'category' => 'media' ],
			[ 'name' => 'et_pb_video', 'title' => 'Video', 'category' => 'media' ],
			[ 'name' => 'et_pb_tabs', 'title' => 'Tabs', 'category' => 'layout' ],
			[ 'name' => 'et_pb_accordion', 'title' => 'Accordion', 'category' => 'layout' ],
			[ 'name' => 'et_pb_toggle', 'title' => 'Toggle', 'category' => 'layout' ],
			[ 'name' => 'et_pb_contact_form', 'title' => 'Contact Form', 'category' => 'form' ],
			[ 'name' => 'et_pb_cta', 'title' => 'Call To Action', 'category' => 'basic' ],
			[ 'name' => 'et_pb_pricing_tables', 'title' => 'Pricing Tables', 'category' => 'basic' ],
			[ 'name' => 'et_pb_testimonial', 'title' => 'Testimonial', 'category' => 'basic' ],
			[ 'name' => 'et_pb_countdown_timer', 'title' => 'Countdown Timer', 'category' => 'basic' ],
			[ 'name' => 'et_pb_social_media_follow', 'title' => 'Social Media Follow', 'category' => 'basic' ],
			[ 'name' => 'et_pb_map', 'title' => 'Map', 'category' => 'basic' ],
			[ 'name' => 'et_pb_code', 'title' => 'Code', 'category' => 'basic' ],
			[ 'name' => 'et_pb_divider', 'title' => 'Divider', 'category' => 'basic' ],
			[ 'name' => 'et_pb_blog', 'title' => 'Blog', 'category' => 'dynamic' ],
			[ 'name' => 'et_pb_shop', 'title' => 'Shop', 'category' => 'dynamic' ],
		];
	}

	/**
	 * {@inheritDoc}
	 */
	public function build_page( array $structure ): string {
		$shortcodes = '';

		foreach ( $structure as $section_def ) {
			$section_attrs = $this->build_shortcode_attrs( $section_def['settings'] ?? [] );
			$shortcodes   .= "[et_pb_section{$section_attrs}]";

			$rows = $section_def['rows'] ?? [ $section_def ];
			foreach ( $rows as $row_def ) {
				$row_attrs   = $this->build_shortcode_attrs( $row_def['settings'] ?? [] );
				$shortcodes .= "[et_pb_row{$row_attrs}]";

				$columns = $row_def['columns'] ?? [ $row_def ];
				foreach ( $columns as $col_def ) {
					$col_attrs   = $this->build_shortcode_attrs( $col_def['settings'] ?? [] );
					$shortcodes .= "[et_pb_column{$col_attrs}]";

					$modules = $col_def['modules'] ?? [];
					foreach ( $modules as $module_def ) {
						$type       = $module_def['type'] ?? 'et_pb_text';
						$mod_attrs  = $this->build_shortcode_attrs( $module_def['settings'] ?? [] );
						$inner      = $module_def['content'] ?? '';
						$shortcodes .= "[{$type}{$mod_attrs}]{$inner}[/{$type}]";
					}

					$shortcodes .= '[/et_pb_column]';
				}

				$shortcodes .= '[/et_pb_row]';
			}

			$shortcodes .= '[/et_pb_section]';
		}

		return $shortcodes;
	}

	/**
	 * Get children key for Divi elements.
	 *
	 * @param array $element Element data.
	 * @return string|null
	 */
	protected function get_children_key( array $element ): ?string {
		return isset( $element['children'] ) ? 'children' : null;
	}

	/**
	 * Parse Divi 4 shortcodes into a structured array.
	 *
	 * @param string $content Post content with Divi shortcodes.
	 * @return array Parsed element tree.
	 */
	private function parse_divi4_shortcodes( string $content ): array {
		$elements = [];
		$pattern  = '/\[et_pb_(\w+)(.*?)\](.*?)\[\/et_pb_\1\]/s';

		if ( ! preg_match_all( $pattern, $content, $matches, PREG_SET_ORDER ) ) {
			return $elements;
		}

		foreach ( $matches as $match ) {
			$type       = 'et_pb_' . $match[1];
			$attrs_str  = trim( $match[2] );
			$inner      = $match[3];
			$settings   = $this->parse_shortcode_attrs( $attrs_str );

			$element = [
				'id'       => $settings['_module_id'] ?? $this->generate_id(),
				'type'     => $type,
				'settings' => $settings,
				'content'  => '',
				'children' => [],
			];

			// Recursively parse inner shortcodes.
			if ( preg_match( '/\[et_pb_/', $inner ) ) {
				$element['children'] = $this->parse_divi4_shortcodes( $inner );
			} else {
				$element['content'] = trim( $inner );
			}

			$elements[] = $element;
		}

		return $elements;
	}

	/**
	 * Parse Divi 5 block comments into a structured array.
	 *
	 * @param string $content Post content with Divi 5 blocks.
	 * @return array Parsed element tree.
	 */
	private function parse_divi5_blocks( string $content ): array {
		$blocks = parse_blocks( $content );

		return $this->normalize_divi5_blocks( $blocks );
	}

	/**
	 * Normalize parsed Divi 5 blocks.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array Normalized element tree.
	 */
	private function normalize_divi5_blocks( array $blocks ): array {
		$elements = [];

		foreach ( $blocks as $block ) {
			if ( empty( $block['blockName'] ) ) {
				continue;
			}

			// Only process Divi blocks.
			if ( strpos( $block['blockName'], 'divi/' ) !== 0 ) {
				continue;
			}

			$element = [
				'id'       => $block['attrs']['id'] ?? $this->generate_id(),
				'type'     => $block['blockName'],
				'settings' => $block['attrs'] ?? [],
				'content'  => $block['innerHTML'] ?? '',
				'children' => [],
			];

			if ( ! empty( $block['innerBlocks'] ) ) {
				$element['children'] = $this->normalize_divi5_blocks( $block['innerBlocks'] );
			}

			$elements[] = $element;
		}

		return $elements;
	}

	/**
	 * Serialize elements back to Divi 4 shortcodes.
	 *
	 * @param array $elements Element tree.
	 * @return string Shortcode string.
	 */
	private function serialize_divi4_shortcodes( array $elements ): string {
		$output = '';

		foreach ( $elements as $element ) {
			$type  = $element['type'] ?? 'et_pb_text';
			$attrs = $this->build_shortcode_attrs( $element['settings'] ?? [] );

			$output .= "[{$type}{$attrs}]";

			if ( ! empty( $element['children'] ) ) {
				$output .= $this->serialize_divi4_shortcodes( $element['children'] );
			} elseif ( ! empty( $element['content'] ) ) {
				$output .= $element['content'];
			}

			$output .= "[/{$type}]";
		}

		return $output;
	}

	/**
	 * Serialize elements back to Divi 5 block comments.
	 *
	 * @param array $elements Element tree.
	 * @return string Block comment string.
	 */
	private function serialize_divi5_blocks( array $elements ): string {
		$output = '';

		foreach ( $elements as $element ) {
			$type  = $element['type'] ?? 'divi/text';
			$attrs = ! empty( $element['settings'] ) ? ' ' . wp_json_encode( $element['settings'] ) : '';

			if ( ! empty( $element['children'] ) ) {
				$output .= "<!-- wp:{$type}{$attrs} -->\n";
				$output .= $this->serialize_divi5_blocks( $element['children'] );
				$output .= "<!-- /wp:{$type} -->\n";
			} elseif ( ! empty( $element['content'] ) ) {
				$output .= "<!-- wp:{$type}{$attrs} -->\n";
				$output .= $element['content'] . "\n";
				$output .= "<!-- /wp:{$type} -->\n";
			} else {
				$output .= "<!-- wp:{$type}{$attrs} /-->\n";
			}
		}

		return $output;
	}

	/**
	 * Parse shortcode attributes string into an associative array.
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
	 * Build a shortcode attributes string from an associative array.
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
