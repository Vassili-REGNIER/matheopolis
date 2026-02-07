<?php
declare(strict_types=1);

namespace Core\Services;

use Core\Interfaces\ConfigInterface;
use Core\Interfaces\LoggerInterface;

/**
 * Static Logger class with Request ID tracking and execution timing.
 * Writes logs to /logs/app.log
 */
final class LoggerService implements LoggerInterface
{
    // Log Levels
    const DEBUG = 'DEBUG';
    const INFO  = 'INFO';
    const WARN  = 'WARN';
    const ERROR = 'ERROR';

    /** @var string Unique ID for the current request */
    private string $requestId;

    /** @var float Timestamp when the script started */
    private float $startTime;

    /** @var string Path to the log file */
    private string $logFile;

    /**
     * @var ConfigInterface Config object
     */
    private ConfigInterface $config;

    /**
     * Initializes the logger.
     */
    public function __construct(ConfigInterface $config)
    {
        $this->config = $config;

        // Generate a short unique ID for the current request (ex: a1b2c3d4)
        $this->requestId = bin2hex(random_bytes(4));
        $this->startTime = microtime(true);

        // Define log path (logs file must exists)
        // TODO: peut etre créer le dossier s'il n'existe pas
        // TODO: Utiliser la config pour le chemin vers les logs
        $this->logFile = PROJECT_ROOT . '/logs/app.log';

        // Send the Request ID to the browser headers for debugging
        header("X-Request-ID: " . $this->requestId);
    }

    /**
     * Private main log method.
     * Format: [Date] [RequestId] [Level] [Time+ms] Message {Context JSON}
     * * @param string $level
     * @param string $message
     * @param array $context Optional data to log (arrays, objects...)
     */
    private function log(string $level, string $message, array $context = []): void
    {
        // Calculate time elapsed since start of script in ms
        $timeElapsed = number_format((microtime(true) - $this->startTime) * 1000, 2);
        
        // Timestamp
        $date = date('Y-m-d H:i:s');

        // Context formatting (convert array to JSON string if present)
        $contextStr = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';

        // Build the log line
        $logLine = sprintf(
            "[%s] [%s] [%s] [+%sms] %s%s" . PHP_EOL,
            $date,
            $this->requestId,
            $level,
            $timeElapsed,
            $message,
            $contextStr
        );

        // Append to file
        // TODO: Note: In high traffic, file locking (LOCK_EX) is better, but optional for student projects
        file_put_contents($this->logFile, $logLine, FILE_APPEND);
    }

    /**
     * Shortcut for Debug logs
     */
    public function debug($message, $context = []): void
    {
        if ($this->config->getBool('APP_DEBUG')) {
            $this->log(self::DEBUG, $message, $context);
        }
    }

    /**
     * Shortcut for Info logs
     */
    public function info($message, $context = []): void
    {
        $this->log(self::INFO, $message, $context);
    }

    /**
     * Shortcut for Warning logs
     */
    public function warn($message, $context = []): void
    {
        $this->log(self::WARN, $message, $context);
    }

    /**
     * Shortcut for Error logs
     */
    public function error($message, $context = []): void
    {
        $this->log(self::ERROR, $message, $context);
    }
}