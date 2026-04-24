<?php
/**
 * Accessibility Scanner — WCAG compliance checks for WordPress posts.
 *
 * Checks images without alt text, empty links, missing form labels,
 * heading hierarchy, deprecated elements, and more.
 *
 * @package CmsMcpHub
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class CmsMcp_Accessibility_Scanner
 *
 * Provides WCAG 2.1 Level AA accessibility scanning for post content.
 */
class CmsMcp_Accessibility_Scanner {

	/**
	 * Deprecated HTML elements that should not be used.
	 *
	 * @var string[]
	 */
	const DEPRECATED_ELEMENTS = array(
		'marquee',
		'blink',
		'center',
		'font',
		'big',
		'strike',
		'tt',
	);

	/**
	 * Run a WCAG accessibility scan on a post.
	 *
	 * @param int $post_id The post ID to scan.
	 * @return array Structured accessibility report with score, violations, passes, and warnings.
	 */
	public static function scan( int $post_id ): array {
		$post = get_post( $post_id );

		if ( ! $post ) {
			return array(
				'error'   => 'Post not found.',
				'post_id' => $post_id,
			);
		}

		$content    = apply_filters( 'the_content', $post->post_content );
		$violations = array();
		$passes     = 0;
		$warnings   = 0;

		// --- WCAG 1.1.1: Images without alt text ---
		self::check_image_alt_text( $content, $violations, $passes );

		// --- WCAG 2.4.4: Empty links / links without text ---
		self::check_empty_links( $content, $violations, $passes );

		// --- WCAG 1.3.1: Missing form labels ---
		self::check_form_labels( $content, $violations, $passes );

		// --- Basic color contrast check (inline styles) ---
		self::check_color_contrast( $content, $violations, $warnings );

		// --- WCAG 1.3.1: Heading hierarchy ---
		self::check_heading_hierarchy( $content, $violations, $passes );

		// --- Language attribute check ---
		self::check_language_attribute( $violations, $passes );

		// --- Empty table headers ---
		self::check_table_headers( $content, $violations, $passes );

		// --- Deprecated HTML elements ---
		self::check_deprecated_elements( $content, $violations, $passes );

		// --- WCAG 2.4.2: Page title ---
		if ( ! empty( $post->post_title ) ) {
			$passes++;
		} else {
			$violations[] = array(
				'rule'           => 'WCAG 2.4.2',
				'severity'       => 'error',
				'element'        => '<title>',
				'message'        => 'Post has no title. Every page needs a descriptive title.',
				'fix_suggestion' => 'Add a descriptive title to the post.',
			);
		}

		// --- WCAG 1.4.3: Ensure links are distinguishable ---
		self::check_link_distinguishability( $content, $violations, $warnings );

		// --- WCAG 1.3.1: Lists used correctly ---
		self::check_list_structure( $content, $violations, $passes );

		// --- Calculate score ---
		$error_count   = count( array_filter( $violations, function ( $v ) {
			return 'error' === $v['severity'];
		} ) );
		$warning_count = count( array_filter( $violations, function ( $v ) {
			return 'warning' === $v['severity'];
		} ) );

		$score = self::calculate_score( $error_count, $warning_count, $passes );

		return array(
			'post_id'    => $post_id,
			'url'        => get_permalink( $post_id ),
			'score'      => $score,
			'grade'      => self::score_to_grade( $score ),
			'violations' => $violations,
			'passes'     => $passes,
			'warnings'   => $warnings + $warning_count,
			'errors'     => $error_count,
			'summary'    => sprintf(
				'Accessibility score: %d/100 (%s). %d violation(s), %d warning(s), %d check(s) passed.',
				$score,
				self::score_to_grade( $score ),
				$error_count,
				$warnings + $warning_count,
				$passes
			),
		);
	}

	/**
	 * Check images for missing or empty alt attributes (WCAG 1.1.1).
	 *
	 * @param string $html       The HTML content.
	 * @param array  $violations Violations array (passed by reference).
	 * @param int    $passes     Passes count (passed by reference).
	 */
	private static function check_image_alt_text( string $html, array &$violations, int &$passes ): void {
		if ( ! preg_match_all( '/<img\s[^>]*>/is', $html, $matches ) ) {
			return;
		}

		$has_issue = false;

		foreach ( $matches[0] as $img_tag ) {
			// Check if alt attribute exists at all.
			if ( ! preg_match( '/\balt\s*=/i', $img_tag ) ) {
				$src = '';
				if ( preg_match( '/src=["\']([^"\']+)["\']/i', $img_tag, $src_match ) ) {
					$src = $src_match[1];
				}

				$violations[] = array(
					'rule'           => 'WCAG 1.1.1',
					'severity'       => 'error',
					'element'        => self::truncate_element( $img_tag ),
					'message'        => 'Image is missing the alt attribute.',
					'fix_suggestion' => 'Add alt="descriptive text" to the <img> tag. Use alt="" for decorative images.',
				);
				$has_issue = true;
			} elseif ( preg_match( '/\balt\s*=\s*["\'][\s]*["\']/i', $img_tag ) ) {
				// Empty alt is okay for decorative images, but flag as warning if it has no role="presentation".
				if ( ! preg_match( '/role\s*=\s*["\']presentation["\']/i', $img_tag ) ) {
					// Empty alt without role=presentation — just note it, not a violation.
				}
			}
		}

		if ( ! $has_issue && count( $matches[0] ) > 0 ) {
			$passes++;
		}
	}

	/**
	 * Check for empty links or links without accessible text (WCAG 2.4.4).
	 *
	 * @param string $html       The HTML content.
	 * @param array  $violations Violations array (passed by reference).
	 * @param int    $passes     Passes count (passed by reference).
	 */
	private static function check_empty_links( string $html, array &$violations, int &$passes ): void {
		if ( ! preg_match_all( '/<a\s[^>]*>(.*?)<\/a>/is', $html, $matches, PREG_SET_ORDER ) ) {
			return;
		}

		$has_issue = false;

		foreach ( $matches as $match ) {
			$link_content = trim( wp_strip_all_tags( $match[1] ) );
			$has_aria     = preg_match( '/aria-label\s*=\s*["\'][^"\']+["\']/i', $match[0] );
			$has_title    = preg_match( '/title\s*=\s*["\'][^"\']+["\']/i', $match[0] );
			$has_img_alt  = preg_match( '/<img[^>]+alt=["\'][^"\']+["\']/i', $match[1] );

			if ( empty( $link_content ) && ! $has_aria && ! $has_title && ! $has_img_alt ) {
				$violations[] = array(
					'rule'           => 'WCAG 2.4.4',
					'severity'       => 'error',
					'element'        => self::truncate_element( $match[0] ),
					'message'        => 'Link has no accessible text. Screen readers cannot describe its purpose.',
					'fix_suggestion' => 'Add visible text, aria-label, or title attribute to the link.',
				);
				$has_issue = true;
			}
		}

		if ( ! $has_issue && count( $matches ) > 0 ) {
			$passes++;
		}
	}

	/**
	 * Check for form inputs without associated labels (WCAG 1.3.1).
	 *
	 * @param string $html       The HTML content.
	 * @param array  $violations Violations array (passed by reference).
	 * @param int    $passes     Passes count (passed by reference).
	 */
	private static function check_form_labels( string $html, array &$violations, int &$passes ): void {
		// Find form inputs (excluding hidden and submit).
		if ( ! preg_match_all( '/<input\s[^>]*>/is', $html, $matches ) ) {
			return;
		}

		$has_issue  = false;
		$check_done = false;

		foreach ( $matches[0] as $input_tag ) {
			// Skip hidden, submit, button, image types.
			if ( preg_match( '/type\s*=\s*["\'](?:hidden|submit|button|image|reset)["\']/i', $input_tag ) ) {
				continue;
			}

			$check_done = true;

			// Check for associated label via id, aria-label, or aria-labelledby.
			$has_id            = preg_match( '/\bid\s*=\s*["\']([^"\']+)["\']/i', $input_tag, $id_match );
			$has_aria_label    = preg_match( '/aria-label\s*=\s*["\'][^"\']+["\']/i', $input_tag );
			$has_aria_labelled = preg_match( '/aria-labelledby\s*=\s*["\'][^"\']+["\']/i', $input_tag );
			$has_placeholder   = preg_match( '/placeholder\s*=\s*["\'][^"\']+["\']/i', $input_tag );

			if ( ! $has_aria_label && ! $has_aria_labelled ) {
				if ( $has_id ) {
					// Check if a <label for="..."> exists in the content.
					$label_for = preg_quote( $id_match[1], '/' );
					if ( ! preg_match( '/<label[^>]+for\s*=\s*["\']' . $label_for . '["\']/i', $html ) ) {
						$violations[] = array(
							'rule'           => 'WCAG 1.3.1',
							'severity'       => 'error',
							'element'        => self::truncate_element( $input_tag ),
							'message'        => 'Form input has no associated <label> element.',
							'fix_suggestion' => sprintf( 'Add <label for="%s">Label text</label> before the input.', esc_attr( $id_match[1] ) ),
						);
						$has_issue = true;
					}
				} else {
					$violations[] = array(
						'rule'           => 'WCAG 1.3.1',
						'severity'       => 'error',
						'element'        => self::truncate_element( $input_tag ),
						'message'        => 'Form input has no id, aria-label, or aria-labelledby attribute.',
						'fix_suggestion' => 'Add an id attribute and a matching <label for="..."> element, or use aria-label.',
					);
					$has_issue = true;
				}
			}
		}

		if ( $check_done && ! $has_issue ) {
			$passes++;
		}
	}

	/**
	 * Basic color contrast check using inline styles (WCAG 1.4.3).
	 *
	 * This is a heuristic check — not a full contrast ratio calculation.
	 * Flags potentially problematic inline color declarations.
	 *
	 * @param string $html       The HTML content.
	 * @param array  $violations Violations array (passed by reference).
	 * @param int    $warnings   Warnings count (passed by reference).
	 */
	private static function check_color_contrast( string $html, array &$violations, int &$warnings ): void {
		// Look for inline color styles.
		if ( ! preg_match_all( '/style\s*=\s*["\']([^"\']*color\s*:[^"\']+)["\']/i', $html, $matches, PREG_SET_ORDER ) ) {
			return;
		}

		// Light colors that may cause contrast issues on white backgrounds.
		$light_colors = array(
			'#fff',
			'#ffffff',
			'#fafafa',
			'#f5f5f5',
			'#eee',
			'#eeeeee',
			'#ddd',
			'#dddddd',
			'#ccc',
			'#cccccc',
			'#bbb',
			'#bbbbbb',
			'yellow',
			'lightyellow',
			'lightgray',
			'lightgrey',
			'white',
			'snow',
			'ivory',
			'beige',
			'linen',
		);

		foreach ( $matches as $match ) {
			$style_value = strtolower( $match[1] );

			// Check for very light text color.
			if ( preg_match( '/(?:^|[;\s])color\s*:\s*([^;]+)/i', $style_value, $color_match ) ) {
				$color = trim( $color_match[1] );

				foreach ( $light_colors as $light ) {
					if ( $color === $light ) {
						$violations[] = array(
							'rule'           => 'WCAG 1.4.3',
							'severity'       => 'warning',
							'element'        => 'Inline style with color: ' . $color,
							'message'        => 'Potentially low contrast text color detected. Verify contrast ratio meets 4.5:1.',
							'fix_suggestion' => 'Use a color contrast checker to ensure text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text).',
						);
						$warnings++;
						break;
					}
				}
			}
		}
	}

	/**
	 * Check heading hierarchy for skipped levels (WCAG 1.3.1).
	 *
	 * @param string $html       The HTML content.
	 * @param array  $violations Violations array (passed by reference).
	 * @param int    $passes     Passes count (passed by reference).
	 */
	private static function check_heading_hierarchy( string $html, array &$violations, int &$passes ): void {
		if ( ! preg_match_all( '/<(h[1-6])[^>]*>/i', $html, $matches ) ) {
			return;
		}

		$levels = array_map( function ( $tag ) {
			return (int) substr( $tag, 1 );
		}, $matches[1] );

		$skipped = false;

		for ( $i = 1; $i < count( $levels ); $i++ ) {
			if ( $levels[ $i ] > $levels[ $i - 1 ] + 1 ) {
				$violations[] = array(
					'rule'           => 'WCAG 1.3.1',
					'severity'       => 'warning',
					'element'        => sprintf( '<h%d> after <h%d>', $levels[ $i ], $levels[ $i - 1 ] ),
					'message'        => sprintf(
						'Heading level skipped: H%d follows H%d. Do not skip heading levels.',
						$levels[ $i ],
						$levels[ $i - 1 ]
					),
					'fix_suggestion' => 'Use sequential heading levels (H1 > H2 > H3, etc.).',
				);
				$skipped = true;
				break;
			}
		}

		if ( ! $skipped ) {
			$passes++;
		}
	}

	/**
	 * Check that the site has a language attribute set.
	 *
	 * @param array $violations Violations array (passed by reference).
	 * @param int   $passes     Passes count (passed by reference).
	 */
	private static function check_language_attribute( array &$violations, int &$passes ): void {
		$locale = get_bloginfo( 'language' );

		if ( ! empty( $locale ) ) {
			$passes++;
		} else {
			$violations[] = array(
				'rule'           => 'WCAG 3.1.1',
				'severity'       => 'error',
				'element'        => '<html>',
				'message'        => 'No language attribute found on the HTML element.',
				'fix_suggestion' => 'Set the site language in WordPress Settings > General.',
			);
		}
	}

	/**
	 * Check for empty table headers (WCAG 1.3.1).
	 *
	 * @param string $html       The HTML content.
	 * @param array  $violations Violations array (passed by reference).
	 * @param int    $passes     Passes count (passed by reference).
	 */
	private static function check_table_headers( string $html, array &$violations, int &$passes ): void {
		if ( ! preg_match_all( '/<th[^>]*>(.*?)<\/th>/is', $html, $matches, PREG_SET_ORDER ) ) {
			return;
		}

		$has_issue = false;

		foreach ( $matches as $match ) {
			$header_text = trim( wp_strip_all_tags( $match[1] ) );

			if ( empty( $header_text ) ) {
				$violations[] = array(
					'rule'           => 'WCAG 1.3.1',
					'severity'       => 'warning',
					'element'        => self::truncate_element( $match[0] ),
					'message'        => 'Empty table header found. Table headers should describe column/row content.',
					'fix_suggestion' => 'Add descriptive text to <th> elements.',
				);
				$has_issue = true;
			}
		}

		if ( ! $has_issue && count( $matches ) > 0 ) {
			$passes++;
		}
	}

	/**
	 * Check for deprecated HTML elements.
	 *
	 * @param string $html       The HTML content.
	 * @param array  $violations Violations array (passed by reference).
	 * @param int    $passes     Passes count (passed by reference).
	 */
	private static function check_deprecated_elements( string $html, array &$violations, int &$passes ): void {
		$found = false;

		foreach ( self::DEPRECATED_ELEMENTS as $element ) {
			if ( preg_match( '/<' . $element . '[\s>]/i', $html ) ) {
				$violations[] = array(
					'rule'           => 'Best Practice',
					'severity'       => 'warning',
					'element'        => '<' . $element . '>',
					'message'        => sprintf( 'Deprecated HTML element <%s> found. Use CSS instead.', $element ),
					'fix_suggestion' => sprintf( 'Replace <%s> with appropriate CSS styling and semantic HTML.', $element ),
				);
				$found = true;
			}
		}

		if ( ! $found ) {
			$passes++;
		}
	}

	/**
	 * Check that links are visually distinguishable (WCAG 1.4.1).
	 *
	 * @param string $html       The HTML content.
	 * @param array  $violations Violations array (passed by reference).
	 * @param int    $warnings   Warnings count (passed by reference).
	 */
	private static function check_link_distinguishability( string $html, array &$violations, int &$warnings ): void {
		// Check for links with text-decoration:none and no other visual indicator.
		if ( preg_match_all( '/<a\s[^>]*style\s*=\s*["\']([^"\']*text-decoration\s*:\s*none[^"\']*)["\'][^>]*>/i', $html, $matches, PREG_SET_ORDER ) ) {
			foreach ( $matches as $match ) {
				$style = strtolower( $match[1] );

				// If removing underline, check for other visual indicators.
				$has_border  = false !== strpos( $style, 'border' );
				$has_bg      = false !== strpos( $style, 'background' );

				if ( ! $has_border && ! $has_bg ) {
					$violations[] = array(
						'rule'           => 'WCAG 1.4.1',
						'severity'       => 'warning',
						'element'        => self::truncate_element( $match[0] ),
						'message'        => 'Link with text-decoration:none may not be visually distinguishable from surrounding text.',
						'fix_suggestion' => 'Ensure links are distinguishable through color AND at least one other visual cue (underline, border, background).',
					);
					$warnings++;
				}
			}
		}
	}

	/**
	 * Check list structure for proper nesting (WCAG 1.3.1).
	 *
	 * @param string $html       The HTML content.
	 * @param array  $violations Violations array (passed by reference).
	 * @param int    $passes     Passes count (passed by reference).
	 */
	private static function check_list_structure( string $html, array &$violations, int &$passes ): void {
		// Check for <li> outside of <ul> or <ol>.
		$stripped = preg_replace( '/<(ul|ol)[^>]*>.*?<\/\1>/is', '', $html );

		if ( preg_match( '/<li[\s>]/i', $stripped ) ) {
			$violations[] = array(
				'rule'           => 'WCAG 1.3.1',
				'severity'       => 'error',
				'element'        => '<li>',
				'message'        => 'List item <li> found outside of a <ul> or <ol> container.',
				'fix_suggestion' => 'Wrap <li> elements in a <ul> or <ol> parent element.',
			);
		} else {
			if ( preg_match( '/<(ul|ol)[\s>]/i', $html ) ) {
				$passes++;
			}
		}
	}

	/**
	 * Truncate an HTML element string for display in reports.
	 *
	 * @param string $element The element string.
	 * @param int    $max_len Maximum length.
	 * @return string Truncated element.
	 */
	private static function truncate_element( string $element, int $max_len = 120 ): string {
		if ( mb_strlen( $element ) <= $max_len ) {
			return $element;
		}

		return mb_substr( $element, 0, $max_len ) . '...';
	}

	/**
	 * Calculate an accessibility score.
	 *
	 * @param int $errors   Number of error-level violations.
	 * @param int $warnings Number of warning-level violations.
	 * @param int $passes   Number of checks that passed.
	 * @return int Score from 0 to 100.
	 */
	private static function calculate_score( int $errors, int $warnings, int $passes ): int {
		$deductions = ( $errors * 15 ) + ( $warnings * 5 );
		$score      = max( 0, 100 - $deductions );

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
