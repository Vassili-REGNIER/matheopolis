<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Validation;

use Matheopolis\Application\Port\ValidatorInterface;

/**
 * Schema-based validation with internal presets (no database).
 */
final class ValidatorService implements ValidatorInterface
{
    /**
     * @var array<string, array<int, mixed>>
     */
    private const PRESETS = [
        'text' => [
            'trim',
            'required',
            ['min', 2],
            ['max', 50],
        ],
        'username' => [
            'trim',
            'required',
            ['min', 3],
            ['max', 50],
            ['regex', '/^[a-zA-Z0-9_]+$/'],
        ],
        'email' => [
            'trim',
            'sanitize_email',
            'required',
            'email',
            ['max', 255],
        ],
        'password' => [
            'required',
            ['min', 8],
            ['max', 100],
        ],
        'password_confirm' => [
            'required',
            ['matches', 'password'],
        ],
        'code' => [
            'trim',
            'required',
            ['max', 20],
        ],
        'integer' => [
            'trim',
            'required',
            'integer',
        ],
    ];

    /** @var array<string, string> */
    private array $errors = [];

    /** @var array<string, mixed> */
    private array $validatedData = [];

    /**
     * @param array<string, mixed>  $source
     * @param array<string, string> $schema field => preset name
     *
     * @return array<string, mixed>|false
     */
    public function run(array $source, array $schema): array|false
    {
        $this->reset();

        foreach ($schema as $field => $presetName) {
            if (!isset(self::PRESETS[$presetName])) {
                continue;
            }

            $rules = self::PRESETS[$presetName];
            $value = $source[$field] ?? null;

            foreach ($rules as $ruleDef) {
                if (\is_array($ruleDef)) {
                    $ruleName = $ruleDef[0];
                    $params = \array_slice($ruleDef, 1);
                } else {
                    $ruleName = $ruleDef;
                    $params = [];
                }

                $value = $this->applyRule($field, $value, $ruleName, $params, $source);

                if ('required' === $ruleName && isset($this->errors[$field])) {
                    break;
                }
            }

            $this->validatedData[$field] = $value;
        }

        return [] === $this->errors ? $this->validatedData : false;
    }

    /**
     * @return array<string, string>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    private function reset(): void
    {
        $this->errors = [];
        $this->validatedData = [];
    }

    /**
     * @param array<int, mixed>    $params
     * @param array<string, mixed> $fullSource
     */
    private function applyRule(string $field, mixed $value, string $rule, array $params, array $fullSource): mixed
    {
        switch ($rule) {
            case 'trim':
                return \is_string($value) ? trim($value) : $value;

            case 'sanitize_email':
                return filter_var($value, FILTER_SANITIZE_EMAIL);
        }

        if ('required' !== $rule && (null === $value || '' === $value)) {
            return $value;
        }

        switch ($rule) {
            case 'required':
                $asStr = '';
                if (\is_string($value)) {
                    $asStr = $value;
                } elseif (\is_scalar($value)) {
                    $asStr = (string) $value;
                }
                if (null === $value || '' === trim($asStr)) {
                    $this->addError($field, 'This field is required.');
                }

                break;

            case 'min':
                $min = isset($params[0]) && is_numeric($params[0]) ? (int) $params[0] : 0;
                if (\is_string($value) && mb_strlen($value) < $min) {
                    $this->addError($field, "Must be at least {$min} characters.");
                }

                break;

            case 'max':
                $max = isset($params[0]) && is_numeric($params[0]) ? (int) $params[0] : 0;
                if (\is_string($value) && mb_strlen($value) > $max) {
                    $this->addError($field, "Must not exceed {$max} characters.");
                }

                break;

            case 'email':
                if (false === filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, 'Invalid email format.');
                }

                break;

            case 'integer':
                if (false === filter_var($value, FILTER_VALIDATE_INT)) {
                    $this->addError($field, 'Must be an integer.');
                }

                break;

            case 'regex':
                $pattern = $params[0] ?? '';
                $patternStr = \is_string($pattern) ? $pattern : '';
                $valueStr = \is_string($value) ? $value : (\is_scalar($value) ? (string) $value : '');
                if (1 !== preg_match($patternStr, $valueStr)) {
                    $this->addError($field, 'Invalid format.');
                }

                break;

            case 'matches':
                $targetField = $params[0] ?? '';
                if (!\is_string($targetField) || '' === $targetField) {
                    break;
                }
                $targetValue = $fullSource[$targetField] ?? null;
                if ($value !== $targetValue) {
                    $this->addError($field, "Does not match field {$targetField}.");
                }

                break;
        }

        return $value;
    }

    private function addError(string $field, string $message): void
    {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = $message;
        }
    }
}
