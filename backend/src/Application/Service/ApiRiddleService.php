<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\ProgressRepositoryInterface;
use Matheopolis\Application\Port\PuzzleRepositoryInterface;
use Matheopolis\Domain\PuzzleProgress;

final class ApiRiddleService
{
    private const TOKEN_TTL_SECONDS = 900;

    public function __construct(
        private readonly ProgressRepositoryInterface $progress,
        private readonly PuzzleRepositoryInterface $riddles,
        private readonly ConfigInterface $config,
    ) {}

    /**
     * @return array{progress: PuzzleProgress, playToken: string}
     */
    public function start(int $studentId, int $riddleId): array
    {
        $riddle = $this->riddles->find($riddleId);
        if (null === $riddle || !$riddle->isActive()) {
            throw new ApiException(404, 'NOT_FOUND', 'Riddle not found.');
        }

        $existing = $this->progress->findByStudentAndPuzzle($studentId, $riddleId);
        if (null !== $existing && 'completed' === $existing->getStatus()) {
            throw new ApiException(409, 'RIDDLE_ALREADY_COMPLETED', 'Riddle already completed.');
        }

        [$token, $tokenHash, $tokenNonce, $tokenExpiresAt] = $this->newToken($studentId, $riddleId);

        $progress = null === $existing
            ? $this->progress->start($studentId, $riddleId, $tokenHash, $tokenNonce, $tokenExpiresAt)
            : $this->progress->refreshToken($studentId, $riddleId, $tokenHash, $tokenNonce, $tokenExpiresAt);

        return ['progress' => $progress, 'playToken' => $token];
    }

    /**
     * @return array{progress: PuzzleProgress, playToken: string, isCorrect: bool}
     */
    public function attempt(int $studentId, int $riddleId, string $answer, string $playToken): array
    {
        $progress = $this->progress->findByStudentAndPuzzle($studentId, $riddleId);
        if (null === $progress) {
            throw new ApiException(409, 'RIDDLE_NOT_IN_PROGRESS', 'Riddle not in progress.');
        }
        if ('completed' === $progress->getStatus()) {
            throw new ApiException(409, 'RIDDLE_ALREADY_COMPLETED', 'Riddle already completed.');
        }

        $this->assertToken($playToken, $studentId, $riddleId, $progress);
        $isCorrect = $this->checkAnswer($riddleId, $answer);

        [$nextToken, $nextTokenHash, $nextTokenNonce, $nextTokenExpiresAt] = $this->newToken($studentId, $riddleId);
        $updated = $this->progress->addAttempt($studentId, $riddleId, $nextTokenHash, $nextTokenNonce, $nextTokenExpiresAt);

        return [
            'progress' => $updated,
            'playToken' => $nextToken,
            'isCorrect' => $isCorrect,
        ];
    }

    public function complete(int $studentId, int $riddleId, string $playToken): PuzzleProgress
    {
        $progress = $this->progress->findByStudentAndPuzzle($studentId, $riddleId);
        if (null === $progress) {
            throw new ApiException(409, 'RIDDLE_NOT_IN_PROGRESS', 'Riddle not in progress.');
        }
        if ('completed' === $progress->getStatus()) {
            throw new ApiException(409, 'RIDDLE_ALREADY_COMPLETED', 'Riddle already completed.');
        }

        $this->assertToken($playToken, $studentId, $riddleId, $progress);

        return $this->progress->complete($studentId, $riddleId);
    }

    private function checkAnswer(int $riddleId, string $answer): bool
    {
        $normalized = trim(mb_strtolower($answer));

        return match ($riddleId) {
            1 => '16' === $normalized,
            2 => '8' === $normalized,
            3 => '80' === $normalized || '80 degrees' === $normalized,
            default => false,
        };
    }

    /**
     * @return array{0: string, 1: string, 2: string, 3: string}
     */
    private function newToken(int $studentId, int $riddleId): array
    {
        $issuedAt = time();
        $expiresAt = $issuedAt + self::TOKEN_TTL_SECONDS;
        $nonce = bin2hex(random_bytes(12));
        $payload = $studentId.'.'.$riddleId.'.'.$issuedAt.'.'.$expiresAt.'.'.$nonce;
        $signature = hash_hmac('sha256', $payload, $this->tokenSecret());
        $token = base64_encode($payload.'.'.$signature);

        return [$token, hash('sha256', $token), $nonce, gmdate('Y-m-d H:i:s', $expiresAt)];
    }

    private function assertToken(string $playToken, int $studentId, int $riddleId, PuzzleProgress $progress): void
    {
        $payloadRaw = base64_decode($playToken, true);
        if (!\is_string($payloadRaw)) {
            throw new ApiException(409, 'INVALID_PLAY_TOKEN', 'Invalid play token.');
        }

        $parts = explode('.', $payloadRaw);
        if (6 !== \count($parts)) {
            throw new ApiException(409, 'INVALID_PLAY_TOKEN', 'Invalid play token.');
        }

        [$tokenStudentId, $tokenRiddleId, $issuedAt, $expiresAt, $nonce, $signature] = $parts;
        $signedPayload = implode('.', [$tokenStudentId, $tokenRiddleId, $issuedAt, $expiresAt, $nonce]);
        $expectedSignature = hash_hmac('sha256', $signedPayload, $this->tokenSecret());
        if (!hash_equals($expectedSignature, $signature)) {
            throw new ApiException(409, 'INVALID_PLAY_TOKEN', 'Invalid play token signature.');
        }

        if ((int) $tokenStudentId !== $studentId || (int) $tokenRiddleId !== $riddleId) {
            throw new ApiException(409, 'INVALID_PLAY_TOKEN', 'Play token does not match resource.');
        }

        if ((int) $expiresAt < time()) {
            throw new ApiException(409, 'PLAY_TOKEN_EXPIRED', 'Play token expired.');
        }

        if ($progress->getTokenNonce() !== $nonce) {
            throw new ApiException(409, 'INVALID_PLAY_TOKEN', 'Play token replay detected.');
        }

        if ($progress->getTokenHash() !== hash('sha256', $playToken)) {
            throw new ApiException(409, 'INVALID_PLAY_TOKEN', 'Play token hash mismatch.');
        }

        if ($progress->getTokenExpiresAt() !== gmdate('Y-m-d H:i:s', (int) $expiresAt)) {
            throw new ApiException(409, 'INVALID_PLAY_TOKEN', 'Play token mismatch.');
        }
    }

    private function tokenSecret(): string
    {
        $secret = $this->config->getString('PLAY_TOKEN_SECRET');
        if ('' !== $secret) {
            return $secret;
        }

        return 'matheopolis-default-dev-secret';
    }
}
