<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $titulo }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, #4F46E5, #7C3AED);
            color: white;
            padding: 20px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        .header .fecha {
            font-size: 10px;
            opacity: 0.9;
        }
        .resumen {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .resumen h3 {
            font-size: 12px;
            color: #4F46E5;
            margin-bottom: 10px;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 5px;
        }
        .resumen-grid {
            display: table;
            width: 100%;
        }
        .resumen-item {
            display: table-cell;
            text-align: center;
            padding: 5px 10px;
            border-right: 1px solid #e9ecef;
        }
        .resumen-item:last-child {
            border-right: none;
        }
        .resumen-item .label {
            font-size: 8px;
            color: #6c757d;
            text-transform: uppercase;
        }
        .resumen-item .value {
            font-size: 14px;
            font-weight: bold;
            color: #212529;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th {
            background: #4F46E5;
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        td {
            padding: 6px;
            border-bottom: 1px solid #e9ecef;
            font-size: 9px;
        }
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        tr:hover {
            background: #e9ecef;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #6c757d;
            padding: 10px;
            border-top: 1px solid #e9ecef;
        }
        .number {
            text-align: right;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: bold;
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $titulo }}</h1>
        <div class="fecha">Generado: {{ $fecha }}</div>
    </div>

    @if($resumen)
    <div class="resumen">
        <h3>Resumen</h3>
        <div class="resumen-grid">
            @foreach($resumen as $key => $value)
                @if(!is_array($value))
                <div class="resumen-item">
                    <div class="label">{{ str_replace('_', ' ', ucfirst($key)) }}</div>
                    <div class="value">
                        @if(is_numeric($value) && $value > 1000)
                            {{ number_format($value, 0, ',', '.') }}
                        @else
                            {{ $value }}
                        @endif
                    </div>
                </div>
                @endif
            @endforeach
        </div>
    </div>
    @endif

    <table>
        <thead>
            <tr>
                @foreach($columns as $key => $label)
                    <th>{{ $label }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($data as $row)
                <tr>
                    @foreach($columns as $key => $label)
                        <td @if(in_array($key, ['valor_compra', 'valor_en_libros', 'depreciacion_acumulada', 'precio_venta', 'costo_estimado', 'costo_real', 'valor_total', 'ganancia_perdida'])) class="number" @endif>
                            @php
                                $value = data_get($row, $key, '-');
                            @endphp

                            @if(in_array($key, ['valor_compra', 'valor_en_libros', 'depreciacion_acumulada', 'precio_venta', 'costo_estimado', 'costo_real', 'valor_total', 'ganancia_perdida', 'valor_libros']))
                                ${{ number_format($value ?? 0, 2, ',', '.') }}
                            @elseif(in_array($key, ['porcentaje_depreciado', 'porcentaje_completado']))
                                {{ number_format($value ?? 0, 1) }}%
                            @elseif($key === 'estado')
                                <span class="badge
                                    @if(in_array($value, ['activo', 'completado', 'aprobada', 'resuelta'])) badge-success
                                    @elseif(in_array($value, ['pendiente', 'en_progreso', 'programado'])) badge-warning
                                    @elseif(in_array($value, ['baja', 'retirado', 'rechazada'])) badge-danger
                                    @else badge-info @endif">
                                    {{ ucfirst(str_replace('_', ' ', $value)) }}
                                </span>
                            @else
                                {{ $value ?? '-' }}
                            @endif
                        </td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($columns) }}" style="text-align: center; color: #6c757d;">
                        No hay datos disponibles
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Sistema de Gestión de Activos Fijos - {{ config('app.name') }} | Página generada automáticamente
    </div>
</body>
</html>
