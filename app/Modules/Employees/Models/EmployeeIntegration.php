<?php

namespace App\Modules\Employees\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeIntegration extends Model
{
    protected $table = 'employee_integrations';

    protected $fillable = [
        'employee_id',
        'sistema_externo',
        'id_externo',
        'ultima_sincronizacion',
        'metadata',
    ];

    protected $casts = [
        'ultima_sincronizacion' => 'datetime',
        'metadata' => 'json',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
