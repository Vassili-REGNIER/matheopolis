<?php
declare(strict_types=1);

namespace Core;

use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\HttpInterface;
use Core\Interfaces\SecurityInterface;
use Core\Interfaces\SessionInterface;

/**
 * Abstract view class. Every view should extend this class.
 */
abstract class View
{
    /** 
     * @var array<string, mixed> The data to be passed to the HTML template
     */
    protected array $data = [];

    /**
     * @var array<string> List of $data keys that must not be escaped
     */
    protected array $rawKeys = [];

    /**
     * @var string The page title
     */
    protected string $title = 'Matheopolis';

    /** 
     * @var string The main template
     */
    protected string $template;

    /** 
     * @var string The global layout
     */
    protected string $layout = 'base';

    private SecurityInterface $security;
    private HttpInterface $http;
    private SessionInterface $session;
    private AuthSessionInterface $auth;

    public function __construct(
        array $data,
        SecurityInterface $security,
        HttpInterface $http,
        SessionInterface $session,
        AuthSessionInterface $auth
    )
    {
        $this->security = $security;
        $this->data = $data;
        $this->http = $http;
        $this->session = $session;
        $this->auth = $auth;

        // CSRF Field
        $this->setRaw('csrfField', $this->security->csrfField());

        // User info
        $this->set('isUserAuth', $this->auth->check());

        // Links
        $this->set('homeLink', $this->http->generateLink(''));
        $this->set('loginLink', $this->http->generateLink('auth/login'));
        $this->set('tasksLink', $this->http->generateLink('tasks'));
        $this->set('logoutLink', $this->http->generateLink('action/logout'));

        // CSS, JS & Favicon
        $this->set('mainCss', $this->http->generateLink('assets/css/main.css'));
        $this->set('favicon', $this->http->generateLink('assets/favicon.png'));
        $this->set('mainJs', $this->http->generateLink('assets/js/main.js'));

        // Other info
        $this->set('currentYear', date('Y'));
    }

    /**
     * Defines a piece of data (will be escaped by default when displayed)
     */
    public function set(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
    }

    /**
     * Defines RAW data (HTML allowed, but beware of XSS!)
     */
    public function setRaw(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
        $this->rawKeys[] = $key;
    }

    /**
     * Securely displays the page
     */
    public function render(): void
    {
        $this->data['flash_errors']   = $this->autoEscape($this->session->getFlash($this->session::FLASH_ERROR));
        $this->data['flash_success']  = $this->autoEscape($this->session->getFlash($this->session::FLASH_SUCCESS));
        $this->data['flash_messages'] = $this->autoEscape($this->session->getFlash($this->session::FLASH_INFO));

        // Securely extract page data
        $safeData = [];
        foreach ($this->data as $key => $value) {
            if (in_array($key, $this->rawKeys)) {
                $safeData[$key] = $value;
            } else {
                $safeData[$key] = $this->autoEscape($value);
            }
        }
        extract($safeData);

        // Set the page title
        $pageTitle = $this->security->escape($this->title);

        // Retrieves the main content of the page
        ob_start();
        require_once $this->getTemplatePath();
        $content = ob_get_clean();

        // Inclusion of the global page
        require_once $this->getLayoutPath();
    }

    /**
     * Recursively escapes data (String and Array)
     */
    private function autoEscape(mixed $data): mixed
    {
        if (is_string($data)) {
            return $this->security->escape($data);
        }

        if (is_array($data)) {
            return array_map([$this, 'autoEscape'], $data);
        }

        return $data;
    }

    /**
     * Return the absolute path to the HTML template file
     */
    protected function getTemplatePath(): string {
        return dirname(__DIR__) . '/src/templates/' . $this->template . '.php';
    }

    /**
     * Set the template file
     */
    public function setTemplate(string $path): void {
        $this->template = $path;
    }

    /**
     * Return the absolute path to the HTML global layout file
     */
    protected function getLayoutPath(): string {
        return dirname(__DIR__) . '/src/templates/layouts/' . $this->layout . '.php';
    }
}