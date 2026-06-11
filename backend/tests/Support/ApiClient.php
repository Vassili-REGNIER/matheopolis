<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Support;

/**
 * Minimal HTTP client for API tests (real HTTP, cookie jar, CSRF header).
 */
final class ApiClient
{
    private string $cookieJarPath;

    private ?string $csrfToken = null;

    /**
     * Creates a new ApiClient instance.
     */
    public function __construct(
        private readonly string $baseUrl,
    ) {
        $this->cookieJarPath = tempnam(sys_get_temp_dir(), 'matheopolis_cookies_') ?: throw new \RuntimeException('tempnam failed');
    }

    /**
     * __destruct.
     */
    public function __destruct()
    {
        if (is_file($this->cookieJarPath)) {
            unlink($this->cookieJarPath);
        }
    }

    /**
     * @param null|array<string, mixed> $json
     *
     * @return array{status: int, body: string, json: null|array<string, mixed>}
     */
    public function request(string $method, string $path, ?array $json = null, bool $withCsrf = false): array
    {
        $url = rtrim($this->baseUrl, '/').$path;
        $headers = ['Accept: application/json'];
        if (null !== $json) {
            $headers[] = 'Content-Type: application/json';
        }
        if ($withCsrf && null !== $this->csrfToken) {
            $headers[] = 'X-CSRF-Token: '.$this->csrfToken;
        }

        $ch = curl_init($url);
        if (false === $ch) {
            throw new \RuntimeException('curl_init failed');
        }

        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_COOKIEJAR => $this->cookieJarPath,
            CURLOPT_COOKIEFILE => $this->cookieJarPath,
            CURLOPT_HEADER => false,
        ]);

        if (null !== $json) {
            $payload = json_encode($json, JSON_THROW_ON_ERROR);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        }

        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!\is_string($body)) {
            $body = '';
        }

        $decoded = '' !== $body ? json_decode($body, true) : null;

        return [
            'status' => $status,
            'body' => $body,
            'json' => \is_array($decoded) ? $decoded : null,
        ];
    }

    /**
     * Returns the .
     */
    public function get(string $path): array
    {
        return $this->request('GET', $path);
    }

    /**
     * @param array<string, mixed> $json
     */
    public function post(string $path, array $json = [], bool $withCsrf = false): array
    {
        return $this->request('POST', $path, $json, $withCsrf);
    }

    /**
     * @param array<string, mixed> $json
     */
    public function patch(string $path, array $json = [], bool $withCsrf = false): array
    {
        return $this->request('PATCH', $path, $json, $withCsrf);
    }

    /**
     * Deletes the requested resource.
     */
    public function delete(string $path, bool $withCsrf = false): array
    {
        return $this->request('DELETE', $path, null, $withCsrf);
    }

    /**
     * Login.
     */
    public function login(string $username, string $password = 'password'): void
    {
        $response = $this->post('/api/auth/login', [
            'identifier' => $username,
            'password' => $password,
        ]);
        if (200 !== $response['status'] || !\is_array($response['json'])) {
            throw new \RuntimeException('Login failed in API test: '.$response['body']);
        }
        $data = $response['json']['data'] ?? null;
        if (!\is_array($data)) {
            throw new \RuntimeException('Login response missing data.');
        }
        $token = $data['csrfToken'] ?? null;
        if (!\is_string($token) || '' === $token) {
            throw new \RuntimeException('Login response missing csrfToken.');
        }
        $this->csrfToken = $token;
    }
}
