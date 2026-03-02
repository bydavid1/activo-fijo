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
            // Verificar soporte de getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Tu navegador no soporta acceso a cámara');
            }

            // Listar cámaras disponibles
            const cameraList = await QrScanner.listCameras(true);

            if (!cameraList || cameraList.length === 0) {
                throw new Error('No se encontraron cámaras disponibles');
            }

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
            const config = {
                returnDetailedScanResult: true,
                highlightScanRegion: true,
                highlightCodeOutline: true,
            };

            // Solo establecer preferredCamera si existe y tiene id
            if (preferredCamera?.id) {
                config.preferredCamera = preferredCamera.id;
            }

            scannerRef.current = new QrScanner(
                videoRef.current,
                result => handleScan(result.data),
                config
            );

            await scannerRef.current.start();
            setIsScanning(true);

        } catch (error) {
            console.error('Error inicializando scanner:', error);
            const errorMessage = error.message || 'No se pudo acceder a la cámara. Verifique los permisos.';

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: errorMessage,
                life: 5000
            });

            setIsScanning(false);
        }
    };

    const handleScan = (data) => {
        if (data && !loading) {
            // Detener el scanner brevemente para evitar múltiples escaneos
            if (scannerRef.current && isScanning) {
                scannerRef.current.stop();
                setIsScanning(false);
            }

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
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            flexWrap: 'wrap',
            gap: '0.5rem'
        }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {cameras.length > 1 && (
                    <Button
                        icon="pi pi-refresh"
                        rounded
                        outlined
                        tooltip="Cambiar cámara"
                        onClick={switchCamera}
                        disabled={loading}
                        style={{ padding: '0.5rem' }}
                    />
                )}

                <Button
                    icon="pi pi-sun"
                    rounded
                    outlined
                    tooltip="Flash"
                    onClick={toggleFlash}
                    disabled={loading}
                    style={{ padding: '0.5rem' }}
                />

                <Button
                    icon={isScanning ? "pi pi-pause" : "pi pi-play"}
                    rounded
                    severity={isScanning ? "warning" : "success"}
                    tooltip={isScanning ? "Pausar scanner" : "Iniciar scanner"}
                    onClick={isScanning ? stopScanner : startScanner}
                    disabled={loading}
                    style={{ padding: '0.5rem' }}
                />
            </div>

            <Button
                label="Cerrar"
                icon="pi pi-times"
                onClick={handleHide}
                severity="secondary"
                style={{ minWidth: '100px' }}
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
                style={{ width: '40vw', maxWidth: '600px' }}
                modal
                closable={false}
                className="scanner-dialog"
                contentStyle={{ padding: '1rem' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="scanner-container" style={{ position: 'relative', width: '100%' }}>
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                height: 'auto',
                                aspectRatio: '4/3',
                                backgroundColor: '#000',
                                borderRadius: '8px',
                                display: 'block'
                            }}
                            playsInline
                        />

                        {loading && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                borderRadius: '8px',
                                gap: '0.5rem'
                            }}>
                                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#fff' }} />
                                <span style={{ color: '#fff' }}>Procesando...</span>
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>
                            {isScanning
                                ? "Apunte la cámara hacia el código QR o código de barras"
                                : "Scanner pausado - presione play para continuar"
                            }
                        </p>

                        {selectedCamera && (
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.5rem 0 0 0' }}>
                                Cámara: {selectedCamera.label}
                            </p>
                        )}
                    </div>
                </div>
            </Dialog>

            <style jsx>{`
                .scanner-dialog :global(.p-dialog) {
                    margin: 0;
                    border-radius: 8px;
                }

                .scanner-dialog :global(.p-dialog-content) {
                    padding: 1rem;
                }

                .scanner-dialog :global(.p-dialog-footer) {
                    padding: 1rem;
                    border-top: 1px solid #e0e0e0;
                }

                @media (max-width: 600px) {
                    .scanner-dialog :global(.p-dialog) {
                        width: 95vw !important;
                        max-width: 100% !important;
                    }

                    .scanner-dialog :global(.p-dialog-content) {
                        padding: 0.75rem;
                    }

                    .scanner-dialog :global(.p-dialog-footer) {
                        padding: 0.75rem;
                        flex-direction: column;
                    }
                }
            `}</style>
        </>
    );
};

export default QRScanner;
