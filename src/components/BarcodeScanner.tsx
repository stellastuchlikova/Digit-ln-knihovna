import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, FileText, Flashlight, SwitchCamera, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { extractIsbnsFromText } from '../services/isbnExtractor';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export type ScanMode = 'barcode' | 'text_ocr';

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess }) => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Video stream state for OCR mode
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraReloadKey, setCameraReloadKey] = useState(0);

  const barcodeScannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Start Barcode Scanner (html5-qrcode)
  useEffect(() => {
    if (scannerStarted && scanMode === 'barcode') {
      const scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true
        },
        false
      );

      barcodeScannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          onScanSuccess(decodedText);
          scanner.clear().catch(console.error);
          setScannerStarted(false);
        },
        () => {
          // ignore frame scan misses
        }
      );

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [scannerStarted, scanMode, onScanSuccess]);

  // Clean up media streams
  const stopVideoStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (scannerStarted && scanMode === 'text_ocr') {
      const initCamera = async () => {
        stopVideoStream();
        try {
          const constraints: MediaStreamConstraints = {
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
          }

          // Check torch support
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities?.() as any;
          setHasTorch(Boolean(capabilities && capabilities.torch));
        } catch (err: any) {
          console.error('Chyba při přístupu k fotoaparátu:', err);
          if (isMounted) {
            setOcrError('Nepodařilo se spustit fotoaparát pro čtení textu. Zkontrolujte oprávnění kamery v prohlížeči.');
          }
        }
      };

      initCamera();
    } else {
      stopVideoStream();
    }

    return () => {
      isMounted = false;
      stopVideoStream();
    };
  }, [scannerStarted, scanMode, facingMode, cameraReloadKey, stopVideoStream]);

  // Toggle Torch on supported devices
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const newTorchState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newTorchState }]
      });
      setTorchOn(newTorchState);
    } catch (err) {
      console.warn('Torch not supported or failed:', err);
    }
  };

  // Flip Camera between back and front
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  // Capture frame and run OCR with Tesseract
  const captureAndRecognizeIsbn = async () => {
    if (!videoRef.current || isOcrProcessing) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setOcrError('Fotoaparát se ještě plně neinicializoval. Zkuste to za sekundu.');
      return;
    }

    setIsOcrProcessing(true);
    setOcrStatus('Zachycuji snímek...');
    setOcrError(null);

    try {
      // Create canvas to capture cropped middle region where ISBN is likely positioned
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
      }

      setOcrStatus('Rozpoznávám text ISBN z fotky...');

      // Dynamic import to keep main bundle light
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');

      setOcrStatus('Analyzuji znaky...');
      const ret = await worker.recognize(canvas);
      const recognizedText = ret.data.text;
      await worker.terminate();

      setOcrStatus('Vyhledávám kód ISBN...');
      const extracted = extractIsbnsFromText(recognizedText);

      if (extracted.length > 0) {
        setOcrStatus(`Nalezeno ISBN: ${extracted[0]}!`);
        setTimeout(() => {
          stopVideoStream();
          setScannerStarted(false);
          onScanSuccess(extracted[0]);
        }, 300);
      } else {
        setOcrError(
          'ISBN nebylo na snímku zřetelně rozpoznáno. Zkuste přiblížit text "ISBN", zaostřit nebo použít svítilnu.'
        );
      }
    } catch (err: any) {
      console.error('Chyba OCR:', err);
      setOcrError('Došlo k chybě při rozpoznávání textu. Zkuste to prosím znovu.');
    } finally {
      setIsOcrProcessing(false);
      setOcrStatus('');
    }
  };

  const handleStopScanning = () => {
    if (barcodeScannerRef.current) {
      barcodeScannerRef.current.clear().catch(console.error);
    }
    stopVideoStream();
    setScannerStarted(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
      {/* Mode Switcher Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            if (scannerStarted && scanMode !== 'barcode') {
              stopVideoStream();
            }
            setScanMode('barcode');
          }}
          className={`flex-1 py-2 rounded-lg transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
            scanMode === 'barcode'
              ? 'bg-white text-[#800020] shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Čárový kód (EAN/ISBN)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (scannerStarted && scanMode !== 'text_ocr') {
              if (barcodeScannerRef.current) {
                barcodeScannerRef.current.clear().catch(console.error);
              }
            }
            setScanMode('text_ocr');
          }}
          className={`flex-1 py-2 rounded-lg transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
            scanMode === 'text_ocr'
              ? 'bg-white text-[#800020] shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Čtení ISBN bez kódu (Text / OCR)</span>
        </button>
      </div>

      {!scannerStarted ? (
        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center shadow-inner">
            {scanMode === 'barcode' ? (
              <Camera className="w-8 h-8" />
            ) : (
              <FileText className="w-8 h-8" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {scanMode === 'barcode'
                ? 'Skenování čárového kódu knihy'
                : 'Čtení vytištěného ISBN textu (bez kódu)'}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mt-1 mx-auto leading-relaxed">
              {scanMode === 'barcode'
                ? 'Naměřte fotoaparát na čárový kód (EAN/ISBN) na zadní straně knihy.'
                : 'Naměřte fotoaparát na vytištěný text "ISBN: 978-..." v tiráži nebo na zadní straně.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScannerStarted(true)}
            className="px-6 py-2.5 bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold rounded-xl shadow transition duration-150 flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Spustit mobilní fotoaparát</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header Controls */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-700 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse inline-block mr-1"></span>
              <span>{scanMode === 'barcode' ? 'Skenování čárového kódu' : 'Čtení textu ISBN'}</span>
            </span>

            <div className="flex items-center space-x-2">
              {scanMode === 'text_ocr' && hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 cursor-pointer ${
                    torchOn ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                  title="Svítilna"
                >
                  <Flashlight className="w-3.5 h-3.5" />
                </button>
              )}

              {scanMode === 'text_ocr' && (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  title="Přepnout přední/zadní kameru"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleStopScanning}
                className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded-lg border border-red-200 hover:bg-red-50 cursor-pointer"
              >
                Zrušit
              </button>
            </div>
          </div>

          {/* Barcode Mode Container */}
          {scanMode === 'barcode' && (
            <div id="reader" className="w-full overflow-hidden rounded-xl bg-black min-h-[240px]"></div>
          )}

          {/* Text OCR Mode Video Stream */}
          {scanMode === 'text_ocr' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Target box guide */}
                <div className="absolute inset-x-8 top-1/3 bottom-1/3 border-2 border-dashed border-rose-400 bg-rose-500/10 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                    <Sparkles className="w-2.5 h-2.5 text-rose-300" />
                    <span>Zamiřte na text "ISBN 978..."</span>
                  </div>
                </div>

                {isOcrProcessing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 p-4">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                    <p className="text-xs font-bold">{ocrStatus || 'Zpracovávám text...'}</p>
                  </div>
                )}
              </div>

              {ocrError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium text-left">
                  {ocrError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isOcrProcessing}
                  onClick={captureAndRecognizeIsbn}
                  className="flex-1 py-3 bg-[#800020] hover:bg-[#660019] disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow transition duration-150 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  {isOcrProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Čtu text...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Vyfotit a přečíst ISBN</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCameraReloadKey(k => k + 1)}
                  disabled={isOcrProcessing}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-300 cursor-pointer"
                  title="Obnovit fotoaparát"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
