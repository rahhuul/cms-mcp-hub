<?php
/**
 * Beaver Builder implementation.
 *
 * @package CmsMcpHub
 */

defined( 'ABSPATH' ) || exit;

/**
 * Beaver Builder page builder support.
 *
 * Beaver Builder stores content as a serialized PHP array in the
 * `_fl_builder_data` post meta key. It also stores draft data in
 * `_fl_builder_draft` and published data in `_fl_builder_data`.
 */
class CmsMcp_Beaver_Builder extends CmsMcp_Builder_Base {

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		return 'beaver-builder';
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_name(): string {
		return 'Beaver Builder';
	}

	/**
	 * {@inheritDoc}
	 */
	public function extract_content( int $post_id ): array {
		$data = get_post_meta( $post_id, '_fl_builder_data', true );

		if ( empty( $data ) || ! is_array( $data ) ) {
			return [];
		}

		return $this->normalize_bb_data( $data );
	}

	/**
	 * {@inheritDoc}
	 */
	public function inject_content( int $post_id, array $content ): bool {
		// Flatten tree back to BB's flat node format.
		$flat = $this->flatten_to_bb_format( $content );

		update_post_meta( $post_id, '_fl_builder_data', $flat );
		update_post_meta( $post_id, '_fl_builder_draft', $flat );

		// Set the builder enabled flag.
		update_post_meta( $post_id, '_fl_builder_enabled', true );

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
		$data = get_post_meta( $post_id, '_fl_builder_data', true );

		if ( empty( $data ) || ! is_array( $data ) ) {
			return false;
		}

		if ( ! isset( $data[ $element_id ] ) ) {
			return false;
		}

		$node = $data[ $element_id ];

		if ( isset( $updates['settings'] ) && is_object( $node->settings ) ) {
			foreach ( $updates['settings'] as $key => $value ) {
				$node->settings->$key = $value;
			}
		}

		if ( isset( $updates['type'] ) ) {
			$node->type = $updates['type'];
		}

		$data[ $element_id ] = $node;

		update_post_meta( $post_id, '_fl_builder_data', $data );
		update_post_meta( $post_id, '_fl_builder_draft', $data );

		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_widget_types(): array {
		$types = [
			[ 'name' => 'heading', 'title' => 'Heading', 'category' => 'basic' ],
			[ 'name' => 'rich-text', 'title' => 'Text Editor', 'category' => 'basic' ],
			[ 'name' => 'photo', 'title' => 'Photo', 'category' => 'basic' ],
			[ 'name' => 'button', 'title' => 'Button', 'category' => 'basic' ],
			[ 'name' => 'button-group', 'title' => 'Button Group', 'category' => 'basic' ],
			[ 'name' => 'separator', 'title' => 'Separator', 'category' => 'basic' ],
			[ 'name' => 'icon', 'title' => 'Icon', 'category' => 'basic' ],
			[ 'name' => 'icon-group', 'title' => 'Icon Group', 'category' => 'basic' ],
			[ 'name' => 'html', 'title' => 'HTML', 'category' => 'basic' ],
			[ 'name' => 'video', 'title' => 'Video', 'category' => 'media' ],
			[ 'name' => 'gallery', 'title' => 'Gallery', 'category' => 'media' ],
			[ 'name' => 'slideshow', 'title' => 'Slideshow', 'category' => 'media' ],
			[ 'name' => 'callout', 'title' => 'Callout', 'category' => 'general' ],
			[ 'name' => 'cta', 'title' => 'Call to Action', 'category' => 'general' ],
			[ 'name' => 'contact-form', 'title' => 'Contact Form', 'category' => 'form' ],
			[ 'name' => 'subscribe-form', 'title' => 'Subscribe Form', 'category' => 'form' ],
			[ 'name' => 'tabs', 'title' => 'Tabs', 'category' => 'general' ],
			[ 'name' => 'accordion', 'title' => 'Accordion', 'category' => 'general' ],
			[ 'name' => 'map', 'title' => 'Map', 'category' => 'general' ],
			[ 'name' => 'post-grid', 'title' => 'Posts Grid', 'category' => 'dynamic' ],
			[ 'name' => 'post-slider', 'title' => 'Posts Slider', 'category' => 'dynamic' ],
		];

		// Merge with registered BB modules if available.
		if ( class_exists( 'FLBuilderModel' ) && method_exists( 'FLBuilderModel', 'get_module_types' ) ) {
			$registered = \FLBuilderModel::get_module_types();
			foreach ( $registered as $name => $module ) {
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
		$nodes = [];

		foreach ( $structure as $row_def ) {
			$row_id  = $this->generate_id();
			$row     = new \stdClass();
			$row->node   = $row_id;
			$row->type   = 'row';
			$row->parent = null;
			$row->settings = (object) ( $row_def['settings'] ?? [] );
			$nodes[ $row_id ] = $row;

			$columns = $row_def['columns'] ?? [ $row_def ];
			$col_size = 100 / count( $columns );

			foreach ( $columns as $col_def ) {
				$col_id  = $this->generate_id();
				$col     = new \stdClass();
				$col->node   = $col_id;
				$col->type   = 'column';
				$col->parent = $row_id;
				$col->settings = (object) array_merge(
					[ 'size' => $col_size ],
					$col_def['settings'] ?? []
				);
				$nodes[ $col_id ] = $col;

				$modules = $col_def['modules'] ?? [];
				foreach ( $modules as $module_def ) {
					$mod_id  = $this->generate_id();
					$mod     = new \stdClass();
					$mod->node   = $mod_id;
					$mod->type   = 'module';
					$mod->parent = $col_id;
					$mod->settings = (object) array_merge(
						[ 'type' => $module_def['type'] ?? 'rich-text' ],
						$module_def['settings'] ?? []
					);
					$nodes[ $mod_id ] = $mod;
				}
			}
		}

		return wp_json_encode( $nodes );
	}

	/**
	 * Get children key for BB tree elements.
	 *
	 * @param array $element Element data.
	 * @return string|null
	 */
	protected function get_children_key( array $element ): ?string {
		return isset( $element['children'] ) ? 'children' : null;
	}

	/**
	 * Normalize BB's flat node data into a tree structure.
	 *
	 * BB stores nodes as a flat associative array keyed by node ID,
	 * each with a `parent` reference.
	 *
	 * @param array $data BB node data (flat).
	 * @return array Tree structure.
	 */
	private function normalize_bb_data( array $data ): array {
		$by_id = [];

		// Convert objects to arrays and index by ID.
		foreach ( $data as $node_id => $node ) {
			$node_array = is_object( $node ) ? (array) $node : $node;

			$element = [
				'id'       => $node_array['node'] ?? (string) $node_id,
				'type'     => $node_array['type'] ?? 'module',
				'parent'   => $node_array['parent'] ?? null,
				'settings' => [],
				'children' => [],
			];

			if ( isset( $node_array['settings'] ) ) {
				$element['settings'] = is_object( $node_array['settings'] )
					? (array) $node_array['settings']
					: $node_array['settings'];
			}

			$by_id[ $element['id'] ] = $element;
		}

		// Build tree.
		$tree = [];
		foreach ( $by_id as $id => &$element ) {
			$parent = $element['parent'];

			if ( empty( $parent ) || ! isset( $by_id[ $parent ] ) ) {
				$tree[] = &$by_id[ $id ];
			} else {
				$by_id[ $parent ]['children'][] = &$by_id[ $id ];
			}
		}
		unset( $element );

		return $tree;
	}

	/**
	 * Flatten a tree structure back to BB's flat node format.
	 *
	 * @param array       $tree      Tree structure.
	 * @param string|null $parent_id Parent node ID.
	 * @return array Flat node array keyed by node ID.
	 */
	private function flatten_to_bb_format( array $tree, ?string $parent_id = null ): array {
		$nodes = [];

		foreach ( $tree as $element ) {
			$node_id  = $element['id'] ?? $this->generate_id();
			$children = $element['children'] ?? [];

			$node           = new \stdClass();
			$node->node     = $node_id;
			$node->type     = $element['type'] ?? 'module';
			$node->parent   = $parent_id;
			$node->settings = (object) ( $element['settings'] ?? [] );

			$nodes[ $node_id ] = $node;

			if ( ! empty( $children ) ) {
				$child_nodes = $this->flatten_to_bb_format( $children, $node_id );
				$nodes       = array_merge( $nodes, $child_nodes );
			}
		}

		return $nodes;
	}
}
