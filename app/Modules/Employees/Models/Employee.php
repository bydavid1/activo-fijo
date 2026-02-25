<?php

namespace App\Modules\Employees\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $table = 'employees';

    protected $fillable = [
        'codigo',
        'nombre',
        'email',
        'departamento',
        'puesto',
        'telefono',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function integraciones(): HasMany
    {
        return $this->hasMany(EmployeeIntegration::class, 'employee_id');
    }

    public function sinronizacionLogs(): HasMany
    {
        return $this->hasMany(EmployeeSyncLog::class, 'employee_id');
    }
}
