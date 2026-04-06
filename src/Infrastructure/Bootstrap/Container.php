<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Bootstrap;

use Matheopolis\Application\Port\ConfigInterface;

final class Container
{
    /** @var array<string, object> */
    private array $instances = [];

    /** @var array<string, callable|string> */
    private array $bindings = [];

    public function __construct(ConfigInterface $config)
    {
        $this->instance(ConfigInterface::class, $config);
    }

    public function bind(string $interface, callable|string $implementation): void
    {
        $this->bindings[$interface] = $implementation;
    }

    public function instance(string $interface, object $instance): void
    {
        $this->instances[$interface] = $instance;
    }

    public function get(string $id): object
    {
        if (isset($this->instances[$id])) {
            return $this->instances[$id];
        }

        if (isset($this->bindings[$id])) {
            $concrete = $this->bindings[$id];
            if (\is_string($concrete)) {
                $object = $this->get($concrete);
            } elseif (\is_callable($concrete)) {
                $resolved = $concrete($this);
                if (!\is_object($resolved)) {
                    throw new \Exception("Factory for {$id} must return an object.");
                }
                $object = $resolved;
            } else {
                throw new \Exception("Invalid binding type for {$id}");
            }

            $this->instances[$id] = $object;

            return $object;
        }

        return $this->autowire($id);
    }

    private function autowire(string $className): object
    {
        if (!class_exists($className)) {
            throw new \Exception("Container: cannot resolve '{$className}'.");
        }

        $reflector = new \ReflectionClass($className);
        if (!$reflector->isInstantiable()) {
            throw new \Exception("Container: '{$className}' is not instantiable.");
        }

        $constructor = $reflector->getConstructor();
        if (null === $constructor) {
            return new $className();
        }

        $dependencies = [];
        foreach ($constructor->getParameters() as $parameter) {
            $type = $parameter->getType();
            if (!$type instanceof \ReflectionNamedType || $type->isBuiltin()) {
                if ($parameter->isDefaultValueAvailable()) {
                    $dependencies[] = $parameter->getDefaultValue();

                    continue;
                }

                throw new \Exception("Container: cannot resolve parameter '{$parameter->getName()}' for {$className}.");
            }

            $dependencies[] = $this->get($type->getName());
        }

        $object = $reflector->newInstanceArgs($dependencies);
        $this->instances[$className] = $object;

        return $object;
    }
}
