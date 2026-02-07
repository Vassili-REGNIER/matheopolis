<?php

declare(strict_types=1);

use Core\Container;
use Core\Database\PDOAdapter;
use Core\Database\Queryable;
use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\ConfigInterface;
use Core\Interfaces\CookieInterface;
use Core\Interfaces\CryptoInterface;
use Core\Interfaces\HttpInterface;
use Core\Interfaces\LoggerInterface;
use Core\Interfaces\SecurityInterface;
use Core\Interfaces\SessionInterface;
use Core\Interfaces\ValidatorInterface;
use Core\Services\AuthSessionService;
use Core\Services\CookieService;
use Core\Services\CryptoService;
use Core\Services\HttpService;
use Core\Services\LoggerService;
use Core\Services\SecurityService;
use Core\Services\SessionService;
use Core\Services\ValidatorService;

/*
 * Ce fichier retourne une fonction qui configure le Container.
 * C'est ici qu'on lie les Interfaces aux Implémentations.
 */
return function (Container $container) {

    // Utility services
    $container->bind(HttpInterface::class, HttpService::class);
    $container->bind(CookieInterface::class, CookieService::class);
    $container->bind(SecurityInterface::class, SecurityService::class);
    $container->bind(CryptoInterface::class, CryptoService::class);
    $container->bind(LoggerInterface::class, LoggerService::class);
    $container->bind(ValidatorInterface::class, ValidatorService::class);
    $container->bind(SessionInterface::class, SessionService::class);
    $container->bind(AuthSessionInterface::class, AuthSessionService::class);

    // Database
    $container->bind(Queryable::class, PDOAdapter::class);
    $container->bind(PDOAdapter::class, function (Container $c) {
        // Retrieve config already loaded
        $config = $c->get(ConfigInterface::class);

        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8',
            $config->getString('DB_HOST'),
            $config->getString('DB_NAME')
        );

        return new PDOAdapter(
            $dsn,
            $config->getString('DB_USER'),
            $config->getString('DB_PASS'),
        );
    });
};