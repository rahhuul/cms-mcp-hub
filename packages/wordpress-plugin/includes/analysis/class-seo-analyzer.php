<?php
/**
 * SEO Analyzer — server-side SEO audit for WordPress posts.
 *
 * Checks title length, meta description, heading hierarchy, image alt text,
 * links, content length, focus keywords, schema markup, Open Graph, and more.
 *
 * @package CmsMcpHub
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class CmsMcp_Seo_Analyzer
 *
 * Provides a comprehensive SEO audit for any post or page.
 */
class CmsMcp_Seo_Analyzer {

	/**
	 * Recommended title length range (characters).
	 */
	const TITLE_MIN_LENGTH = 30;
	const TITLE_MAX_LENGTH = 60;

	/**
	 * Recommended meta description length range (characters).
	 */
	const DESC_MIN_LENGTH = 120;
	const DESC_MAX_LENGTH = 160;

	/**
	 * Minimum recommended content length (words).
	 */
	const MIN_CONTENT_WORDS = 300;

	/**
	 * Run a full SEO audit for a post.
	 *
	 * @param int $post_id The post ID to analyze.
	 * @return array Structured SEO audit result with score, issues, and details.
	 */
	public static function analyze( int $post_id ): array {
		$post = get_post( $post_id );

		if ( ! $post ) {
			return array(
				'error'   => 'Post not found.',
				'post_id' => $post_id,
			);
		}

		$content  = apply_filters( 'the_content', $post->post_content );
		$raw      = $post->post_content;
		$issues   = array();
		$passes   = array();
		$details  = array();

		// --- Title tag ---
		$seo_title = self::get_seo_title( $post_id, $post );
		$title_len = mb_strlen( $seo_title );
		$details['title'] = array(
			'value'  => $seo_title,
			'length' => $title_len,
		);

		if ( $title_len < self::TITLE_MIN_LENGTH ) {
			$issues[] = array(
				'category' => 'title',
				'severity' => 'warning',
				'message'  => sprintf( 'Title is too short (%d chars). Aim for %d-%d characters.', $title_len, self::TITLE_MIN_LENGTH, self::TITLE_MAX_LENGTH ),
			);
		} elseif ( $title_len > self::TITLE_MAX_LENGTH ) {
			$issues[] = array(
				'category' => 'title',
				'severity' => 'warning',
				'message'  => sprintf( 'Title is too long (%d chars). Aim for %d-%d characters.', $title_len, self::TITLE_MIN_LENGTH, self::TITLE_MAX_LENGTH ),
			);
		} else {
			$passes[] = 'Title length is optimal.';
		}

		// --- Meta description ---
		$meta_desc = self::get_meta_description( $post_id, $post );
		$desc_len  = mb_strlen( $meta_desc );
		$details['meta_description'] = array(
			'value'  => $meta_desc,
			'length' => $desc_len,
		);

		if ( empty( $meta_desc ) ) {
			$issues[] = array(
				'category' => 'meta_description',
				'severity' => 'error',
				'message'  => 'No meta description found. Add one via your SEO plugin or post excerpt.',
			);
		} elseif ( $desc_len < self::DESC_MIN_LENGTH ) {
			$issues[] = array(
				'category' => 'meta_description',
				'severity' => 'warning',
				'message'  => sprintf( 'Meta description is short (%d chars). Aim for %d-%d characters.', $desc_len, self::DESC_MIN_LENGTH, self::DESC_MAX_LENGTH ),
			);
		} elseif ( $desc_len > self::DESC_MAX_LENGTH ) {
			$issues[] = array(
				'category' => 'meta_description',
				'severity' => 'warning',
				'message'  => sprintf( 'Meta description is long (%d chars). It may be truncated in search results.', $desc_len ),
			);
		} else {
			$passes[] = 'Meta description length is optimal.';
		}

		// --- Heading hierarchy ---
		$headings = self::parse_headings( $content );
		$details['headings'] = $headings;

		$h1_count = count( array_filter( $headings, function ( $h ) {
			return 'h1' === $h['level'];
		} ) );

		if ( 0 === $h1_count ) {
			$issues[] = array(
				'category' => 'headings',
				'severity' => 'warning',
				'message'  => 'No H1 heading found in content.',
			);
		} elseif ( $h1_count > 1 ) {
			$issues[] = array(
				'category' => 'headings',
				'severity' => 'warning',
				'message'  => sprintf( 'Multiple H1 headings found (%d). Use only one H1 per page.', $h1_count ),
			);
		} else {
			$passes[] = 'Single H1 heading present.';
		}

		// Check for skipped heading levels.
		$heading_levels = array_map( function ( $h ) {
			return (int) substr( $h['level'], 1 );
		}, $headings );

		if ( ! empty( $heading_levels ) ) {
			$skipped = false;
			for ( $i = 1; $i < count( $heading_levels ); $i++ ) {
				if ( $heading_levels[ $i ] > $heading_levels[ $i - 1 ] + 1 ) {
					$skipped = true;
					break;
				}
			}
			if ( $skipped ) {
				$issues[] = array(
					'category' => 'headings',
					'severity' => 'warning',
					'message'  => 'Heading levels are skipped (e.g., H2 to H4). Use sequential heading levels.',
				);
			} else {
				$passes[] = 'Heading hierarchy is sequential.';
			}
		}

		// --- Images and alt text ---
		$images = self::parse_images( $content );
		$details['images'] = array(
			'total'        => count( $images ),
			'missing_alt'  => 0,
			'empty_alt'    => 0,
		);

		$images_missing_alt = array();

		foreach ( $images as $img ) {
			if ( ! isset( $img['alt'] ) ) {
				$details['images']['missing_alt']++;
				$images_missing_alt[] = $img['src'] ?? '(unknown src)';
			} elseif ( '' === trim( $img['alt'] ) ) {
				$details['images']['empty_alt']++;
				$images_missing_alt[] = $img['src'] ?? '(unknown src)';
			}
		}

		if ( ! empty( $images_missing_alt ) ) {
			$issues[] = array(
				'category' => 'images',
				'severity' => 'error',
				'message'  => sprintf(
					'%d image(s) missing alt text. This hurts accessibility and SEO.',
					count( $images_missing_alt )
				),
				'details'  => array_slice( $images_missing_alt, 0, 10 ),
			);
		} elseif ( count( $images ) > 0 ) {
			$passes[] = 'All images have alt text.';
		}

		// --- Links ---
		$links = self::parse_links( $content, $post_id );
		$details['links'] = $links;

		if ( 0 === $links['internal'] && 0 === $links['external'] ) {
			$issues[] = array(
				'category' => 'links',
				'severity' => 'warning',
				'message'  => 'No links found in content. Add internal and external links for better SEO.',
			);
		} else {
			if ( 0 === $links['internal'] ) {
				$issues[] = array(
					'category' => 'links',
					'severity' => 'warning',
					'message'  => 'No internal links found. Add links to other pages on your site.',
				);
			} else {
				$passes[] = sprintf( '%d internal link(s) found.', $links['internal'] );
			}

			if ( 0 === $links['external'] ) {
				$issues[] = array(
					'category' => 'links',
					'severity' => 'info',
					'message'  => 'No external links found. Consider linking to authoritative sources.',
				);
			}
		}

		// --- Content length ---
		$plain_text = wp_strip_all_tags( $content );
		$word_count = str_word_count( $plain_text );
		$details['content'] = array(
			'word_count' => $word_count,
			'char_count' => mb_strlen( $plain_text ),
		);

		if ( $word_count < self::MIN_CONTENT_WORDS ) {
			$issues[] = array(
				'category' => 'content',
				'severity' => 'warning',
				'message'  => sprintf(
					'Content is thin (%d words). Aim for at least %d words for better rankings.',
					$word_count,
					self::MIN_CONTENT_WORDS
				),
			);
		} else {
			$passes[] = sprintf( 'Content length is good (%d words).', $word_count );
		}

		// --- Focus keyword ---
		$focus_keyword = self::get_focus_keyword( $post_id );
		$details['focus_keyword'] = $focus_keyword;

		if ( ! empty( $focus_keyword ) ) {
			$kw_lower      = mb_strtolower( $focus_keyword );
			$title_lower   = mb_strtolower( $seo_title );
			$content_lower = mb_strtolower( $plain_text );

			$in_title   = false !== mb_strpos( $title_lower, $kw_lower );
			$in_content = false !== mb_strpos( $content_lower, $kw_lower );

			if ( ! $in_title ) {
				$issues[] = array(
					'category' => 'keyword',
					'severity' => 'warning',
					'message'  => sprintf( 'Focus keyword "%s" not found in the title.', $focus_keyword ),
				);
			} else {
				$passes[] = 'Focus keyword appears in the title.';
			}

			if ( ! $in_content ) {
				$issues[] = array(
					'category' => 'keyword',
					'severity' => 'error',
					'message'  => sprintf( 'Focus keyword "%s" not found in the content.', $focus_keyword ),
				);
			} else {
				// Calculate keyword density.
				$kw_count = mb_substr_count( $content_lower, $kw_lower );
				$density  = ( $word_count > 0 ) ? round( ( $kw_count / $word_count ) * 100, 2 ) : 0;
				$details['keyword_density'] = $density;
				$passes[] = sprintf( 'Focus keyword found in content (density: %s%%).', $density );
			}
		} else {
			$issues[] = array(
				'category' => 'keyword',
				'severity' => 'info',
				'message'  => 'No focus keyword set. Set one in your SEO plugin for targeted optimization.',
			);
		}

		// --- Schema markup ---
		$has_schema = self::has_schema_markup( $post_id );
		$details['schema_markup'] = $has_schema;

		if ( $has_schema ) {
			$passes[] = 'Schema markup (JSON-LD) detected.';
		} else {
			$issues[] = array(
				'category' => 'schema',
				'severity' => 'info',
				'message'  => 'No schema markup detected. Consider adding structured data.',
			);
		}

		// --- Open Graph ---
		$og_tags = self::get_og_tags( $post_id );
		$details['open_graph'] = $og_tags;

		if ( ! empty( $og_tags['og:title'] ) && ! empty( $og_tags['og:description'] ) ) {
			$passes[] = 'Open Graph title and description set.';
		} else {
			$issues[] = array(
				'category' => 'social',
				'severity' => 'info',
				'message'  => 'Open Graph tags are incomplete. Install an SEO plugin for proper social sharing.',
			);
		}

		// --- Canonical URL ---
		$canonical = self::get_canonical_url( $post_id );
		$details['canonical_url'] = $canonical;

		if ( ! empty( $canonical ) ) {
			$passes[] = 'Canonical URL is set.';
		}

		// --- Robots meta (noindex check) ---
		$noindex = self::is_noindex( $post_id );
		$details['noindex'] = $noindex;

		if ( $noindex ) {
			$issues[] = array(
				'category' => 'indexing',
				'severity' => 'warning',
				'message'  => 'This post is set to noindex. It will not appear in search results.',
			);
		} else {
			$passes[] = 'Post is indexable.';
		}

		// --- Calculate score ---
		$score = self::calculate_score( $issues, $passes );

		return array(
			'post_id'  => $post_id,
			'url'      => get_permalink( $post_id ),
			'score'    => $score,
			'grade'    => self::score_to_grade( $score ),
			'issues'   => $issues,
			'passes'   => $passes,
			'details'  => $details,
			'summary'  => sprintf(
				'%d issues found, %d checks passed. Score: %d/100 (%s).',
				count( $issues ),
				count( $passes ),
				$score,
				self::score_to_grade( $score )
			),
		);
	}

	/**
	 * Get the SEO title for a post.
	 *
	 * Checks Yoast and RankMath meta first, falls back to post title.
	 *
	 * @param int      $post_id The post ID.
	 * @param \WP_Post $post    The post object.
	 * @return string The SEO title.
	 */
	private static function get_seo_title( int $post_id, \WP_Post $post ): string {
		// Yoast SEO.
		$yoast_title = get_post_meta( $post_id, '_yoast_wpseo_title', true );
		if ( ! empty( $yoast_title ) ) {
			return $yoast_title;
		}

		// RankMath.
		$rank_title = get_post_meta( $post_id, 'rank_math_title', true );
		if ( ! empty( $rank_title ) ) {
			return $rank_title;
		}

		// SEOPress.
		$seopress_title = get_post_meta( $post_id, '_seopress_titles_title', true );
		if ( ! empty( $seopress_title ) ) {
			return $seopress_title;
		}

		return $post->post_title;
	}

	/**
	 * Get the meta description for a post.
	 *
	 * @param int      $post_id The post ID.
	 * @param \WP_Post $post    The post object.
	 * @return string The meta description.
	 */
	private static function get_meta_description( int $post_id, \WP_Post $post ): string {
		// Yoast SEO.
		$yoast_desc = get_post_meta( $post_id, '_yoast_wpseo_metadesc', true );
		if ( ! empty( $yoast_desc ) ) {
			return $yoast_desc;
		}

		// RankMath.
		$rank_desc = get_post_meta( $post_id, 'rank_math_description', true );
		if ( ! empty( $rank_desc ) ) {
			return $rank_desc;
		}

		// SEOPress.
		$seopress_desc = get_post_meta( $post_id, '_seopress_titles_desc', true );
		if ( ! empty( $seopress_desc ) ) {
			return $seopress_desc;
		}

		// Fallback to excerpt.
		return $post->post_excerpt;
	}

	/**
	 * Get the focus keyword for a post.
	 *
	 * @param int $post_id The post ID.
	 * @return string The focus keyword, or empty string.
	 */
	private static function get_focus_keyword( int $post_id ): string {
		// Yoast SEO.
		$yoast_kw = get_post_meta( $post_id, '_yoast_wpseo_focuskw', true );
		if ( ! empty( $yoast_kw ) ) {
			return $yoast_kw;
		}

		// RankMath.
		$rank_kw = get_post_meta( $post_id, 'rank_math_focus_keyword', true );
		if ( ! empty( $rank_kw ) ) {
			// RankMath stores comma-separated keywords, take the first.
			$keywords = explode( ',', $rank_kw );
			return trim( $keywords[0] );
		}

		// SEOPress.
		$seopress_kw = get_post_meta( $post_id, '_seopress_analysis_target_kw', true );
		if ( ! empty( $seopress_kw ) ) {
			return $seopress_kw;
		}

		return '';
	}

	/**
	 * Parse headings from HTML content.
	 *
	 * @param string $html The HTML content.
	 * @return array Array of heading objects with level and text.
	 */
	private static function parse_headings( string $html ): array {
		$headings = array();

		if ( preg_match_all( '/<(h[1-6])[^>]*>(.*?)<\/\1>/is', $html, $matches, PREG_SET_ORDER ) ) {
			foreach ( $matches as $match ) {
				$headings[] = array(
					'level' => strtolower( $match[1] ),
					'text'  => wp_strip_all_tags( $match[2] ),
				);
			}
		}

		return $headings;
	}

	/**
	 * Parse images from HTML content.
	 *
	 * @param string $html The HTML content.
	 * @return array Array of image data with src and alt.
	 */
	private static function parse_images( string $html ): array {
		$images = array();

		if ( preg_match_all( '/<img\s[^>]*>/is', $html, $matches ) ) {
			foreach ( $matches[0] as $img_tag ) {
				$image = array();

				if ( preg_match( '/src=["\']([^"\']+)["\']/i', $img_tag, $src_match ) ) {
					$image['src'] = $src_match[1];
				}

				if ( preg_match( '/alt=["\']([^"\']*?)["\']/i', $img_tag, $alt_match ) ) {
					$image['alt'] = $alt_match[1];
				}

				$images[] = $image;
			}
		}

		return $images;
	}

	/**
	 * Parse and categorize links from HTML content.
	 *
	 * @param string $html    The HTML content.
	 * @param int    $post_id The post ID (for site URL comparison).
	 * @return array Link counts: internal, external, total.
	 */
	private static function parse_links( string $html, int $post_id ): array {
		$result = array(
			'internal' => 0,
			'external' => 0,
			'total'    => 0,
		);

		if ( preg_match_all( '/<a\s[^>]*href=["\']([^"\']+)["\']/i', $html, $matches ) ) {
			$site_host = wp_parse_url( home_url(), PHP_URL_HOST );

			foreach ( $matches[1] as $href ) {
				$result['total']++;

				$parsed_host = wp_parse_url( $href, PHP_URL_HOST );

				if ( empty( $parsed_host ) || $parsed_host === $site_host ) {
					$result['internal']++;
				} else {
					$result['external']++;
				}
			}
		}

		return $result;
	}

	/**
	 * Check if schema markup (JSON-LD) is present.
	 *
	 * @param int $post_id The post ID.
	 * @return bool True if schema markup is detected.
	 */
	private static function has_schema_markup( int $post_id ): bool {
		// Yoast SEO schema.
		$yoast_schema = get_post_meta( $post_id, '_yoast_wpseo_schema_page_type', true );
		if ( ! empty( $yoast_schema ) ) {
			return true;
		}

		// RankMath schema.
		$rank_schema = get_post_meta( $post_id, 'rank_math_rich_snippet', true );
		if ( ! empty( $rank_schema ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Get Open Graph tags for a post.
	 *
	 * @param int $post_id The post ID.
	 * @return array Open Graph tag values.
	 */
	private static function get_og_tags( int $post_id ): array {
		$og = array();

		// Yoast.
		$og_title = get_post_meta( $post_id, '_yoast_wpseo_opengraph-title', true );
		$og_desc  = get_post_meta( $post_id, '_yoast_wpseo_opengraph-description', true );
		$og_image = get_post_meta( $post_id, '_yoast_wpseo_opengraph-image', true );

		if ( ! empty( $og_title ) ) {
			$og['og:title'] = $og_title;
		}
		if ( ! empty( $og_desc ) ) {
			$og['og:description'] = $og_desc;
		}
		if ( ! empty( $og_image ) ) {
			$og['og:image'] = $og_image;
		}

		// RankMath.
		if ( empty( $og['og:title'] ) ) {
			$rm_title = get_post_meta( $post_id, 'rank_math_facebook_title', true );
			if ( ! empty( $rm_title ) ) {
				$og['og:title'] = $rm_title;
			}
		}
		if ( empty( $og['og:description'] ) ) {
			$rm_desc = get_post_meta( $post_id, 'rank_math_facebook_description', true );
			if ( ! empty( $rm_desc ) ) {
				$og['og:description'] = $rm_desc;
			}
		}

		return $og;
	}

	/**
	 * Get the canonical URL for a post.
	 *
	 * @param int $post_id The post ID.
	 * @return string The canonical URL.
	 */
	private static function get_canonical_url( int $post_id ): string {
		// Yoast canonical.
		$yoast_canonical = get_post_meta( $post_id, '_yoast_wpseo_canonical', true );
		if ( ! empty( $yoast_canonical ) ) {
			return $yoast_canonical;
		}

		// RankMath canonical.
		$rank_canonical = get_post_meta( $post_id, 'rank_math_canonical_url', true );
		if ( ! empty( $rank_canonical ) ) {
			return $rank_canonical;
		}

		// Default WordPress canonical.
		return get_permalink( $post_id );
	}

	/**
	 * Check if a post is set to noindex.
	 *
	 * @param int $post_id The post ID.
	 * @return bool True if the post is noindexed.
	 */
	private static function is_noindex( int $post_id ): bool {
		// Yoast: value 2 means noindex.
		$yoast_meta = get_post_meta( $post_id, '_yoast_wpseo_meta-robots-noindex', true );
		if ( '1' === $yoast_meta ) {
			return true;
		}

		// RankMath.
		$rank_robots = get_post_meta( $post_id, 'rank_math_robots', true );
		if ( is_array( $rank_robots ) && in_array( 'noindex', $rank_robots, true ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Calculate an SEO score based on issues and passes.
	 *
	 * @param array $issues Array of issues found.
	 * @param array $passes Array of checks that passed.
	 * @return int Score from 0 to 100.
	 */
	private static function calculate_score( array $issues, array $passes ): int {
		$total       = count( $issues ) + count( $passes );
		$deductions  = 0;

		foreach ( $issues as $issue ) {
			switch ( $issue['severity'] ) {
				case 'error':
					$deductions += 15;
					break;
				case 'warning':
					$deductions += 8;
					break;
				case 'info':
					$deductions += 3;
					break;
			}
		}

		$score = max( 0, 100 - $deductions );

		return (int) $score;
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
