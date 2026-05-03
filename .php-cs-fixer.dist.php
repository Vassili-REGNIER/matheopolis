<?php

declare(strict_types=1);

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

$finder = Finder::create()
    ->in([
        __DIR__.'/bootstrap',
        __DIR__.'/config',
        __DIR__.'/public',
        __DIR__.'/src',
        __DIR__.'/tests',
    ])
    ->exclude('vendor')
    ->name('*.php')
    // PHPDoc must use FQCN for PHPStan; PHP-CS-Fixer rewrites this file and breaks analysis
    ->filter(static function (\SplFileInfo $file): bool {
        $p = str_replace('\\', '/', $file->getPathname());

        return !str_ends_with($p, '/public/index.php')
            && !str_ends_with($p, '/PDOStatementAdapter.php');
    });

return (new Config())
    ->setRiskyAllowed(true)
    ->setRules([
        '@PhpCsFixer' => true,
        '@PhpCsFixer:risky' => true,
        // Keep block PHPDoc so PHPStan inline @var remains valid (e.g. PDOStatementAdapter)
        'phpdoc_to_comment' => false,
    ])
    ->setFinder($finder);
