<?php

declare(strict_types=1);

/**
 * Exit 0 when line coverage in clover.xml meets the minimum percentage.
 *
 * Usage: php scripts/check-coverage.php [minimumPercent] [cloverPath]
 */

$minimum = isset($argv[1]) ? (float) $argv[1] : 70.0;
$cloverPath = $argv[2] ?? dirname(__DIR__).'/build/coverage/clover.xml';

if (!is_readable($cloverPath)) {
    fwrite(STDERR, "Clover report not found: {$cloverPath}\n");
    exit(1);
}

$xml = simplexml_load_file($cloverPath);
if (false === $xml || !isset($xml->project->metrics)) {
    fwrite(STDERR, "Invalid clover report.\n");
    exit(1);
}

$metrics = $xml->project->metrics;
$covered = (int) $metrics['coveredstatements'];
$total = (int) $metrics['statements'];
$percent = $total > 0 ? round(100 * $covered / $total, 2) : 0.0;

echo "Line coverage: {$percent}% ({$covered}/{$total}), minimum: {$minimum}%\n";

exit($percent >= $minimum ? 0 : 1);
