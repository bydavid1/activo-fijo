<?php

namespace App\Modules\Employees\Contracts;

interface ExternalEmployeeProvider
{
    /**
     * Obtener todos los empleados del sistema externo
     */
    public function getEmployees(array $filters = []): array;

    /**
     * Obtener un empleado específico
     */
    public function getEmployee(string $externalId): ?array;

    /**
     * Crear un empleado en el sistema externo
     */
    public function createEmployee(array $data): array;

    /**
     * Actualizar un empleado en el sistema externo
     */
    public function updateEmployee(string $externalId, array $data): array;

    /**
     * Obtener nombre del proveedor
     */
    public function getProviderName(): string;
}
