<?php
declare(strict_types=1);

namespace Core;

use Core\Interfaces\ConfigInterface;
use ReflectionClass;
use ReflectionNamedType;
use Exception;

class Container
{
    /**
     * Cache des instances (Singletons).
     */
    private array $instances = [];

    /**
     * @var array<string, string|callable> Définitions (Interface => Implémentation)
     */
    private array $bindings = [];

    public function __construct(ConfigInterface $config) {
        $this->instance(ConfigInterface::class, $config);
    }

    /**
     * Enregistre une interface liée à une classe concrète.
     * Ex: $container->bind(SessionInterface::class, SessionService::class);
     */
    public function bind(string $interface, string|callable $implementation): void
    {
        $this->bindings[$interface] = $implementation;
    }

    /**
     * Enregistre une instance déjà construite.
     */
    public function instance(string $interface, object $instance): void
    {
        $this->instances[$interface] = $instance;
    }

    /**
     * Récupère ou fabrique une dépendance.
     */
    public function get(string $id): object
    {
        // Si on a déjà l'instance en cache (Singleton), on la retourne
        if (isset($this->instances[$id])) {
            return $this->instances[$id];
        }

        // Si on a une définition explicite (Binding)
        if (isset($this->bindings[$id])) {
            $concrete = $this->bindings[$id];

            // Cas A : C'est une string (Nom de classe), on résout récursivement
            if (is_string($concrete)) {
                $object = $this->get($concrete);
            }
            // Cas B : C'est une fonction (Factory), on l'exécute
            elseif (is_callable($concrete)) {
                $object = $concrete($this);
            } else {
                throw new Exception("Type de binding invalide pour $id");
            }

            // On sauvegarde l'instance (Singleton par défaut)
            $this->instances[$id] = $object;
            return $object;
        }

        // Sinon, on tente l'Autowiring
        return $this->autowire($id);
    }

    /**
     * Tente de construire une classe via Reflection.
     */
    private function autowire(string $className): object
    {
        if (!class_exists($className)) {
            throw new Exception("Container : Impossible de résoudre '$className'. Aucune liaison définie et classe introuvable.");
        }

        $reflector = new ReflectionClass($className);

        if (!$reflector->isInstantiable()) {
            throw new Exception("Container : La classe '$className' n'est pas instanciable (Interface ou Abstraite sans binding).");
        }

        $constructor = $reflector->getConstructor();

        if (is_null($constructor)) {
            return new $className();
        }

        $parameters = $constructor->getParameters();
        $dependencies = [];

        foreach ($parameters as $parameter) {
            $type = $parameter->getType();

            if (!$type instanceof ReflectionNamedType || $type->isBuiltin()) {
                // Astuce : On essaye de voir si une valeur par défaut existe
                if ($parameter->isDefaultValueAvailable()) {
                    $dependencies[] = $parameter->getDefaultValue();
                    continue;
                }
                throw new Exception("Container : Impossible de résoudre le paramètre '{$parameter->getName()}' de $className.");
            }

            // Récursivité : on demande la dépendance
            $dependencies[] = $this->get($type->getName());
        }

        return $reflector->newInstanceArgs($dependencies);
    }
}