<?php

namespace App\Modules\Assets\Services;

use App\Modules\Assets\Models\Asset;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Picqer\Barcode\BarcodeGeneratorPNG;

class QRCodeGenerator
{
    private PngWriter $writer;
    private BarcodeGeneratorPNG $barcodeGenerator;

    public function __construct()
    {
        $this->writer = new PngWriter();
        $this->barcodeGenerator = new BarcodeGeneratorPNG();
    }

    /**
     * Generar QR en memoria (sin almacenar)
     * Retorna PNG binary
     */
    public function generateQRCodeBinary(Asset $asset): string
    {
        $data = $this->buildQRData($asset);

        $qrCode = new QrCode(
            data: $data,
            size: 300,
            margin: 10
        );

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
            'url' => config('app.url') . "/assets/{$asset->id}",
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

    /**
     * Generar código de barras en memoria (sin almacenar)
     * Usa CODE128 que soporta alfanuméricos
     * Retorna PNG binary
     */
    public function generateBarcodeBinary(Asset $asset, int $width = 2, int $height = 60): string
    {
        return $this->barcodeGenerator->getBarcode(
            $asset->codigo,
            $this->barcodeGenerator::TYPE_CODE_128,
            $width,
            $height
        );
    }

    /**
     * Generar etiqueta completa para impresora de viñetas
     * Incluye: QR pequeño, código de barras, texto con código y nombre
     * Retorna PNG binary (formato optimizado para impresoras térmicas)
     */
    public function generateLabelBinary(Asset $asset, int $labelWidth = 400, int $labelHeight = 200): string
    {
        // Crear imagen base para la etiqueta
        $label = imagecreatetruecolor($labelWidth, $labelHeight);
        $white = imagecolorallocate($label, 255, 255, 255);
        $black = imagecolorallocate($label, 0, 0, 0);

        // Fondo blanco
        imagefill($label, 0, 0, $white);

        // Generar QR pequeño (100x100)
        $qrData = $this->buildQRData($asset);
        $qrCode = new QrCode(
            data: $qrData,
            size: 90,
            margin: 5
        );
        $qrResult = $this->writer->write($qrCode);
        $qrImage = imagecreatefromstring($qrResult->getString());

        // Pegar QR en la etiqueta (izquierda)
        imagecopy($label, $qrImage, 10, 10, 0, 0, imagesx($qrImage), imagesy($qrImage));
        imagedestroy($qrImage);

        // Generar código de barras
        $barcodeData = $this->barcodeGenerator->getBarcode(
            $asset->codigo,
            $this->barcodeGenerator::TYPE_CODE_128,
            2,
            50
        );
        $barcodeImage = imagecreatefromstring($barcodeData);

        // Pegar código de barras (derecha del QR)
        imagecopy($label, $barcodeImage, 120, 15, 0, 0, imagesx($barcodeImage), imagesy($barcodeImage));
        imagedestroy($barcodeImage);

        // Agregar texto con código del activo
        $fontSize = 4; // Tamaño de fuente built-in (1-5)
        $codigoText = "COD: " . $asset->codigo;
        imagestring($label, $fontSize, 120, 75, $codigoText, $black);

        // Agregar nombre del activo (truncado si es muy largo)
        $nombreText = mb_strlen($asset->nombre) > 30
            ? mb_substr($asset->nombre, 0, 27) . '...'
            : $asset->nombre;
        imagestring($label, 3, 10, 115, $nombreText, $black);

        // Agregar ubicación si existe
        if ($asset->ubicacion) {
            $ubicacionText = "Ubic: " . (mb_strlen($asset->ubicacion->nombre) > 25
                ? mb_substr($asset->ubicacion->nombre, 0, 22) . '...'
                : $asset->ubicacion->nombre);
            imagestring($label, 2, 10, 140, $ubicacionText, $black);
        }

        // Agregar código de inventario si existe
        if ($asset->numero_inventario) {
            $invText = "Inv: " . $asset->numero_inventario;
            imagestring($label, 2, 10, 160, $invText, $black);
        }

        // Agregar fecha
        $fechaText = date('d/m/Y');
        imagestring($label, 1, $labelWidth - 70, $labelHeight - 15, $fechaText, $black);

        // Convertir a PNG
        ob_start();
        imagepng($label);
        $pngData = ob_get_clean();


        imagedestroy($label);

        return $pngData;
    }

    /**
     * Generar múltiples etiquetas en una sola imagen (para impresión en lote)
     * @param Asset[] $assets
     */
    public function generateBatchLabels(array $assets, int $columns = 2): string
    {
        $labelWidth = 400;
        $labelHeight = 200;
        $margin = 10;

        $totalAssets = count($assets);
        $rows = ceil($totalAssets / $columns);

        $batchWidth = ($labelWidth * $columns) + ($margin * ($columns + 1));
        $batchHeight = ($labelHeight * $rows) + ($margin * ($rows + 1));

        $batch = imagecreatetruecolor($batchWidth, $batchHeight);
        $white = imagecolorallocate($batch, 255, 255, 255);
        imagefill($batch, 0, 0, $white);

        foreach ($assets as $index => $asset) {
            $row = floor($index / $columns);
            $col = $index % $columns;

            $x = $margin + ($col * ($labelWidth + $margin));
            $y = $margin + ($row * ($labelHeight + $margin));

            $labelData = $this->generateLabelBinary($asset, $labelWidth, $labelHeight);
            $labelImage = imagecreatefromstring($labelData);

            imagecopy($batch, $labelImage, $x, $y, 0, 0, $labelWidth, $labelHeight);
            imagedestroy($labelImage);
        }

        ob_start();
        imagepng($batch);
        $pngData = ob_get_clean();

        imagedestroy($batch);

        return $pngData;
    }
}
