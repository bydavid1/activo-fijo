import React, { useRef, useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

const QRBarcodeScanner = ({ visible, onHide, onScan, loading = false }) => {
    const scannerRef = useRef(null);
    const scannerElementRef = useRef(null);
    const toast = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (visible && !isInitialized && scannerElementRef.current) {
            initializeScanner();
        }

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (error) {
                    console.log('Scanner ya estaba limpio');
                }
                scannerRef.current = null;
                setIsInitialized(false);
            }
        };
    }, [visible]);

    const initializeScanner = () => {
        try {
            const config = {
                fps: 10,
                qrbox: { width: 300, height: 200 }, // Región más amplia para códigos de barras
                aspectRatio: 1.7,
                disableFlip: false,
                // Formatos soportados - incluye QR y códigos de barras
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93,
                    Html5QrcodeSupportedFormats.CODABAR,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.DATA_MATRIX
                ]
            };

            scannerRef.current = new Html5QrcodeScanner(
                "qr-barcode-scanner",
                config,
                false // verbose
            );

            scannerRef.current.render(
                (decodedText, decodedResult) => {
                    console.log('Código detectado:', decodedText, 'Tipo:', decodedResult?.result?.format);

                    // Pausar scanner después de detección
                    if (scannerRef.current) {
                        scannerRef.current.pause(true);
                    }

                    // Vibrar si está disponible
                    if (navigator.vibrate) {
                        navigator.vibrate(200);
                    }

                    // Procesar solo si no estamos ya procesando
                    if (!loading) {
                        onScan(decodedText);
                    }
                },
                (errorMessage) => {
                    // Error de escaneo - no hacer nada, es normal
                    // console.log('Error scanning:', errorMessage);
                }
            );

            setIsInitialized(true);

            toast.current?.show({
                severity: 'success',
                summary: 'Scanner listo',
                detail: 'Scanner de QR y códigos de barras iniciado',
                life: 2000
            });

        } catch (error) {
            console.error('Error inicializando scanner:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo inicializar el scanner',
                life: 4000
            });
        }
    };

    const resumeScanner = () => {
        if (scannerRef.current && isInitialized) {
            try {
                scannerRef.current.resume();
                console.log('Scanner reanudado');
            } catch (error) {
                console.error('Error reanudando scanner:', error);
            }
        }
    };

    // Efecto para reanudar el scanner cuando loading cambia de true a false
    const prevLoadingRef = useRef(loading);
    useEffect(() => {
        if (prevLoadingRef.current === true && loading === false && isInitialized) {
            console.log('Loading terminó, reanudando scanner...');
            setTimeout(() => {
                resumeScanner();
            }, 500); // Pequeño delay para asegurar que el procesamiento terminó
        }
        prevLoadingRef.current = loading;
    }, [loading, isInitialized]);

    const footerContent = (
        <div className="flex justify-end gap-2">
            <Button
                label="Cerrar"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-secondary"
            />
            <Button
                label="Reanudar Scanner"
                icon="pi pi-play"
                onClick={resumeScanner}
                disabled={loading || !isInitialized}
                className="p-button-success"
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                onHide={onHide}
                header="Scanner QR y Códigos de Barras"
                modal
                style={{ width: '90vw', maxWidth: '500px' }}
                footer={footerContent}
                draggable={false}
                resizable={false}
            >
                <div className="text-center p-4">
                    <p className="mb-4 text-gray-600">
                        Enfoca el código QR o código de barras dentro del recuadro
                    </p>

                    {/* Contenedor para el scanner */}
                    <div
                        id="qr-barcode-scanner"
                        ref={scannerElementRef}
                        style={{
                            width: '100%',
                            minHeight: '300px'
                        }}
                    />

                    {loading && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <i className="pi pi-spin pi-spinner mr-2"></i>
                            Procesando código...
                        </div>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default QRBarcodeScanner;
