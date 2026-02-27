import React, { useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

const QRScanner = ({ visible, onHide, onScan, loading = false }) => {
    const videoRef = useRef(null);
    const scannerRef = useRef(null);
    const toast = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);

    useEffect(() => {
        // Verificar soporte para cámaras
        if (visible && videoRef.current) {
            initializeScanner();
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.destroy();
                scannerRef.current = null;
            }
        };
    }, [visible]);

    const initializeScanner = async () => {
        try {
            // Listar cámaras disponibles
            const cameraList = await QrScanner.listCameras(true);
            setCameras(cameraList);

            // Buscar cámara trasera preferentemente
            const backCamera = cameraList.find(camera =>
                camera.label.toLowerCase().includes('back') ||
                camera.label.toLowerCase().includes('rear') ||
                camera.label.toLowerCase().includes('trasera')
            );

            const preferredCamera = backCamera || cameraList[0];
            setSelectedCamera(preferredCamera);

            // Crear el scanner
            scannerRef.current = new QrScanner(
                videoRef.current,
                result => handleScan(result.data),
                {
                    returnDetailedScanResult: true,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    preferredCamera: preferredCamera?.id || 'environment'
                }
            );

            await scannerRef.current.start();
            setIsScanning(true);

        } catch (error) {
            console.error('Error inicializando scanner:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo acceder a la cámara. Verifique los permisos.',
                life: 5000
            });
        }
    };

    const handleScan = (data) => {
        if (data && !loading) {
            // Vibrar si está disponible
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }

            // Llamar callback con el código escaneado
            onScan(data);
        }
    };

    const switchCamera = async () => {
        if (!scannerRef.current || cameras.length <= 1) return;

        try {
            const currentIndex = cameras.findIndex(cam => cam.id === selectedCamera?.id);
            const nextIndex = (currentIndex + 1) % cameras.length;
            const nextCamera = cameras[nextIndex];

            await scannerRef.current.setCamera(nextCamera.id);
            setSelectedCamera(nextCamera);

            toast.current?.show({
                severity: 'info',
                summary: 'Cámara cambiada',
                detail: nextCamera.label,
                life: 2000
            });
        } catch (error) {
            console.error('Error cambiando cámara:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cambiar la cámara',
                life: 3000
            });
        }
    };

    const toggleFlash = async () => {
        if (!scannerRef.current) return;

        try {
            const hasFlash = await scannerRef.current.hasFlash();
            if (hasFlash) {
                const isFlashOn = await scannerRef.current.isFlashOn();
                await scannerRef.current.turnFlashOnOff(!isFlashOn);

                toast.current?.show({
                    severity: 'info',
                    summary: isFlashOn ? 'Flash desactivado' : 'Flash activado',
                    life: 2000
                });
            } else {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Flash no disponible',
                    detail: 'Esta cámara no tiene flash',
                    life: 3000
                });
            }
        } catch (error) {
            console.error('Error con flash:', error);
        }
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop();
            setIsScanning(false);
        }
    };

    const startScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.start();
                setIsScanning(true);
            } catch (error) {
                console.error('Error reiniciando scanner:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo reiniciar el scanner',
                    life: 3000
                });
            }
        }
    };

    const handleHide = () => {
        if (scannerRef.current) {
            scannerRef.current.destroy();
            scannerRef.current = null;
        }
        setIsScanning(false);
        onHide();
    };

    const footerContent = (
        <div className="flex justify-between align-items-center w-full">
            <div className="flex gap-2">
                {cameras.length > 1 && (
                    <Button
                        icon="pi pi-refresh"
                        rounded
                        outlined
                        tooltip="Cambiar cámara"
                        onClick={switchCamera}
                        disabled={loading}
                    />
                )}

                <Button
                    icon="pi pi-sun"
                    rounded
                    outlined
                    tooltip="Flash"
                    onClick={toggleFlash}
                    disabled={loading}
                />

                <Button
                    icon={isScanning ? "pi pi-pause" : "pi pi-play"}
                    rounded
                    severity={isScanning ? "warning" : "success"}
                    tooltip={isScanning ? "Pausar scanner" : "Iniciar scanner"}
                    onClick={isScanning ? stopScanner : startScanner}
                    disabled={loading}
                />
            </div>

            <Button
                label="Cerrar"
                icon="pi pi-times"
                onClick={handleHide}
                className="p-button-secondary"
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                header="Escáner de Códigos QR/Barras"
                visible={visible}
                onHide={handleHide}
                footer={footerContent}
                style={{ width: '90vw', maxWidth: '600px' }}
                modal
                closable={false}
                className="scanner-dialog"
            >
                <div className="flex flex-column align-items-center">
                    <div className="scanner-container relative mb-3">
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                maxWidth: '500px',
                                height: 'auto',
                                aspectRatio: '4/3',
                                backgroundColor: '#000',
                                borderRadius: '8px'
                            }}
                            playsInline
                        />

                        {loading && (
                            <div className="absolute top-0 left-0 w-full h-full flex align-items-center justify-content-center bg-black-alpha-50 border-round">
                                <i className="pi pi-spin pi-spinner text-white" style={{ fontSize: '2rem' }} />
                                <span className="text-white ml-2">Procesando...</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-600 m-0">
                            {isScanning
                                ? "Apunte la cámara hacia el código QR o código de barras"
                                : "Scanner pausado - presione play para continuar"
                            }
                        </p>

                        {selectedCamera && (
                            <p className="text-xs text-400 mt-1 mb-0">
                                Cámara: {selectedCamera.label}
                            </p>
                        )}
                    </div>
                </div>
            </Dialog>

            <style jsx>{`
                .scanner-dialog .p-dialog-content {
                    padding: 1rem;
                }

                .scanner-container {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                /* Estilos para resaltar la región de escaneo */
                :global(.scan-region-highlight) {
                    border: 2px solid #22c55e !important;
                    box-shadow: 0 0 20px rgba(34, 197, 94, 0.5) !important;
                }
            `}</style>
        </>
    );
};

export default QRScanner;
