<?php
declare(strict_types=1);

namespace Core\Services;

use Core\Interfaces\ValidatorInterface;

/**
 * Validator Helper.
 * Pure validation and sanitization class.
 * No database dependency. No complex string parsing.
 * Uses strict presets defined internally.
 */
final class ValidatorService implements ValidatorInterface
{
    /** @var array<string, string> Stores validation errors (Field => Message) */
    private array $errors = [];

    /** @var array<string, mixed> Stores cleaned/sanitized data */
    private array $validatedData = [];

    /**
     * Internal configuration of rules per data type (Preset).
     * Format: 'preset_name' => [ 'rule1', ['ruleWithParam', paramValue], ... ]
     */
    private const PRESETS = [
        // Standard text (Names, Cities...)
        'text' => [
            'trim',
            'required',
            ['min', 2],
            ['max', 50]
        ],

        // Usernames
        'username' => [
            'trim',
            'required',
            ['min', 3],
            ['max', 50],
            ['regex', '/^[a-zA-Z0-9_]+$/'] // Only alphanum + underscore
        ],

        // Emails
        'email' => [
            'trim',
            'sanitize_email',
            'required',
            'email',
            ['max', 255]
        ],

        // Passwords
        'password' => [
            'required',
            ['min', 8],
            ['max', 100]
        ],

        // Password Confirmation (Expects a field named 'password' to exist)
        'password_confirm' => [
            'required',
            ['matches', 'password']
        ],

        // Class & Teacher Codes / Generic Codes
        'code' => [
            'trim',
            'required',
            ['max', 20]
        ],

        // Integer IDs
        'integer' => [
            'trim',
            'required',
            'integer'
        ]
    ];

    /**
     * Main entry point.
     *
     * @param array $source The input data (e.g., $_POST)
     * @param array<string, string> $schema Mapping of FieldName => PresetName
     * @return array|false Returns the CLEANED data array if valid, false otherwise.
     */
    public function run(array $source, array $schema): array|false
    {
        // Reset validator state
        $this->reset();

        foreach ($schema as $field => $presetName) {

            // 1. Check if preset exists
            if (!isset(self::PRESETS[$presetName])) {
                // Fallback or developer error logic could go here.
                continue;
            }

            $rules = self::PRESETS[$presetName];
            $value = $source[$field] ?? null;

            // 2. Apply rules defined in the preset
            foreach ($rules as $ruleDef) {
                // Extract rule name and parameters
                // Format: 'required' OR ['min', 3]
                if (is_array($ruleDef)) {
                    $ruleName = $ruleDef[0];
                    $params = array_slice($ruleDef, 1); // Rest of the array are params
                } else {
                    $ruleName = $ruleDef;
                    $params = [];
                }

                // Apply logic
                $value = $this->applyRule($field, $value, $ruleName, $params, $source);

                // If a fatal error for this field occurred (like required missing), stop chain
                if ($ruleName === 'required' && isset($this->errors[$field])) {
                    break;
                }
            }

            // Store the (potentially sanitized) value
            $this->validatedData[$field] = $value;
        }

        return empty($this->errors) ? $this->validatedData : false;
    }

    /**
     * Resets the validator state.
     */
    private function reset(): void
    {
        $this->errors = [];
        $this->validatedData = [];
    }

    /**
     * Applies a single rule.
     * Returns the (potentially modified) value.
     */
    private function applyRule(string $field, mixed $value, string $rule, array $params, array $fullSource): mixed
    {
        // --- SANITIZATION (Modifies Value) ---
        switch ($rule) {
            case 'trim':
                return is_string($value) ? trim($value) : $value;

            case 'sanitize_email':
                return filter_var($value, FILTER_SANITIZE_EMAIL);
        }

        // --- VALIDATION (Checks Value) ---

        // Skip validation if empty (unless rule is 'required')
        if ($rule !== 'required' && ($value === null || $value === '')) {
            return $value;
        }

        switch ($rule) {
            case 'required':
                if ($value === null || trim((string)$value) === '') {
                    $this->addError($field, "Ce champ est obligatoire.");
                }
                break;

            case 'min':
                $min = (int) $params[0];
                if (is_string($value) && mb_strlen($value) < $min) {
                    $this->addError($field, "Doit contenir au moins $min caractères.");
                }
                break;

            case 'max':
                $max = (int) $params[0];
                if (is_string($value) && mb_strlen($value) > $max) {
                    $this->addError($field, "Ne doit pas dépasser $max caractères.");
                }
                break;

            case 'email':
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, "Format d'email invalide.");
                }
                break;

            case 'integer':
                if (!filter_var($value, FILTER_VALIDATE_INT)) {
                    $this->addError($field, "Doit être un nombre entier.");
                }
                break;

            case 'regex':
                $pattern = $params[0];
                if (!preg_match($pattern, (string)$value)) {
                    $this->addError($field, "Format invalide.");
                }
                break;

            case 'matches':
                $targetField = $params[0];
                $targetValue = $fullSource[$targetField] ?? null;
                // Note: We compare with raw source to ensure we match what user typed
                if ($value !== $targetValue) {
                    $this->addError($field, "Ne correspond pas au champ $targetField.");
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

    public function getErrors(): array
    {
        return $this->errors;
    }
}