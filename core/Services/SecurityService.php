<?php
declare(strict_types=1);

namespace Core\Services;

use Core\Interfaces\SecurityInterface;
use Core\Interfaces\SessionInterface;

/**
 * Security helper class.
 * Handles XSS protection, CSRF token generation, and other security-related tasks.
 */
final class SecurityService implements SecurityInterface
{
    private SessionInterface $session;

    public function __construct(SessionInterface $session) {
        $this->session = $session;
    }

    /**
     * Protects against XSS (Cross-Site Scripting) by converting special characters to HTML entities.
     *
     * @param string $string The input string to escape.
     * @return string The escaped string safe for HTML output.
     */
    public function escape(string $string): string
    {
        return htmlentities($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Generates a hidden HTML input field containing the CSRF token.
     * This should be included in every POST form.
     *
     * @return string The HTML input element.
     */
    public function csrfField(): string
    {
        $token = $this->session->getCsrfToken();
        return '<input type="hidden" name="csrf_token" value="' . $this->escape($token) . '">';
    }
}