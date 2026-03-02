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

    // Reanudar scanner cuando loading cambia de true a false
    useEffect(() => {
        if (!loading && scannerRef.current && !isScanning) {
            scannerRef.current.start().then(() => {
                setIsScanning(true);
            }).catch(err => {
                console.error('Error reanudando scanner:', err);
            });
        }
    }, [loading]);

    const initializeScanner = async () => {
        try {
            if (!videoRef.current) return;

            // Listar cámaras disponibles
            const cameraList = await QrScanner.listCameras(true);
            setCameras(cameraList);

            // Buscar cámara trasera
            const backCamera = cameraList.find(camera =>
                camera.label.toLowerCase().includes('back') ||
                camera.label.toLowerCase().includes('rear') ||
                camera.label.toLowerCase().includes('trasera')
            );

            const preferredCamera = backCamera || cameraList[0];
            setSelectedCamera(preferredCamera);

            // Limpiar scanner anterior
            if (scannerRef.current) {
                scannerRef.current.destroy();
            }

            // Crear scanner - qr-scanner soporta QR y códigos de barras nativamente
            scannerRef.current = new QrScanner(
                videoRef.current,
                result => {
                    console.log('Código detectado:', result.data);
                    
                    // Pausar scanner inmediatamente
                    if (scannerRef.current) {
                        scannerRef.current.pause();
                        setIsScanning(false);
                    }

                    // Vibrar
                    if (navigator.vibrate) {
                        navigator.vibrate(200);
                    }

                    // Llamar callback
                    if (!loading) {
                        onScan(result.data);
                    }
                },
                {
                    returnDetailedScanResult: true,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    preferredCamera: preferredCamera?.id || 'environment'
                }
            );

            await scannerRef.current.start();
            setIsScanning(true);

            toast.current?.show({
                severity: 'success',
                summary: 'Scanner listo',
                detail: 'Cámara iniciada - Escanea QR o código de barras',
                life: 2000
            });

        } catch (error) {
            console.error('Error inicializando scanner:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo iniciar la cámara. Verifica los permisos.',
                life: 5000
            });
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
                severity: 'success',
                summary: 'Cámara cambiada',
                detail: nextCamera.label,
                life: 2000
            });
        } catch (error) {
            console.error('Error cambiando cámara:', error);
        }
    };

    const toggleFlash = async () => {
        if (!scannerRef.current) return;

        try {
            const hasFlash = await scannerRef.current.hasFlash();
            if (hasFlash) {
                const isOn = await scannerRef.current.isFlashOn();
                await scannerRef.current.turnFlashOnOff(!isOn);
            } else {
                toast.current?.show({
                    severity: 'info',
                    summary: 'Flash no disponible',
                    life: 2000
                });
            }
        } catch (error) {
            console.error('Error con flash:', error);
        }
    };

    const resumeScanner = async () => {
        if (scannerRef.current && !isScanning) {
            try {
                await scannerRef.current.start();
                setIsScanning(true);
            } catch (error) {
                console.error('Error reanudando:', error);
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

    return (
        <>
            <Toast ref={toast} />
            
            <Dialog
                header="Escáner QR / Código de Barras"
                visible={visible}
                onHide={handleHide}
                style={{ width: '95vw', maxWidth: '500px' }}
                modal
                footer={
                    <div className="flex justify-between gap-2 flex-wrap">
                        <div className="flex gap-2">
                            {cameras.length > 1 && (
                                <Button
                                    icon="pi pi-refresh"
                                    rounded
                                    outlined
                                    onClick={switchCamera}
                                    tooltip="Cambiar cámara"
                                />
                            )}
                            <Button
                                icon="pi pi-sun"
                                rounded
                                outlined
                                onClick={toggleFlash}
                                tooltip="Flash"
                            />
                            {!isScanning && (
                                <Button
                                    icon="pi pi-play"
                                    rounded
                                    severity="success"
                                    onClick={resumeScanner}
                                    tooltip="Reanudar"
                                />
                            )}
                        </div>
                        <Button
                            label="Cerrar"
                            icon="pi pi-times"
                            severity="secondary"
                            onClick={handleHide}
                        />
                    </div>
                }
            >
                <div className="text-center">
                    <video
                        ref={videoRef}
                        style={{
                            width: '100%',
                            maxHeight: '60vh',
                            backgroundColor: '#000',
                            borderRadius: '8px'
                        }}
                        playsInline
                    />
                    
                    <p className="mt-3 text-sm text-gray-600">
                        {isScanning 
                            ? '📷 Apunta hacia el código QR o código de barras'
                            : loading 
                                ? '⏳ Procesando...'
                                : '⏸️ Scanner pausado'
                        }
                    </p>

                    {loading && (
                        <div className="mt-2">
                            <i className="pi pi-spin pi-spinner text-2xl text-primary"></i>
                        </div>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default QRScanner;
