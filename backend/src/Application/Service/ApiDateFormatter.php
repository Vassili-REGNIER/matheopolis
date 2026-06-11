<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

/**
 * Represents the API date formatter component.
 */
final class ApiDateFormatter
{
    /**
     * To iso utc.
     */
    public static function toIsoUtc(?string $value): ?string
    {
        if (null === $value || '' === trim($value)) {
            return null;
        }

        $date = self::parseUtc(trim($value));
        if (null === $date) {
            return $value;
        }

        return $date
            ->setTimezone(new \DateTimeZone('UTC'))
            ->format('Y-m-d\TH:i:s\Z')
        ;
    }

    /**
     * Parse utc.
     */
    private static function parseUtc(string $value): ?\DateTimeImmutable
    {
        $timezone = new \DateTimeZone('UTC');
        foreach (['!Y-m-d H:i:s', '!Y-m-d'] as $format) {
            $date = \DateTimeImmutable::createFromFormat($format, $value, $timezone);
            if ($date instanceof \DateTimeImmutable && !self::hasDateParseErrors()) {
                return $date;
            }
        }

        try {
            return new \DateTimeImmutable($value, $timezone);
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * Checks whether the date parse errors exists.
     */
    private static function hasDateParseErrors(): bool
    {
        $errors = \DateTimeImmutable::getLastErrors();
        if (false === $errors) {
            return false;
        }

        return $errors['warning_count'] > 0 || $errors['error_count'] > 0;
    }
}
