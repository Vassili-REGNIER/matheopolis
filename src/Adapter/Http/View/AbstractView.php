<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\View;

use Matheopolis\Adapter\Http\Contract\HttpInterface;
use Matheopolis\Adapter\Http\Contract\SecurityInterface;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\SessionInterface;

/**
 * Base view: templates under Infrastructure/Resources/templates.
 */
abstract class AbstractView
{
    /** @var array<string, mixed> */
    protected array $data = [];

    /** @var array<int, string> */
    protected array $rawKeys = [];

    protected string $title = 'Matheopolis';

    protected string $template = '';

    protected string $layout = 'base';

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(
        array $data,
        private readonly SecurityInterface $security,
        private readonly HttpInterface $http,
        private readonly SessionInterface $session,
        private readonly AuthSessionInterface $auth,
    ) {
        $this->data = $data;
        $this->setRaw('csrfField', $this->security->csrfField());
        $this->set('isUserAuth', $this->auth->check());
        $this->set('homeLink', $this->http->generateLink(''));
        $this->set('loginLink', $this->http->generateLink('auth/login'));
        $this->set('tasksLink', $this->http->generateLink('tasks'));
        $this->set('logoutLink', $this->http->generateLink('action/logout'));
        $this->set('mainCss', $this->http->generateLink('assets/css/main.css'));
        $this->set('favicon', $this->http->generateLink('assets/favicon.png'));
        $this->set('mainJs', $this->http->generateLink('assets/js/main.js'));
        $this->set('currentYear', date('Y'));
    }

    public function set(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
    }

    public function setRaw(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
        $this->rawKeys[] = $key;
    }

    public function render(): void
    {
        $this->data['flash_errors'] = $this->autoEscape($this->session->getFlash(SessionInterface::FLASH_ERROR));
        $this->data['flash_success'] = $this->autoEscape($this->session->getFlash(SessionInterface::FLASH_SUCCESS));
        $this->data['flash_messages'] = $this->autoEscape($this->session->getFlash(SessionInterface::FLASH_INFO));

        $safeData = [];
        foreach ($this->data as $key => $value) {
            if (\in_array($key, $this->rawKeys, true)) {
                $safeData[$key] = $value;
            } else {
                $safeData[$key] = $this->autoEscape($value);
            }
        }

        $pageTitle = $this->security->escape($this->title);

        ob_start();

        require_once $this->getTemplatePath();
        $content = ob_get_clean();

        extract($safeData, EXTR_SKIP);

        require_once $this->getLayoutPath();
    }

    public function setTemplate(string $path): void
    {
        $this->template = $path;
    }

    protected function getTemplatePath(): string
    {
        return $this->templatesRoot().'/'.$this->template.'.php';
    }

    protected function getLayoutPath(): string
    {
        return $this->templatesRoot().'/layouts/'.$this->layout.'.php';
    }

    private function autoEscape(mixed $data): mixed
    {
        if (\is_string($data)) {
            return $this->security->escape($data);
        }

        if (\is_array($data)) {
            return array_map(fn (mixed $item): mixed => $this->autoEscape($item), $data);
        }

        return $data;
    }

    private function templatesRoot(): string
    {
        return \dirname(__DIR__, 3).'/Infrastructure/Resources/templates';
    }
}
