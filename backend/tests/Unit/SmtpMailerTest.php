<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Infrastructure\Mail\SmtpMailer;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Mail\SmtpMailer
 */
final class SmtpMailerTest extends TestCase
{
    /**
     * Verifies the expected behavior.
     */
    public function testSendDeliversPlainTextMessage(): void
    {
        $probe = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
        self::assertNotFalse($probe);

        $address = stream_socket_get_name($probe, false);
        self::assertIsString($address);
        [, $port] = explode(':', $address);
        fclose($probe);

        $readyPath = sys_get_temp_dir().'/matheopolis-fake-smtp-'.$port.'.ready';
        $logPath = sys_get_temp_dir().'/matheopolis-fake-smtp-'.$port.'.log';
        @unlink($readyPath);
        @unlink($logPath);

        $process = proc_open(
            ['php', __DIR__.'/../Support/FakeSmtpServer.php', (string) $port],
            [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
        );
        self::assertIsResource($process);

        $deadline = microtime(true) + 2.0;
        while (!is_file($readyPath) && microtime(true) < $deadline) {
            usleep(10_000);
        }
        self::assertFileExists($readyPath);

        $config = $this->createMock(ConfigInterface::class);
        $config->method('getString')->willReturnMap([
            ['MAIL_SMTP_HOST', '', '127.0.0.1'],
            ['MAIL_SMTP_ENCRYPTION', 'tls', 'none'],
            ['MAIL_SMTP_USER', '', 'user@example.com'],
            ['MAIL_SMTP_PASS', '', 'secret'],
            ['MAIL_FROM_ADDRESS', 'noreply@matheopolis.local', 'noreply@matheopolis.local'],
            ['MAIL_FROM_NAME', 'Matheopolis', 'Matheopolis'],
        ]);
        $config->method('getInt')->willReturnMap([
            ['MAIL_SMTP_PORT', 587, (int) $port],
        ]);

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects(self::once())->method('info')->with('Mail sent', self::anything());

        $mailer = new SmtpMailer($config, $logger);
        $mailer->send('student@example.com', 'Confirm your account', "Hello Ada,\n\nPlease verify.");

        proc_close($process);

        self::assertFileExists($logPath);
        $transcript = file_get_contents($logPath);
        self::assertIsString($transcript);
        self::assertStringContainsString('MAIL FROM:<noreply@matheopolis.local>', $transcript);
        self::assertStringContainsString('RCPT TO:<student@example.com>', $transcript);
        self::assertStringContainsString('Subject: Confirm your account', $transcript);
        self::assertStringContainsString('Hello Ada,', $transcript);

        unlink($logPath);
    }
}
