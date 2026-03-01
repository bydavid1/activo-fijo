<?php

namespace App\Modules\Reports\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GenericReportExport implements FromArray, WithHeadings, WithTitle, WithStyles, ShouldAutoSize
{
    protected array $data;
    protected array $headings;
    protected string $title;
    protected array $columnKeys;

    public function __construct(array $data, array $columns, string $title = 'Reporte')
    {
        $this->data = $data;
        $this->title = $title;
        $this->headings = array_values($columns);
        $this->columnKeys = array_keys($columns);
    }

    public function array(): array
    {
        return collect($this->data)->map(function ($row) {
            $mappedRow = [];
            foreach ($this->columnKeys as $key) {
                $value = data_get($row, $key, '');

                // Formatear valores especiales
                if (is_bool($value)) {
                    $value = $value ? 'Sí' : 'No';
                } elseif ($value instanceof \DateTime || $value instanceof \Carbon\Carbon) {
                    $value = $value->format('Y-m-d');
                } elseif (is_array($value)) {
                    $value = json_encode($value);
                }

                $mappedRow[] = $value ?? '';
            }
            return $mappedRow;
        })->toArray();
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function title(): string
    {
        return substr($this->title, 0, 31); // Excel limita a 31 caracteres
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5'],
                ],
            ],
        ];
    }
}
