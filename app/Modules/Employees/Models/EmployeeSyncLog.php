<?php

namespace App\Modules\Employees\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeSyncLog extends Model
{
    protected $table = 'employee_sync_logs';

    public $timestamps = true;

    protected $fillable = [
        'employee_id',
        'accion',
        'estado',
        'respuesta',
        'mensaje_error',
    ];

    protected $casts = [
        'respuesta' => 'json',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
