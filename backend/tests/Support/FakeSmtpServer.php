<?php

declare(strict_types=1);

/**
 * Provides a one-shot SMTP test server used by mailer integration tests.
 */

if ($argc < 2) {
    fwrite(STDERR, "Usage: php FakeSmtpServer.php <port>\n");

    exit(1);
}

$port = (int) $argv[1];
$server = stream_socket_server('tcp://127.0.0.1:'.$port, $errno, $errstr);
if (false === $server) {
    fwrite(STDERR, "Unable to start fake SMTP server: {$errstr}\n");

    exit(1);
}

$readyPath = sys_get_temp_dir().'/matheopolis-fake-smtp-'.$port.'.ready';
file_put_contents($readyPath, 'ready');

$connection = stream_socket_accept($server, 10);
if (false === $connection) {
    fclose($server);
    unlink($readyPath);

    exit(1);
}

$transcript = '';
$write = static function ($socket, string $line) use (&$transcript): void {
    $transcript .= 'S: '.$line;
    fwrite($socket, $line);
};

$authStep = 0;
$write($connection, "220 fake.local ESMTP\r\n");

while (($line = fgets($connection)) !== false) {
    $transcript .= 'C: '.$line;
    $command = strtoupper(trim($line));

    if (str_starts_with($command, 'EHLO') || str_starts_with($command, 'HELO')) {
        $write($connection, "250-fake.local\r\n250 AUTH LOGIN\r\n");

        continue;
    }

    if (str_starts_with($command, 'AUTH LOGIN')) {
        $authStep = 1;
        $write($connection, "334 VXNlcm5hbWU6\r\n");

        continue;
    }

    if (1 === $authStep) {
        $authStep = 2;
        $write($connection, "334 UGFzc3dvcmQ6\r\n");

        continue;
    }

    if (2 === $authStep) {
        $authStep = 0;
        $write($connection, "235 Authentication successful\r\n");

        continue;
    }

    if (str_starts_with($command, 'MAIL FROM')) {
        $write($connection, "250 OK\r\n");

        continue;
    }

    if (str_starts_with($command, 'RCPT TO')) {
        $write($connection, "250 OK\r\n");

        continue;
    }

    if ('DATA' === $command) {
        $write($connection, "354 End data with <CR><LF>.<CR><LF>\r\n");
        while (($dataLine = fgets($connection)) !== false) {
            $transcript .= 'C: '.$dataLine;
            if ('.' === trim($dataLine)) {
                break;
            }
        }
        $write($connection, "250 OK\r\n");

        continue;
    }

    if (str_starts_with($command, 'QUIT')) {
        $write($connection, "221 Bye\r\n");

        break;
    }

    $write($connection, "250 OK\r\n");
}

fclose($connection);
fclose($server);
unlink($readyPath);

$logPath = sys_get_temp_dir().'/matheopolis-fake-smtp-'.$port.'.log';
file_put_contents($logPath, $transcript);
