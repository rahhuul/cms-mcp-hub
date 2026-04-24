<?php
/**
 * Bricks builder implementation.
 *
 * @package CmsMcpHub
 */

defined( 'ABSPATH' ) || exit;

/**
 * Bricks page builder support.
 *
 * Bricks stores content as a serialized PHP array in the
 * `_bricks_page_content_2` post meta key. Each element has a unique `id`,
 * a `name` (element type), `settings`, and optional `children` references
 * stored as `parent` on child elements.
 */
class CmsMcp_Bricks extends CmsMcp_Builder_Base {

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		return 'bricks';
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_name(): string {
		return 'Bricks';
	}

	/**
	 * {@inheritDoc}
	 */
	public function extract_content( int $post_id ): array {
		$data = get_post_meta( $post_id, '_bricks_page_content_2', true );

		if ( empty( $data ) || ! is_array( $data ) ) {
			return [];
		}

		return $this->normalize_flat_to_tree( $data );
	}

	/**
	 * {@inheritDoc}
	 */
	public function inject_content( int $post_id, array $content ): bool {
		// Flatten tree back to Bricks flat array format.
		$flat = $this->flatten_tree( $content );

		update_post_meta( $post_id, '_bricks_page_content_2', $flat );

		// Clear Bricks CSS cache so styles regenerate.
		delete_post_meta( $post_id, '_bricks_page_content_2_css' );

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
		$data = get_post_meta( $post_id, '_bricks_page_content_2', true );

		if ( empty( $data ) || ! is_array( $data ) ) {
			return false;
		}

		$found = false;
		foreach ( $data as &$element ) {
			if ( ( $element['id'] ?? '' ) === $element_id ) {
				if ( isset( $updates['settings'] ) ) {
					$element['settings'] = array_merge( $element['settings'] ?? [], $updates['settings'] );
				}
				if ( isset( $updates['name'] ) ) {
					$element['name'] = $updates['name'];
				}
				$found = true;
				break;
			}
		}
		unset( $element );

		if ( ! $found ) {
			return false;
		}

		update_post_meta( $post_id, '_bricks_page_content_2', $data );
		delete_post_meta( $post_id, '_bricks_page_content_2_css' );

		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_widget_types(): array {
		$types = [
			[ 'name' => 'section', 'title' => 'Section', 'category' => 'layout' ],
			[ 'name' => 'container', 'title' => 'Container', 'category' => 'layout' ],
			[ 'name' => 'block', 'title' => 'Block', 'category' => 'layout' ],
			[ 'name' => 'div', 'title' => 'Div', 'category' => 'layout' ],
			[ 'name' => 'heading', 'title' => 'Heading', 'category' => 'basic' ],
			[ 'name' => 'text-basic', 'title' => 'Basic Text', 'category' => 'basic' ],
			[ 'name' => 'text', 'title' => 'Rich Text', 'category' => 'basic' ],
			[ 'name' => 'image', 'title' => 'Image', 'category' => 'basic' ],
			[ 'name' => 'button', 'title' => 'Button', 'category' => 'basic' ],
			[ 'name' => 'icon', 'title' => 'Icon', 'category' => 'basic' ],
			[ 'name' => 'video', 'title' => 'Video', 'category' => 'media' ],
			[ 'name' => 'list', 'title' => 'List', 'category' => 'basic' ],
			[ 'name' => 'accordion', 'title' => 'Accordion', 'category' => 'general' ],
			[ 'name' => 'tabs', 'title' => 'Tabs', 'category' => 'general' ],
			[ 'name' => 'slider', 'title' => 'Slider', 'category' => 'media' ],
			[ 'name' => 'map', 'title' => 'Map', 'category' => 'general' ],
			[ 'name' => 'code', 'title' => 'Code', 'category' => 'general' ],
			[ 'name' => 'html', 'title' => 'HTML', 'category' => 'general' ],
			[ 'name' => 'form', 'title' => 'Form', 'category' => 'form' ],
			[ 'name' => 'posts', 'title' => 'Posts', 'category' => 'dynamic' ],
		];

		// Merge with registered Bricks elements if available.
		if ( class_exists( '\\Bricks\\Elements' ) ) {
			$registered = \Bricks\Elements::$elements ?? [];
			foreach ( $registered as $name => $element_class ) {
				$already_listed = false;
				foreach ( $types as $t ) {
					if ( $t['name'] === $name ) {
						$already_listed = true;
						break;
					}
				}
				if ( ! $already_listed ) {
					$types[] = [
						'name'     => $name,
						'title'    => ucfirst( str_replace( '-', ' ', $name ) ),
						'category' => 'registered',
					];
				}
			}
		}

		return $types;
	}

	/**
	 * {@inheritDoc}
	 */
	public function build_page( array $structure ): string {
		$elements = [];

		foreach ( $structure as $section_def ) {
			$section_id = $this->generate_id();
			$elements[] = [
				'id'       => $section_id,
				'name'     => 'section',
				'parent'   => 0,
				'settings' => $section_def['settings'] ?? [],
			];

			$containers = $section_def['containers'] ?? [ $section_def ];
			foreach ( $containers as $container_def ) {
				$container_id = $this->generate_id();
				$elements[]   = [
					'id'       => $container_id,
					'name'     => 'container',
					'parent'   => $section_id,
					'settings' => $container_def['settings'] ?? [],
				];

				$widgets = $container_def['widgets'] ?? [];
				foreach ( $widgets as $widget_def ) {
					$elements[] = [
						'id'       => $this->generate_id(),
						'name'     => $widget_def['type'] ?? 'text-basic',
						'parent'   => $container_id,
						'settings' => $widget_def['settings'] ?? [],
					];
				}
			}
		}

		return wp_json_encode( $elements );
	}

	/**
	 * Get children key for Bricks tree elements.
	 *
	 * @param array $element Element data.
	 * @return string|null
	 */
	protected function get_children_key( array $element ): ?string {
		return isset( $element['children'] ) ? 'children' : null;
	}

	/**
	 * Convert Bricks flat array (with parent references) to a tree.
	 *
	 * @param array $flat_elements Flat element list with parent keys.
	 * @return array Tree structure with children arrays.
	 */
	private function normalize_flat_to_tree( array $flat_elements ): array {
		$by_id = [];
		$tree  = [];

		// Index by ID.
		foreach ( $flat_elements as $element ) {
			$id          = $element['id'] ?? $this->generate_id();
			$element['id'] = $id;
			$element['children'] = [];
			$by_id[ $id ] = $element;
		}

		// Build tree.
		foreach ( $by_id as $id => $element ) {
			$parent_id = $element['parent'] ?? 0;

			if ( empty( $parent_id ) || ! isset( $by_id[ $parent_id ] ) ) {
				$tree[] = &$by_id[ $id ];
			} else {
				$by_id[ $parent_id ]['children'][] = &$by_id[ $id ];
			}
		}

		return $tree;
	}

	/**
	 * Flatten a tree structure back to Bricks flat array.
	 *
	 * @param array  $tree      Tree structure.
	 * @param string $parent_id Parent ID (0 for root).
	 * @return array Flat element list.
	 */
	private function flatten_tree( array $tree, string $parent_id = '0' ): array {
		$flat = [];

		foreach ( $tree as $element ) {
			$children = $element['children'] ?? [];
			$el_id    = $element['id'] ?? $this->generate_id();

			$flat_element = [
				'id'       => $el_id,
				'name'     => $element['name'] ?? $element['type'] ?? 'div',
				'parent'   => $parent_id,
				'settings' => $element['settings'] ?? [],
			];

			$flat = array_merge( $flat, [ $flat_element ] );

			if ( ! empty( $children ) ) {
				$flat = array_merge( $flat, $this->flatten_tree( $children, $el_id ) );
			}
		}

		return $flat;
	}
}
