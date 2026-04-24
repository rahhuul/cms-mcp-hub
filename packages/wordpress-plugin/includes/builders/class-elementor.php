<?php
/**
 * Elementor builder implementation.
 *
 * @package CmsMcpHub
 */

defined( 'ABSPATH' ) || exit;

/**
 * Elementor page builder support.
 *
 * Elementor stores content as JSON in the `_elementor_data` post meta key.
 * The data is a nested array of sections > columns > widgets.
 */
class CmsMcp_Elementor extends CmsMcp_Builder_Base {

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		return 'elementor';
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_name(): string {
		return 'Elementor';
	}

	/**
	 * {@inheritDoc}
	 */
	public function extract_content( int $post_id ): array {
		$data = get_post_meta( $post_id, '_elementor_data', true );

		if ( empty( $data ) ) {
			return [];
		}

		// Elementor stores as JSON string.
		if ( is_string( $data ) ) {
			$elements = json_decode( $data, true );
		} else {
			$elements = $data;
		}

		if ( ! is_array( $elements ) ) {
			return [];
		}

		return $this->normalize_elements( $elements );
	}

	/**
	 * {@inheritDoc}
	 */
	public function inject_content( int $post_id, array $content ): bool {
		$json = wp_json_encode( $content );

		if ( false === $json ) {
			return false;
		}

		update_post_meta( $post_id, '_elementor_data', wp_slash( $json ) );

		// Clear Elementor CSS cache so styles regenerate.
		delete_post_meta( $post_id, '_elementor_css' );
		delete_option( '_elementor_global_css' );

		// Update the edit mode flag.
		update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );

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
		$types = [
			'heading'       => [ 'name' => 'heading', 'title' => 'Heading', 'category' => 'basic' ],
			'text-editor'   => [ 'name' => 'text-editor', 'title' => 'Text Editor', 'category' => 'basic' ],
			'image'         => [ 'name' => 'image', 'title' => 'Image', 'category' => 'basic' ],
			'button'        => [ 'name' => 'button', 'title' => 'Button', 'category' => 'basic' ],
			'divider'       => [ 'name' => 'divider', 'title' => 'Divider', 'category' => 'basic' ],
			'spacer'        => [ 'name' => 'spacer', 'title' => 'Spacer', 'category' => 'basic' ],
			'icon'          => [ 'name' => 'icon', 'title' => 'Icon', 'category' => 'basic' ],
			'video'         => [ 'name' => 'video', 'title' => 'Video', 'category' => 'basic' ],
			'image-box'     => [ 'name' => 'image-box', 'title' => 'Image Box', 'category' => 'general' ],
			'icon-box'      => [ 'name' => 'icon-box', 'title' => 'Icon Box', 'category' => 'general' ],
			'icon-list'     => [ 'name' => 'icon-list', 'title' => 'Icon List', 'category' => 'general' ],
			'counter'       => [ 'name' => 'counter', 'title' => 'Counter', 'category' => 'general' ],
			'progress-bar'  => [ 'name' => 'progress-bar', 'title' => 'Progress Bar', 'category' => 'general' ],
			'testimonial'   => [ 'name' => 'testimonial', 'title' => 'Testimonial', 'category' => 'general' ],
			'tabs'          => [ 'name' => 'tabs', 'title' => 'Tabs', 'category' => 'general' ],
			'accordion'     => [ 'name' => 'accordion', 'title' => 'Accordion', 'category' => 'general' ],
			'social-icons'  => [ 'name' => 'social-icons', 'title' => 'Social Icons', 'category' => 'general' ],
			'html'          => [ 'name' => 'html', 'title' => 'HTML', 'category' => 'general' ],
			'shortcode'     => [ 'name' => 'shortcode', 'title' => 'Shortcode', 'category' => 'general' ],
			'google-maps'   => [ 'name' => 'google-maps', 'title' => 'Google Maps', 'category' => 'general' ],
		];

		// If Elementor is loaded, merge with its registered widgets.
		if ( class_exists( '\\Elementor\\Plugin' ) ) {
			$widget_manager = \Elementor\Plugin::instance()->widgets_manager;
			if ( $widget_manager ) {
				$registered = $widget_manager->get_widget_types();
				foreach ( $registered as $name => $widget ) {
					if ( ! isset( $types[ $name ] ) ) {
						$types[ $name ] = [
							'name'     => $name,
							'title'    => $widget->get_title(),
							'category' => 'registered',
						];
					}
				}
			}
		}

		return array_values( $types );
	}

	/**
	 * {@inheritDoc}
	 */
	public function build_page( array $structure ): string {
		$elements = [];

		foreach ( $structure as $section_def ) {
			$section = [
				'id'       => $this->generate_id(),
				'elType'   => 'section',
				'settings' => $section_def['settings'] ?? [],
				'elements' => [],
			];

			$columns = $section_def['columns'] ?? [ $section_def ];
			foreach ( $columns as $col_def ) {
				$column = [
					'id'       => $this->generate_id(),
					'elType'   => 'column',
					'settings' => $col_def['column_settings'] ?? [ '_column_size' => (int) ( 100 / count( $columns ) ) ],
					'elements' => [],
				];

				$widgets = $col_def['widgets'] ?? [];
				foreach ( $widgets as $widget_def ) {
					$column['elements'][] = [
						'id'         => $this->generate_id(),
						'elType'     => 'widget',
						'widgetType' => $widget_def['type'] ?? 'text-editor',
						'settings'   => $widget_def['settings'] ?? [],
						'elements'   => [],
					];
				}

				$section['elements'][] = $column;
			}

			$elements[] = $section;
		}

		return wp_json_encode( $elements );
	}

	/**
	 * Get the children key for Elementor elements.
	 *
	 * @param array $element Element data.
	 * @return string|null
	 */
	protected function get_children_key( array $element ): ?string {
		return 'elements';
	}

	/**
	 * Normalize Elementor elements into a consistent structure.
	 *
	 * @param array $elements Raw Elementor elements.
	 * @return array Normalized elements.
	 */
	private function normalize_elements( array $elements ): array {
		$normalized = [];

		foreach ( $elements as $element ) {
			$item = [
				'id'       => $element['id'] ?? $this->generate_id(),
				'elType'   => $element['elType'] ?? 'widget',
				'settings' => $element['settings'] ?? [],
			];

			if ( isset( $element['widgetType'] ) ) {
				$item['widgetType'] = $element['widgetType'];
			}

			if ( ! empty( $element['elements'] ) ) {
				$item['elements'] = $this->normalize_elements( $element['elements'] );
			} else {
				$item['elements'] = [];
			}

			$normalized[] = $item;
		}

		return $normalized;
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
				if ( isset( $updates['widgetType'] ) ) {
					$element['widgetType'] = $updates['widgetType'];
				}
				$updated = true;
				break;
			}

			if ( ! empty( $element['elements'] ) ) {
				$element['elements'] = $this->update_element_recursive(
					$element['elements'],
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
