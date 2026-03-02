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
    const [permissionRequested, setPermissionRequested] = useState(() => {
        return localStorage.getItem('qr-scanner-permission-requested') === 'true';
    });
    const [permissionGranted, setPermissionGranted] = useState(() => {
        return localStorage.getItem('qr-scanner-permission-granted') === 'true';
    });
    const [showPermissionDialog, setShowPermissionDialog] = useState(false);

    useEffect(() => {
        // Verificar permisos al abrir el dialog
        if (visible) {
            const hasPermissions = localStorage.getItem('qr-scanner-permission-granted') === 'true';

            if (hasPermissions) {
                setPermissionGranted(true);
                setPermissionRequested(true);
                if (videoRef.current) {
                    initializeScanner();
                }
            } else if (!permissionRequested) {
                setShowPermissionDialog(true);
            }
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.destroy();
                scannerRef.current = null;
            }
        };
    }, [visible]);

    // Efecto separado para inicializar scanner cuando se otorgan permisos
    useEffect(() => {
        if (visible && permissionGranted && !showPermissionDialog && videoRef.current) {
            initializeScanner();
        }
    }, [permissionGranted, visible, showPermissionDialog]);

    const requestCameraPermission = async () => {
        try {
            setPermissionRequested(true);
            setShowPermissionDialog(false);
            localStorage.setItem('qr-scanner-permission-requested', 'true');

            // Verificar soporte de getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Tu navegador no soporta acceso a cámara');
            }

            // Solicitar permisos explícitamente
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // Detener el stream temporal
            stream.getTracks().forEach(track => track.stop());

            setPermissionGranted(true);
            localStorage.setItem('qr-scanner-permission-granted', 'true');

            toast.current?.show({
                severity: 'success',
                summary: 'Permisos otorgados',
                detail: 'Acceso a cámara concedido exitosamente',
                life: 2000
            });

        } catch (error) {
            console.error('Error solicitando permisos:', error);

            let errorMessage = 'No se pudo acceder a la cámara.';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso en la configuración del navegador.';
                // Si se deniegan los permisos, limpiar localStorage
                localStorage.removeItem('qr-scanner-permission-granted');
                localStorage.removeItem('qr-scanner-permission-requested');
            }

            toast.current?.show({
                severity: 'error',
                summary: 'Error de permisos',
                detail: errorMessage,
                life: 6000
            });

            setPermissionGranted(false);
        }
    };

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
        if (!scannerRef.current) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Scanner no disponible',
                detail: 'El scanner debe estar activo para cambiar de cámara',
                life: 3000
            });
            return;
        }

        if (cameras.length <= 1) {
            toast.current?.show({
                severity: 'info',
                summary: 'Una sola cámara',
                detail: 'Este dispositivo solo tiene una cámara disponible',
                life: 3000
            });
            return;
        }

        try {
            const currentIndex = cameras.findIndex(cam => cam.id === selectedCamera?.id);
            const nextIndex = (currentIndex + 1) % cameras.length;
            const nextCamera = cameras[nextIndex];

            await scannerRef.current.setCamera(nextCamera.id);
            setSelectedCamera(nextCamera);

            toast.current?.show({
                severity: 'success',
                summary: 'Cámara cambiada',
                detail: `Cambiado a: ${nextCamera.label}`,
                life: 3000
            });
        } catch (error) {
            console.error('Error cambiando cámara:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cambiar la cámara. Intenta reiniciar el scanner.',
                life: 4000
            });
        }
    };

    const toggleFlash = async () => {
        if (!scannerRef.current) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Scanner no disponible',
                detail: 'El scanner debe estar activo para usar el flash',
                life: 3000
            });
            return;
        }

        try {
            const hasFlash = await scannerRef.current.hasFlash();

            if (hasFlash) {
                const isFlashOn = await scannerRef.current.isFlashOn();
                await scannerRef.current.turnFlashOnOff(!isFlashOn);

                toast.current?.show({
                    severity: 'success',
                    summary: isFlashOn ? 'Flash desactivado' : 'Flash activado',
                    detail: isFlashOn ? 'El flash se ha apagado' : 'El flash se ha encendido',
                    life: 2000
                });
            } else {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Flash no disponible',
                    detail: 'Esta cámara no tiene flash o no es compatible',
                    life: 4000
                });
            }
        } catch (error) {
            console.error('Error con flash:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error con el flash',
                detail: 'No se pudo controlar el flash de la cámara',
                life: 4000
            });
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

            {/* Dialog de solicitud de permisos */}
            <Dialog
                header="Acceso a cámara requerido"
                visible={showPermissionDialog}
                onHide={() => {
                    setShowPermissionDialog(false);
                    onHide();
                }}
                style={{ width: '40vw', maxWidth: '500px' }}
                modal
                closable={false}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <Button
                            label="Cancelar"
                            icon="pi pi-times"
                            onClick={() => {
                                setShowPermissionDialog(false);
                                onHide();
                            }}
                            severity="secondary"
                        />
                        <Button
                            label="Permitir acceso"
                            icon="pi pi-camera"
                            onClick={requestCameraPermission}
                        />
                    </div>
                }
            >
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <i className="pi pi-camera" style={{ fontSize: '4rem', color: '#6366f1', marginBottom: '1rem' }}></i>

                    <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
                        Para usar el escáner de códigos
                    </h3>

                    <p style={{ margin: '0 0 1rem 0', color: '#666', lineHeight: '1.5' }}>
                        Necesitamos acceso a tu cámara para poder escanear códigos QR y códigos de barras.
                    </p>

                    <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                            <i className="pi pi-shield"></i>
                            <span>Tus datos están seguros. Solo usamos la cámara para escanear.</span>
                        </div>
                    </div>
                </div>
            </Dialog>

            {/* Dialog principal del scanner */}
            <Dialog
                header="Escáner de Códigos QR/Barras"
                visible={visible && permissionGranted && !showPermissionDialog}
                onHide={handleHide}
                footer={footerContent}
                style={{ width: '50vw', maxWidth: '600px' }}
                modal
                closable={false}
                className="scanner-dialog"
                contentStyle={{ padding: '1rem' }}
            >
                {permissionGranted ? (
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
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                        <i className="pi pi-exclamation-triangle" style={{ fontSize: '3rem', color: '#ffc107', marginBottom: '1rem' }}></i>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
                            Permisos de cámara requeridos
                        </h3>
                        <p style={{ margin: '0', color: '#666' }}>
                            Para usar el escáner, necesitas otorgar permisos de acceso a la cámara.
                        </p>
                    </div>
                )}
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
