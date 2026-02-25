<?php

namespace App\Modules\Assets\Services;

use App\Modules\Assets\Models\Asset;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

class QRCodeGenerator
{
    private PngWriter $writer;

    public function __construct()
    {
        $this->writer = new PngWriter();
    }

    /**
     * Generar QR en memoria (sin almacenar)
     * Retorna PNG binary
     */
    public function generateQRCodeBinary(Asset $asset): string
    {
        $data = $this->buildQRData($asset);

        $qrCode = QrCode::create($data)
            ->setSize(300)
            ->setMargin(10);

        $result = $this->writer->write($qrCode);

        return $result->getString();
    }

    /**
     * Obtener datos del QR como JSON (para escaneo)
     */
    public function buildQRData(Asset $asset): string
    {
        return json_encode([
            'id' => $asset->id,
            'codigo' => $asset->codigo,
            'nombre' => $asset->nombre,
            'url' => route('api.assets.show', $asset->id),
        ]);
    }

    /**
     * Registrar acceso a QR (auditoría)
     */
    public function logAccess(Asset $asset, ?int $userId = null): void
    {
        $asset->qrAccesses()->create([
            'user_id' => $userId ?? auth()->id(),
            'accessed_at' => now(),
        ]);
    }
}
