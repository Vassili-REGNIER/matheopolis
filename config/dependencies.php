<?php

declare(strict_types=1);

use Matheopolis\Adapter\Http\Contract\HttpInterface;
use Matheopolis\Adapter\Http\Contract\SecurityInterface;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\CookieInterface;
use Matheopolis\Application\Port\CryptoInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\ValidatorInterface;
use Matheopolis\Domain\Repository\ClassRepositoryInterface;
use Matheopolis\Domain\Repository\TeacherCodeRepositoryInterface;
use Matheopolis\Domain\Repository\UserRepositoryInterface;
use Matheopolis\Infrastructure\Auth\AuthSessionService;
use Matheopolis\Infrastructure\Bootstrap\Container;
use Matheopolis\Infrastructure\Cookie\CookieService;
use Matheopolis\Infrastructure\Crypto\CryptoService;
use Matheopolis\Infrastructure\Http\HttpService;
use Matheopolis\Infrastructure\Logging\LoggerService;
use Matheopolis\Infrastructure\Persistence\Database\PDOAdapter;
use Matheopolis\Infrastructure\Persistence\Database\Queryable;
use Matheopolis\Infrastructure\Persistence\Repository\ClassRepository;
use Matheopolis\Infrastructure\Persistence\Repository\TeacherCodeRepository;
use Matheopolis\Infrastructure\Persistence\Repository\UserRepository;
use Matheopolis\Infrastructure\Security\SecurityService;
use Matheopolis\Infrastructure\Session\SessionService;
use Matheopolis\Infrastructure\Validation\ValidatorService;

// @return callable(Container): void
return static function (Container $container): void {
    $container->bind(HttpInterface::class, HttpService::class);
    $container->bind(CookieInterface::class, CookieService::class);
    $container->bind(SecurityInterface::class, SecurityService::class);
    $container->bind(CryptoInterface::class, CryptoService::class);
    $container->bind(LoggerInterface::class, LoggerService::class);
    $container->bind(ValidatorInterface::class, ValidatorService::class);
    $container->bind(SessionInterface::class, SessionService::class);
    $container->bind(AuthSessionInterface::class, AuthSessionService::class);

    $container->bind(UserRepositoryInterface::class, UserRepository::class);
    $container->bind(ClassRepositoryInterface::class, ClassRepository::class);
    $container->bind(TeacherCodeRepositoryInterface::class, TeacherCodeRepository::class);

    // Do not bind X::class => X::class: the container would call get(X) recursively and exhaust memory.

    $container->bind(Queryable::class, PDOAdapter::class);
    $container->bind(PDOAdapter::class, static function (Container $c): PDOAdapter {
        /** @var ConfigInterface $config */
        $config = $c->get(ConfigInterface::class);
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=utf8',
            $config->getString('DB_HOST'),
            $config->getString('DB_NAME'),
        );

        return new PDOAdapter(
            $dsn,
            $config->getString('DB_USER'),
            $config->getString('DB_PASS'),
        );
    });
};
