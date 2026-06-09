<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Mail;

use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Port\MailerInterface;

final class SmtpMailer implements MailerInterface
{
    public function __construct(
        private readonly ConfigInterface $config,
        private readonly LoggerInterface $logger,
    ) {}

    public function send(string $to, string $subject, string $body): void
    {
        $host = $this->config->getString('MAIL_SMTP_HOST');
        if ('' === $host) {
            throw new \RuntimeException('MAIL_SMTP_HOST is not configured.');
        }

        $port = $this->config->getInt('MAIL_SMTP_PORT', 587);
        $encryption = strtolower($this->config->getString('MAIL_SMTP_ENCRYPTION', 'tls'));
        $username = $this->config->getString('MAIL_SMTP_USER');
        $password = $this->config->getString('MAIL_SMTP_PASS');
        $fromAddress = $this->config->getString('MAIL_FROM_ADDRESS', 'noreply@matheopolis.local');
        $fromName = $this->config->getString('MAIL_FROM_NAME', 'Matheopolis');

        $transport = $this->openTransport($host, $port, $encryption);

        try {
            $this->expectCode($transport, [220]);
            $this->command($transport, 'EHLO matheopolis.local', [250]);

            if ('tls' === $encryption) {
                $this->command($transport, 'STARTTLS', [220]);
                $tlsEnabled = stream_socket_enable_crypto($transport, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                if (true !== $tlsEnabled) {
                    throw new \RuntimeException('Unable to enable TLS for the SMTP connection.');
                }
                $this->command($transport, 'EHLO matheopolis.local', [250]);
            }

            if ('' !== $username) {
                $this->command($transport, 'AUTH LOGIN', [334]);
                $this->command($transport, base64_encode($username), [334]);
                $this->command($transport, base64_encode($password), [235]);
            }

            $this->command($transport, 'MAIL FROM:<'.$fromAddress.'>', [250]);
            $this->command($transport, 'RCPT TO:<'.$to.'>', [250, 251]);
            $this->command($transport, 'DATA', [354]);

            $message = $this->buildMessage($fromAddress, $fromName, $to, $subject, $body);
            $this->write($transport, $message."\r\n.\r\n");
            $this->expectCode($transport, [250]);

            $this->command($transport, 'QUIT', [221]);
        } catch (\Throwable $exception) {
            $this->logger->error('SMTP mail delivery failed', [
                'to' => $to,
                'subject' => $subject,
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        } finally {
            fclose($transport);
        }

        $this->logger->info('Mail sent', [
            'to' => $to,
            'subject' => $subject,
        ]);
    }

    /**
     * @return resource
     */
    private function openTransport(string $host, int $port, string $encryption)
    {
        $scheme = 'ssl' === $encryption ? 'ssl' : 'tcp';
        $transport = @stream_socket_client(
            \sprintf('%s://%s:%d', $scheme, $host, $port),
            $errno,
            $errstr,
            15,
            STREAM_CLIENT_CONNECT,
        );

        if (!\is_resource($transport)) {
            throw new \RuntimeException(\sprintf('Unable to connect to SMTP server (%s): %s', (string) $errno, $errstr));
        }

        stream_set_timeout($transport, 15);

        return $transport;
    }

    private function buildMessage(
        string $fromAddress,
        string $fromName,
        string $to,
        string $subject,
        string $body,
    ): string {
        $encodedSubject = $this->encodeHeader($subject);
        $fromHeader = $this->formatAddress($fromAddress, $fromName);
        $date = gmdate('D, d M Y H:i:s').' +0000';

        return implode("\r\n", [
            'Date: '.$date,
            'From: '.$fromHeader,
            'To: '.$to,
            'Subject: '.$encodedSubject,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            '',
            $this->normalizeBody($body),
        ]);
    }

    private function formatAddress(string $address, string $name): string
    {
        if ('' === trim($name)) {
            return $address;
        }

        return \sprintf('%s <%s>', $this->encodeHeader($name), $address);
    }

    private function encodeHeader(string $value): string
    {
        if (1 === preg_match('/[^\x20-\x7E]/', $value)) {
            return '=?UTF-8?B?'.base64_encode($value).'?=';
        }

        return $value;
    }

    private function normalizeBody(string $body): string
    {
        $normalized = str_replace(["\r\n", "\r"], "\n", $body);
        $lines = explode("\n", $normalized);
        $safeLines = [];

        foreach ($lines as $line) {
            while (str_starts_with($line, '.')) {
                $line = '.'.$line;
            }
            $safeLines[] = $line;
        }

        return implode("\r\n", $safeLines);
    }

    /**
     * @param resource  $transport
     * @param list<int> $expectedCodes
     */
    private function command($transport, string $command, array $expectedCodes): void
    {
        $this->write($transport, $command."\r\n");
        $this->expectCode($transport, $expectedCodes);
    }

    /**
     * @param resource $transport
     */
    private function write($transport, string $payload): void
    {
        $written = fwrite($transport, $payload);
        if (false === $written || $written !== \strlen($payload)) {
            throw new \RuntimeException('Unable to write to the SMTP server.');
        }
    }

    /**
     * @param resource  $transport
     * @param list<int> $expectedCodes
     */
    private function expectCode($transport, array $expectedCodes): void
    {
        $response = $this->readResponse($transport);
        $code = (int) substr($response, 0, 3);

        if (!\in_array($code, $expectedCodes, true)) {
            throw new \RuntimeException(\sprintf('Unexpected SMTP response (%d): %s', $code, trim($response)));
        }
    }

    /**
     * @param resource $transport
     */
    private function readResponse($transport): string
    {
        $response = '';

        while (($line = fgets($transport)) !== false) {
            $response .= $line;
            if (isset($line[3]) && ' ' === $line[3]) {
                break;
            }
        }

        if ('' === $response) {
            throw new \RuntimeException('SMTP server closed the connection unexpectedly.');
        }

        return $response;
    }
}
