<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Logging;

use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\LoggerInterface;

final class LoggerService implements LoggerInterface
{
    private const DEBUG = 'DEBUG';

    private const INFO = 'INFO';

    private const WARN = 'WARN';

    private const ERROR = 'ERROR';

    private string $requestId;

    private float $startTime;

    private string $logFile;
    private bool $canWriteLogs = true;

    public function __construct(
        private readonly ConfigInterface $config,
    ) {
        $this->requestId = bin2hex(random_bytes(4));
        $this->startTime = microtime(true);
        $this->logFile = PROJECT_ROOT.'/logs/app.log';
        $this->canWriteLogs = $this->ensureLogDestinationReady();
        if (!headers_sent()) {
            header('X-Request-ID: '.$this->requestId);
        }
    }

    /**
     * @param array<string, mixed> $context
     */
    public function debug(string $message, array $context = []): void
    {
        if ($this->config->getBool('APP_DEBUG')) {
            $this->log(self::DEBUG, $message, $context);
        }
    }

    /**
     * @param array<string, mixed> $context
     */
    public function info(string $message, array $context = []): void
    {
        $this->log(self::INFO, $message, $context);
    }

    /**
     * @param array<string, mixed> $context
     */
    public function warn(string $message, array $context = []): void
    {
        $this->log(self::WARN, $message, $context);
    }

    /**
     * @param array<string, mixed> $context
     */
    public function error(string $message, array $context = []): void
    {
        $this->log(self::ERROR, $message, $context);
    }

    /**
     * @param array<string, mixed> $context
     */
    private function log(string $level, string $message, array $context = []): void
    {
        if (!$this->canWriteLogs) {
            return;
        }

        $timeElapsed = number_format((microtime(true) - $this->startTime) * 1000, 2);
        $date = date('Y-m-d H:i:s');
        $contextStr = [] !== $context ? ' '.json_encode($context, JSON_UNESCAPED_UNICODE) : '';
        $logLine = \sprintf(
            '[%s] [%s] [%s] [+%sms] %s%s'.PHP_EOL,
            $date,
            $this->requestId,
            $level,
            $timeElapsed,
            $message,
            $contextStr,
        );
        $written = @file_put_contents($this->logFile, $logLine, FILE_APPEND);
        if (false === $written) {
            $this->canWriteLogs = false;
        }
    }

    private function ensureLogDestinationReady(): bool
    {
        $logDir = \dirname($this->logFile);
        if (!is_dir($logDir) && !@mkdir($logDir, 0775, true) && !is_dir($logDir)) {
            return false;
        }

        if (!is_writable($logDir)) {
            return false;
        }

        if (!file_exists($this->logFile)) {
            $created = @file_put_contents($this->logFile, '');
            if (false === $created) {
                return false;
            }
        }

        return is_writable($this->logFile);
    }
}
