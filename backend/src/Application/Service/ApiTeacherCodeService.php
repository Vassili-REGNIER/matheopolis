<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\TeacherCodeRepositoryInterface;
use Matheopolis\Domain\TeacherCode;

final class ApiTeacherCodeService
{
    public function __construct(
        private readonly TeacherCodeRepositoryInterface $codes,
    ) {}

    public function create(?string $code, ?string $expiresAt, int $adminUserId): TeacherCode
    {
        $normalizedCode = null !== $code && '' !== trim($code) ? strtoupper(trim($code)) : $this->generateCode();
        if (null !== $this->codes->findByCode($normalizedCode)) {
            throw new ApiException(409, 'CONFLICT', 'Teacher code already exists.');
        }

        return $this->codes->create($normalizedCode, $expiresAt, $adminUserId);
    }

    private function generateCode(): string
    {
        return 'TCH-'.strtoupper(bin2hex(random_bytes(4)));
    }
}
