<?php

declare(strict_types=1);

/**
 * Repository root .env (AlwaysData, local dev) or legacy backend/.env.
 */
function matheopolis_resolve_env_path(): string
{
    $candidates = [
        dirname(PROJECT_ROOT).DIRECTORY_SEPARATOR.'.env',
        PROJECT_ROOT.DIRECTORY_SEPARATOR.'.env',
    ];

    foreach ($candidates as $path) {
        if (is_readable($path)) {
            return $path;
        }
    }

    return $candidates[0];
}

/**
 * Docker Compose and CI inject flat APP_* / DB_* variables without mounting .env.
 */
function matheopolis_has_injected_config(): bool
{
    foreach (['APP_ENV', 'DB_HOST', 'DB_NAME'] as $key) {
        if (false !== getenv($key)) {
            return true;
        }

        if (array_key_exists($key, $_SERVER)) {
            $value = $_SERVER[$key];
            if (is_string($value) && '' !== $value) {
                return true;
            }
        }
    }

    return false;
}
