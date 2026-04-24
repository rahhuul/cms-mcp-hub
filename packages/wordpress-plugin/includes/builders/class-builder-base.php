<?php
/**
 * Builder Base — abstract base class for all builder implementations.
 *
 * @package CmsMcpHub
 */

defined( 'ABSPATH' ) || exit;

/**
 * Abstract base class that all builder implementations extend.
 */
abstract class CmsMcp_Builder_Base {

	/**
	 * Get the builder slug (e.g., 'elementor', 'divi5').
	 *
	 * @return string
	 */
	abstract public function get_slug(): string;

	/**
	 * Get the builder display name.
	 *
	 * @return string
	 */
	abstract public function get_name(): string;

	/**
	 * Extract structured content from a post.
	 *
	 * @param int $post_id Post ID.
	 * @return array Normalized element tree.
	 */
	abstract public function extract_content( int $post_id ): array;

	/**
	 * Inject structured content into a post.
	 *
	 * @param int   $post_id Post ID.
	 * @param array $content Element tree to inject.
	 * @return bool True on success.
	 */
	abstract public function inject_content( int $post_id, array $content ): bool;

	/**
	 * Find elements matching criteria.
	 *
	 * @param int   $post_id  Post ID.
	 * @param array $criteria Search criteria (type, class, id, text, etc.).
	 * @return array Matching elements.
	 */
	abstract public function find_elements( int $post_id, array $criteria ): array;

	/**
	 * Update a specific element.
	 *
	 * @param int    $post_id    Post ID.
	 * @param string $element_id Element ID.
	 * @param array  $updates    Key-value updates to apply.
	 * @return bool True on success.
	 */
	abstract public function update_element( int $post_id, string $element_id, array $updates ): bool;

	/**
	 * Get available widget/module types for this builder.
	 *
	 * @return array List of widget type definitions.
	 */
	abstract public function get_widget_types(): array;

	/**
	 * Build page content from a declarative structure.
	 *
	 * @param array $structure Declarative page structure.
	 * @return string Serialized content for storage.
	 */
	abstract public function build_page( array $structure ): string;

	/**
	 * Move an element to a new position.
	 *
	 * Default implementation: extract, rearrange, inject.
	 * Subclasses can override for native support.
	 *
	 * @param int    $post_id    Post ID.
	 * @param string $element_id Element ID to move.
	 * @param string $target_id  Target element ID (sibling or parent).
	 * @param string $position   Position relative to target: 'before', 'after', 'inside'.
	 * @return bool True on success.
	 */
	public function move_element( int $post_id, string $element_id, string $target_id, string $position = 'after' ): bool {
		$content = $this->extract_content( $post_id );
		if ( empty( $content ) ) {
			return false;
		}

		// Find and remove the element from its current position.
		$element = null;
		$content = $this->remove_element_recursive( $content, $element_id, $element );
		if ( null === $element ) {
			return false;
		}

		// Insert at the new position.
		$content = $this->insert_element_recursive( $content, $element, $target_id, $position );

		return $this->inject_content( $post_id, $content );
	}

	/**
	 * Duplicate an element.
	 *
	 * Default implementation: extract, clone with new ID, inject.
	 *
	 * @param int    $post_id    Post ID.
	 * @param string $element_id Element ID to duplicate.
	 * @return string|null New element ID or null on failure.
	 */
	public function duplicate_element( int $post_id, string $element_id ): ?string {
		$content = $this->extract_content( $post_id );
		if ( empty( $content ) ) {
			return null;
		}

		$element = $this->find_element_by_id( $content, $element_id );
		if ( null === $element ) {
			return null;
		}

		$new_id  = $this->generate_id();
		$clone   = $this->clone_element( $element, $new_id );
		$content = $this->insert_element_recursive( $content, $clone, $element_id, 'after' );

		if ( ! $this->inject_content( $post_id, $content ) ) {
			return null;
		}

		return $new_id;
	}

	/**
	 * Remove an element from a post.
	 *
	 * Default implementation: extract, remove, inject.
	 *
	 * @param int    $post_id    Post ID.
	 * @param string $element_id Element ID to remove.
	 * @return bool True on success.
	 */
	public function remove_element( int $post_id, string $element_id ): bool {
		$content = $this->extract_content( $post_id );
		if ( empty( $content ) ) {
			return false;
		}

		$removed = null;
		$content = $this->remove_element_recursive( $content, $element_id, $removed );
		if ( null === $removed ) {
			return false;
		}

		return $this->inject_content( $post_id, $content );
	}

	/**
	 * Generate a unique element ID.
	 *
	 * @return string 8-character hex ID.
	 */
	protected function generate_id(): string {
		return bin2hex( random_bytes( 4 ) );
	}

	/**
	 * Recursively find an element by ID in the tree.
	 *
	 * @param array  $elements Element tree.
	 * @param string $id       Element ID to find.
	 * @return array|null Found element or null.
	 */
	protected function find_element_by_id( array $elements, string $id ): ?array {
		foreach ( $elements as $element ) {
			$el_id = $element['id'] ?? ( $element['_id'] ?? '' );
			if ( $el_id === $id ) {
				return $element;
			}

			$children_key = $this->get_children_key( $element );
			if ( $children_key && ! empty( $element[ $children_key ] ) ) {
				$found = $this->find_element_by_id( $element[ $children_key ], $id );
				if ( null !== $found ) {
					return $found;
				}
			}
		}

		return null;
	}

	/**
	 * Recursively remove an element by ID from the tree.
	 *
	 * @param array       $elements Element tree.
	 * @param string      $id       Element ID to remove.
	 * @param array|null  &$removed Removed element (output parameter).
	 * @return array Modified element tree.
	 */
	protected function remove_element_recursive( array $elements, string $id, ?array &$removed ): array {
		$result = [];
		foreach ( $elements as $element ) {
			$el_id = $element['id'] ?? ( $element['_id'] ?? '' );
			if ( $el_id === $id ) {
				$removed = $element;
				continue;
			}

			$children_key = $this->get_children_key( $element );
			if ( $children_key && ! empty( $element[ $children_key ] ) ) {
				$element[ $children_key ] = $this->remove_element_recursive(
					$element[ $children_key ],
					$id,
					$removed
				);
			}

			$result[] = $element;
		}

		return $result;
	}

	/**
	 * Recursively insert an element relative to a target.
	 *
	 * @param array  $elements Element tree.
	 * @param array  $new      New element to insert.
	 * @param string $target   Target element ID.
	 * @param string $position 'before', 'after', or 'inside'.
	 * @return array Modified element tree.
	 */
	protected function insert_element_recursive( array $elements, array $new, string $target, string $position ): array {
		$result = [];
		foreach ( $elements as $element ) {
			$el_id = $element['id'] ?? ( $element['_id'] ?? '' );

			if ( $el_id === $target ) {
				if ( 'before' === $position ) {
					$result[] = $new;
					$result[] = $element;
				} elseif ( 'after' === $position ) {
					$result[] = $element;
					$result[] = $new;
				} elseif ( 'inside' === $position ) {
					$children_key = $this->get_children_key( $element );
					if ( $children_key ) {
						$element[ $children_key ]   = $element[ $children_key ] ?? [];
						$element[ $children_key ][] = $new;
					}
					$result[] = $element;
				}
				continue;
			}

			$children_key = $this->get_children_key( $element );
			if ( $children_key && ! empty( $element[ $children_key ] ) ) {
				$element[ $children_key ] = $this->insert_element_recursive(
					$element[ $children_key ],
					$new,
					$target,
					$position
				);
			}

			$result[] = $element;
		}

		return $result;
	}

	/**
	 * Clone an element with a new ID, recursively assigning new IDs to children.
	 *
	 * @param array  $element Original element.
	 * @param string $new_id  New ID for the root clone.
	 * @return array Cloned element.
	 */
	protected function clone_element( array $element, string $new_id ): array {
		$clone = $element;

		if ( isset( $clone['id'] ) ) {
			$clone['id'] = $new_id;
		} elseif ( isset( $clone['_id'] ) ) {
			$clone['_id'] = $new_id;
		}

		$children_key = $this->get_children_key( $clone );
		if ( $children_key && ! empty( $clone[ $children_key ] ) ) {
			$clone[ $children_key ] = array_map( function ( $child ) {
				return $this->clone_element( $child, $this->generate_id() );
			}, $clone[ $children_key ] );
		}

		return $clone;
	}

	/**
	 * Get the key used for children in an element array.
	 *
	 * Different builders use different keys: 'elements', 'children', etc.
	 * Subclasses should override if needed.
	 *
	 * @param array $element The element to check.
	 * @return string|null Children key or null if no children.
	 */
	protected function get_children_key( array $element ): ?string {
		if ( isset( $element['elements'] ) ) {
			return 'elements';
		}
		if ( isset( $element['children'] ) ) {
			return 'children';
		}

		return null;
	}

	/**
	 * Recursively search elements matching criteria.
	 *
	 * @param array $elements Element tree.
	 * @param array $criteria Search criteria.
	 * @return array Matching elements.
	 */
	protected function search_recursive( array $elements, array $criteria ): array {
		$matches = [];

		foreach ( $elements as $element ) {
			if ( $this->element_matches( $element, $criteria ) ) {
				$matches[] = $element;
			}

			$children_key = $this->get_children_key( $element );
			if ( $children_key && ! empty( $element[ $children_key ] ) ) {
				$matches = array_merge(
					$matches,
					$this->search_recursive( $element[ $children_key ], $criteria )
				);
			}
		}

		return $matches;
	}

	/**
	 * Check if an element matches the given criteria.
	 *
	 * @param array $element  Element to check.
	 * @param array $criteria Search criteria.
	 * @return bool True if element matches.
	 */
	protected function element_matches( array $element, array $criteria ): bool {
		foreach ( $criteria as $key => $value ) {
			switch ( $key ) {
				case 'type':
				case 'widgetType':
				case 'elType':
					$el_type = $element['widgetType'] ?? ( $element['elType'] ?? ( $element['type'] ?? '' ) );
					if ( $el_type !== $value ) {
						return false;
					}
					break;

				case 'id':
					$el_id = $element['id'] ?? ( $element['_id'] ?? '' );
					if ( $el_id !== $value ) {
						return false;
					}
					break;

				case 'text':
					$haystack = wp_json_encode( $element );
					if ( false === strpos( $haystack, $value ) ) {
						return false;
					}
					break;

				default:
					if ( ! isset( $element[ $key ] ) || $element[ $key ] !== $value ) {
						return false;
					}
					break;
			}
		}

		return true;
	}
}
