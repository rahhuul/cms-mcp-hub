<?php
/**
 * Performance Analyzer — server-side performance analysis for WordPress posts.
 *
 * Checks content size, image count, external resources, inline CSS,
 * render-blocking resources, lazy loading, DOM complexity, and shortcodes.
 *
 * @package CmsMcpHub
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class CmsMcp_Performance_Analyzer
 *
 * Provides performance analysis and recommendations for post content.
 */
class CmsMcp_Performance_Analyzer {

	/**
	 * Content size thresholds (bytes).
	 */
	const SIZE_GOOD    = 50000;   // 50 KB.
	const SIZE_WARNING = 150000;  // 150 KB.

	/**
	 * Image count thresholds.
	 */
	const IMAGES_GOOD    = 10;
	const IMAGES_WARNING = 20;

	/**
	 * Run a performance analysis on a post.
	 *
	 * @param int $post_id The post ID to analyze.
	 * @return array Structured performance report with score, metrics, and recommendations.
	 */
	public static function analyze( int $post_id ): array {
		$post = get_post( $post_id );

		if ( ! $post ) {
			return array(
				'error'   => 'Post not found.',
				'post_id' => $post_id,
			);
		}

		$content         = apply_filters( 'the_content', $post->post_content );
		$raw             = $post->post_content;
		$metrics         = array();
		$recommendations = array();
		$deductions      = 0;

		// --- Content size ---
		$content_bytes = strlen( $content );
		$metrics['content_size'] = array(
			'bytes'     => $content_bytes,
			'formatted' => self::format_bytes( $content_bytes ),
		);

		if ( $content_bytes > self::SIZE_WARNING ) {
			$recommendations[] = sprintf(
				'Content HTML is large (%s). Consider breaking into multiple pages or reducing inline styles.',
				self::format_bytes( $content_bytes )
			);
			$deductions += 15;
		} elseif ( $content_bytes > self::SIZE_GOOD ) {
			$recommendations[] = sprintf(
				'Content HTML is moderately large (%s). Monitor for performance impact.',
				self::format_bytes( $content_bytes )
			);
			$deductions += 5;
		}

		// --- Image count and analysis ---
		$image_data = self::analyze_images( $content );
		$metrics['images'] = $image_data;

		if ( $image_data['total'] > self::IMAGES_WARNING ) {
			$recommendations[] = sprintf(
				'Page has %d images. Consider lazy loading, reducing image count, or using pagination.',
				$image_data['total']
			);
			$deductions += 15;
		} elseif ( $image_data['total'] > self::IMAGES_GOOD ) {
			$recommendations[] = sprintf(
				'Page has %d images. Ensure they are optimized and lazy loaded.',
				$image_data['total']
			);
			$deductions += 5;
		}

		if ( $image_data['without_dimensions'] > 0 ) {
			$recommendations[] = sprintf(
				'%d image(s) missing width/height attributes. This causes layout shifts (CLS).',
				$image_data['without_dimensions']
			);
			$deductions += 5;
		}

		if ( $image_data['without_lazy_loading'] > 0 && $image_data['total'] > 3 ) {
			$recommendations[] = sprintf(
				'%d image(s) do not use lazy loading. Add loading="lazy" to below-the-fold images.',
				$image_data['without_lazy_loading']
			);
			$deductions += 8;
		}

		// --- External scripts and resources ---
		$external = self::count_external_resources( $content );
		$metrics['external_resources'] = $external;

		if ( $external['scripts'] > 3 ) {
			$recommendations[] = sprintf(
				'%d external scripts found in content. Minimize third-party scripts for better performance.',
				$external['scripts']
			);
			$deductions += 10;
		}

		if ( $external['iframes'] > 2 ) {
			$recommendations[] = sprintf(
				'%d iframes found. Consider lazy loading iframes or using facade patterns for embeds.',
				$external['iframes']
			);
			$deductions += 8;
		}

		// --- Inline CSS ---
		$inline_css = self::analyze_inline_css( $content );
		$metrics['inline_css'] = $inline_css;

		if ( $inline_css['total_bytes'] > 5000 ) {
			$recommendations[] = sprintf(
				'%s of inline CSS found. Move styles to external stylesheets for better caching.',
				self::format_bytes( $inline_css['total_bytes'] )
			);
			$deductions += 8;
		}

		// --- Render-blocking resources ---
		$blocking = self::count_render_blocking( $content );
		$metrics['render_blocking'] = $blocking;

		if ( $blocking['scripts'] > 0 ) {
			$recommendations[] = sprintf(
				'%d render-blocking <script> tag(s) found in content (without async/defer).',
				$blocking['scripts']
			);
			$deductions += 10;
		}

		if ( $blocking['stylesheets'] > 0 ) {
			$recommendations[] = sprintf(
				'%d render-blocking <link> stylesheet(s) found in content.',
				$blocking['stylesheets']
			);
			$deductions += 5;
		}

		// --- DOM node estimate ---
		$dom_nodes = self::estimate_dom_nodes( $content );
		$metrics['estimated_dom_nodes'] = $dom_nodes;

		if ( $dom_nodes > 1500 ) {
			$recommendations[] = sprintf(
				'High DOM node count (~%d). Excessive DOM size impacts rendering performance.',
				$dom_nodes
			);
			$deductions += 10;
		} elseif ( $dom_nodes > 800 ) {
			$recommendations[] = sprintf(
				'Moderate DOM node count (~%d). Keep DOM size under 1500 nodes for best performance.',
				$dom_nodes
			);
			$deductions += 3;
		}

		// --- Shortcode count ---
		$shortcode_count = self::count_shortcodes( $raw );
		$metrics['shortcodes'] = $shortcode_count;

		if ( $shortcode_count > 20 ) {
			$recommendations[] = sprintf(
				'%d shortcodes found. Each shortcode adds server-side processing time. Consider converting to blocks or static HTML.',
				$shortcode_count
			);
			$deductions += 10;
		} elseif ( $shortcode_count > 10 ) {
			$recommendations[] = sprintf(
				'%d shortcodes found. Monitor server response time.',
				$shortcode_count
			);
			$deductions += 3;
		}

		// --- Builder meta size ---
		$builder_meta_size = self::get_builder_meta_size( $post_id );
		$metrics['builder_meta_size'] = array(
			'bytes'     => $builder_meta_size,
			'formatted' => self::format_bytes( $builder_meta_size ),
		);

		if ( $builder_meta_size > 500000 ) {
			$recommendations[] = sprintf(
				'Builder meta data is large (%s). This can slow down post loading and database queries.',
				self::format_bytes( $builder_meta_size )
			);
			$deductions += 8;
		}

		// --- Calculate score ---
		$score = max( 0, 100 - $deductions );

		return array(
			'post_id'         => $post_id,
			'url'             => get_permalink( $post_id ),
			'score'           => $score,
			'grade'           => self::score_to_grade( $score ),
			'metrics'         => $metrics,
			'recommendations' => $recommendations,
			'summary'         => sprintf(
				'Performance score: %d/100 (%s). %d recommendation(s).',
				$score,
				self::score_to_grade( $score ),
				count( $recommendations )
			),
		);
	}

	/**
	 * Analyze images in the content.
	 *
	 * @param string $html The HTML content.
	 * @return array Image analysis data.
	 */
	private static function analyze_images( string $html ): array {
		$result = array(
			'total'                => 0,
			'with_lazy_loading'    => 0,
			'without_lazy_loading' => 0,
			'with_dimensions'      => 0,
			'without_dimensions'   => 0,
			'formats'              => array(),
		);

		if ( ! preg_match_all( '/<img\s[^>]*>/is', $html, $matches ) ) {
			return $result;
		}

		$result['total'] = count( $matches[0] );

		foreach ( $matches[0] as $img_tag ) {
			// Check lazy loading.
			if ( preg_match( '/loading\s*=\s*["\']lazy["\']/i', $img_tag ) ) {
				$result['with_lazy_loading']++;
			} else {
				$result['without_lazy_loading']++;
			}

			// Check dimensions.
			$has_width  = preg_match( '/\bwidth\s*=\s*["\']?\d+/i', $img_tag );
			$has_height = preg_match( '/\bheight\s*=\s*["\']?\d+/i', $img_tag );

			if ( $has_width && $has_height ) {
				$result['with_dimensions']++;
			} else {
				$result['without_dimensions']++;
			}

			// Detect format from src.
			if ( preg_match( '/src=["\']([^"\']+)["\']/i', $img_tag, $src_match ) ) {
				$ext = strtolower( pathinfo( wp_parse_url( $src_match[1], PHP_URL_PATH ) ?: '', PATHINFO_EXTENSION ) );

				if ( ! empty( $ext ) ) {
					if ( ! isset( $result['formats'][ $ext ] ) ) {
						$result['formats'][ $ext ] = 0;
					}
					$result['formats'][ $ext ]++;
				}
			}
		}

		return $result;
	}

	/**
	 * Count external resources (scripts, stylesheets, iframes).
	 *
	 * @param string $html The HTML content.
	 * @return array Resource counts.
	 */
	private static function count_external_resources( string $html ): array {
		$result = array(
			'scripts'     => 0,
			'stylesheets' => 0,
			'iframes'     => 0,
		);

		// External scripts.
		if ( preg_match_all( '/<script[^>]+src\s*=\s*["\']([^"\']+)["\']/i', $html, $matches ) ) {
			$result['scripts'] = count( $matches[0] );
		}

		// External stylesheets.
		if ( preg_match_all( '/<link[^>]+rel\s*=\s*["\']stylesheet["\']/i', $html, $matches ) ) {
			$result['stylesheets'] = count( $matches[0] );
		}

		// Iframes.
		if ( preg_match_all( '/<iframe\s/i', $html, $matches ) ) {
			$result['iframes'] = count( $matches[0] );
		}

		return $result;
	}

	/**
	 * Analyze inline CSS in the content.
	 *
	 * @param string $html The HTML content.
	 * @return array Inline CSS analysis.
	 */
	private static function analyze_inline_css( string $html ): array {
		$result = array(
			'style_tags'      => 0,
			'inline_styles'   => 0,
			'total_bytes'     => 0,
		);

		// <style> tags.
		if ( preg_match_all( '/<style[^>]*>(.*?)<\/style>/is', $html, $matches ) ) {
			$result['style_tags'] = count( $matches[0] );

			foreach ( $matches[1] as $css ) {
				$result['total_bytes'] += strlen( $css );
			}
		}

		// Inline style attributes.
		if ( preg_match_all( '/style\s*=\s*["\']([^"\']+)["\']/i', $html, $matches ) ) {
			$result['inline_styles'] = count( $matches[0] );

			foreach ( $matches[1] as $style ) {
				$result['total_bytes'] += strlen( $style );
			}
		}

		return $result;
	}

	/**
	 * Count render-blocking resources in the content.
	 *
	 * @param string $html The HTML content.
	 * @return array Blocking resource counts.
	 */
	private static function count_render_blocking( string $html ): array {
		$result = array(
			'scripts'     => 0,
			'stylesheets' => 0,
		);

		// Scripts without async or defer.
		if ( preg_match_all( '/<script[^>]+src\s*=\s*["\'][^"\']+["\']/i', $html, $matches ) ) {
			foreach ( $matches[0] as $script_tag ) {
				$has_async = preg_match( '/\basync\b/i', $script_tag );
				$has_defer = preg_match( '/\bdefer\b/i', $script_tag );

				if ( ! $has_async && ! $has_defer ) {
					$result['scripts']++;
				}
			}
		}

		// Link stylesheets (always render-blocking by default).
		if ( preg_match_all( '/<link[^>]+rel\s*=\s*["\']stylesheet["\']/i', $html, $matches ) ) {
			$result['stylesheets'] = count( $matches[0] );
		}

		return $result;
	}

	/**
	 * Estimate the DOM node count in the content.
	 *
	 * @param string $html The HTML content.
	 * @return int Estimated node count.
	 */
	private static function estimate_dom_nodes( string $html ): int {
		// Count opening tags as a rough DOM node estimate.
		$count = preg_match_all( '/<[a-z][a-z0-9]*[\s>]/i', $html );

		return ( false !== $count ) ? (int) $count : 0;
	}

	/**
	 * Count shortcodes in raw post content.
	 *
	 * @param string $raw_content The raw post content (before filters).
	 * @return int Shortcode count.
	 */
	private static function count_shortcodes( string $raw_content ): int {
		$count = preg_match_all( '/\[[a-zA-Z_][a-zA-Z0-9_-]*[\s\]]/i', $raw_content );

		return ( false !== $count ) ? (int) $count : 0;
	}

	/**
	 * Get the total size of builder meta data for a post.
	 *
	 * @param int $post_id The post ID.
	 * @return int Total bytes of builder meta.
	 */
	private static function get_builder_meta_size( int $post_id ): int {
		$meta_keys = array(
			'_elementor_data',
			'_bricks_page_content_2',
			'_fl_builder_data',
			'ct_builder_shortcodes',
			'_wpb_shortcodes_custom_css',
		);

		$total = 0;

		foreach ( $meta_keys as $key ) {
			$value = get_post_meta( $post_id, $key, true );

			if ( ! empty( $value ) ) {
				if ( is_array( $value ) ) {
					$total += strlen( wp_json_encode( $value ) );
				} else {
					$total += strlen( (string) $value );
				}
			}
		}

		return $total;
	}

	/**
	 * Format bytes into a human-readable string.
	 *
	 * @param int $bytes The byte count.
	 * @return string Formatted string (e.g., "1.5 KB").
	 */
	private static function format_bytes( int $bytes ): string {
		if ( $bytes < 1024 ) {
			return $bytes . ' B';
		}

		if ( $bytes < 1048576 ) {
			return round( $bytes / 1024, 1 ) . ' KB';
		}

		return round( $bytes / 1048576, 1 ) . ' MB';
	}

	/**
	 * Convert a numeric score to a letter grade.
	 *
	 * @param int $score The numeric score (0-100).
	 * @return string The letter grade.
	 */
	private static function score_to_grade( int $score ): string {
		if ( $score >= 90 ) {
			return 'A';
		}
		if ( $score >= 80 ) {
			return 'B';
		}
		if ( $score >= 70 ) {
			return 'C';
		}
		if ( $score >= 60 ) {
			return 'D';
		}
		return 'F';
	}
}
