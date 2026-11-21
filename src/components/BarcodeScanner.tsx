import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, FileText, Flashlight, SwitchCamera, Loader2, ImagePlus, RefreshCw } from 'lucide-react';
import { extractIsbnsFromText, isValidIsbn10, isValidIsbn13 } from '../services/isbnExtractor';
import { toIsbn13 } from '../services/isbnApi';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export type ScanMode = 'barcode' | 'text_ocr';

const BOOK_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.ITF
];

function getValidIsbn(candidate: string): string | null {
  const fromText = extractIsbnsFromText(candidate)[0];
  if (fromText) return fromText;

  const cleaned = candidate.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (/^97[89]/.test(cleaned) && isValidIsbn13(cleaned)) return cleaned;
  if (isValidIsbn10(cleaned)) return toIsbn13(cleaned);
  return null;
}

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (!window.isSecureContext) {
    return 'Pro přístup ke kameře otevřete aplikaci přes zabezpečený odkaz HTTPS.';
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Tento prohlížeč nepodporuje přístup ke kameře. Použijte fotku čárového kódu nebo zadejte ISBN ručně.';
  }
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Prohlížeč nemá povolený přístup ke kameře. Povolte kameru v nastavení webu a zkuste to znovu.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Kamera nebyla nalezena. Můžete načíst fotku kódu nebo zadat ISBN ručně.';
  }
  return 'Kameru se nepodařilo spustit. Zkuste ji povolit v prohlížeči, načíst fotku kódu nebo zadat ISBN ručně.';
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanError }) => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barcodeScannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);
  const scanHandledRef = useRef(false);

  // Keep scanner callbacks stable while the parent form updates during a scan.
  onScanSuccessRef.current = onScanSuccess;
  onScanErrorRef.current = onScanError;

  const reportError = useCallback((message: string) => {
    setScannerError(message);
    onScanErrorRef.current?.(message);
  }, []);

  const handleValidIsbn = useCallback((isbn: string) => {
    if (scanHandledRef.current) return;
    scanHandledRef.current = true;
    setScannerError(null);
    onScanSuccessRef.current(isbn);
    setScannerStarted(false);
  }, []);

  const stopVideoStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  // Use the back camera by default and only decode book barcode formats.
  useEffect(() => {
    if (!scannerStarted || scanMode !== 'barcode') return;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    scanHandledRef.current = false;
    setScannerError(null);
    setHasTorch(false);
    setTorchOn(false);

    const startScanner = async () => {
      try {
        if (!window.isSecureContext) throw new Error('insecure-context');
        scanner = new Html5Qrcode('reader', { formatsToSupport: BOOK_BARCODE_FORMATS, verbose: false });
        barcodeScannerRef.current = scanner;
        await scanner.start(
          { facingMode: { ideal: facingMode } },
          {
            fps: 18,
            aspectRatio: 1.777,
            disableFlip: true,
            qrbox: (width, height) => {
              const boxWidth = Math.min(Math.round(width * 0.88), 440);
              const boxHeight = Math.min(Math.round(boxWidth * 0.46), Math.round(height * 0.72), 210);
              return { width: boxWidth, height: Math.max(boxHeight, 90) };
            }
          },
          (decodedText) => {
            const isbn = getValidIsbn(decodedText);
            if (isbn) handleValidIsbn(isbn);
          },
          () => {
            // A frame without a barcode is expected while the camera is searching.
          }
        );

        const capabilities = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & { torch?: boolean };
        setHasTorch(Boolean(capabilities?.torch));

        if (cancelled && scanner.isScanning) await scanner.stop();
      } catch (error) {
        if (!cancelled) {
          setScannerStarted(false);
          reportError(cameraErrorMessage(error));
        }
        if (scanner?.isScanning) {
          try { await scanner.stop(); } catch { /* scanner may already be stopping */ }
        }
        try { scanner?.clear(); } catch { /* the view may not have finished mounting */ }
      }
    };

    void startScanner();
    return () => {
      cancelled = true;
      if (scanner) {
        if (scanner.isScanning) {
          void scanner.stop().then(() => scanner?.clear()).catch(() => undefined);
        } else {
          try { scanner.clear(); } catch { /* already cleared */ }
        }
      }
      if (barcodeScannerRef.current === scanner) barcodeScannerRef.current = null;
    };
  }, [scannerStarted, scanMode, facingMode, handleValidIsbn, reportError]);

  // Separate camera stream for reading ISBN text when a barcode is unavailable.
  useEffect(() => {
    let cancelled = false;
    if (!scannerStarted || scanMode !== 'text_ocr') {
      stopVideoStream();
      return;
    }
    setHasTorch(false);
    setTorchOn(false);

    const startCamera = async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('camera-unavailable');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        setHasTorch(Boolean(capabilities?.torch));
        setScannerError(null);
      } catch (error) {
        if (!cancelled) reportError(cameraErrorMessage(error));
      }
    };

    void startCamera();
    return () => {
      cancelled = true;
      stopVideoStream();
    };
  }, [scannerStarted, scanMode, facingMode, stopVideoStream, reportError]);

  const toggleTorch = async () => {
    try {
      const next = !torchOn;
      const constraints = { advanced: [{ torch: next } as MediaTrackConstraintSet] };
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) await track.applyConstraints(constraints);
      else if (barcodeScannerRef.current?.isScanning) await barcodeScannerRef.current.applyVideoConstraints(constraints);
      else return;
      setTorchOn(next);
    } catch {
      reportError('Svítilna není dostupná na tomto telefonu.');
    }
  };

  const toggleCamera = () => setFacingMode(current => current === 'environment' ? 'user' : 'environment');

  const recognizeImageText = async (image: File | HTMLCanvasElement): Promise<string | null> => {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    try {
      const result = await worker.recognize(image);
      return extractIsbnsFromText(result.data.text)[0] ?? null;
    } finally {
      await worker.terminate();
    }
  };

  const captureAndRecognizeIsbn = async () => {
    const video = videoRef.current;
    if (!video || isOcrProcessing) return;
    if (!video.videoWidth || !video.videoHeight) {
      reportError('Kamera se ještě spouští. Zkuste to prosím za chvilku.');
      return;
    }

    setIsOcrProcessing(true);
    setOcrStatus('Rozpoznávám vytištěné ISBN…');
    setScannerError(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const isbn = await recognizeImageText(canvas);
      if (isbn) handleValidIsbn(isbn);
      else reportError('ISBN se nepodařilo přečíst. Zkuste lepší světlo, přiblížení nebo načtěte fotku či zadejte kód ručně.');
    } catch {
      reportError('Čtení textu se nezdařilo. Zkuste znovu nebo použijte ruční zadání ISBN.');
    } finally {
      setIsOcrProcessing(false);
      setOcrStatus('');
    }
  };

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    event.target.value = '';
    if (!image) return;

    scanHandledRef.current = false;
    setIsOcrProcessing(true);
    setScannerError(null);
    setOcrStatus('Hledám ISBN na fotce…');
    let fileScanner: Html5Qrcode | null = null;
    try {
      // A captured photo can decode the barcode even when live camera access is blocked.
      fileScanner = new Html5Qrcode('isbn-file-reader', { formatsToSupport: BOOK_BARCODE_FORMATS, verbose: false });
      const decoded = await fileScanner.scanFile(image, false);
      const barcodeIsbn = getValidIsbn(decoded);
      if (barcodeIsbn) {
        handleValidIsbn(barcodeIsbn);
        setIsOcrProcessing(false);
        setOcrStatus('');
        return;
      }
    } catch {
      // If there is no readable barcode, try the printed ISBN text below.
    } finally {
      try { fileScanner?.clear(); } catch { /* no camera was started */ }
    }

    try {
      setOcrStatus('Čtu vytištěný text ISBN…');
      const textIsbn = await recognizeImageText(image);
      if (textIsbn) handleValidIsbn(textIsbn);
      else reportError('Na fotce se nenašel čitelný kód ani platné ISBN. Zkuste jiný úhel nebo zadejte ISBN ručně.');
    } catch {
      reportError('Fotku se nepodařilo zpracovat. Zadejte prosím ISBN ručně.');
    } finally {
      setIsOcrProcessing(false);
      setOcrStatus('');
    }
  };

  const handleStopScanning = () => {
    setScannerStarted(false);
    setScannerError(null);
    setTorchOn(false);
    setHasTorch(false);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm text-center">
      <div id="isbn-file-reader" className="absolute left-0 top-0 h-px w-px overflow-hidden opacity-0 pointer-events-none" aria-hidden="true" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelected}
        className="sr-only"
        aria-label="Vybrat fotku čárového kódu nebo ISBN"
      />

      <div className="flex bg-gray-100 p-1 rounded-xl mb-4 text-[11px] sm:text-xs font-bold">
        <button
          type="button"
          onClick={() => { setScanMode('barcode'); setScannerError(null); }}
          className={`flex-1 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${scanMode === 'barcode' ? 'bg-white text-[#800020] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <Camera className="w-4 h-4" /><span>Čárový kód</span>
        </button>
        <button
          type="button"
          onClick={() => { setScanMode('text_ocr'); setScannerError(null); }}
          className={`flex-1 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${scanMode === 'text_ocr' ? 'bg-white text-[#800020] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <FileText className="w-4 h-4" /><span>Vytištěné ISBN</span>
        </button>
      </div>

      {!scannerStarted ? (
        <div className="py-3 sm:py-5 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center">
            {scanMode === 'barcode' ? <Camera className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{scanMode === 'barcode' ? 'Naskenujte knihu' : 'Přečtěte ISBN z tiráže'}</h3>
            <p className="text-xs text-gray-500 max-w-xs mt-1 mx-auto leading-relaxed">
              {scanMode === 'barcode'
                ? 'Zamiřte zadní kamerou na čárový kód EAN/ISBN. Kód se načte automaticky.'
                : 'Zamiřte kamerou na vytištěné číslo ISBN-10 nebo ISBN-13 a vyfoťte ho.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { scanHandledRef.current = false; setScannerError(null); setScannerStarted(true); }}
            className="w-full sm:w-auto px-6 py-3 bg-[#800020] hover:bg-[#660019] text-white text-sm font-bold rounded-xl shadow transition flex items-center justify-center gap-2 active:scale-[.98]"
          >
            <Camera className="w-4 h-4" /> Spustit zadní kameru
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isOcrProcessing}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 hover:border-[#800020] hover:text-[#800020] disabled:opacity-50 text-gray-700 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {isOcrProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {isOcrProcessing ? (ocrStatus || 'Zpracovávám fotku…') : 'Vyfotit nebo vybrat fotku'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              {scanMode === 'barcode' ? 'Hledám čárový kód…' : 'Kamera pro vytištěné ISBN'}
            </span>
            <div className="flex items-center gap-2">
              {hasTorch && (
                <button type="button" onClick={toggleTorch} className={`p-2 rounded-lg border ${torchOn ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-gray-100 text-gray-600 border-gray-200'}`} title="Svítilna">
                  <Flashlight className="w-4 h-4" />
                </button>
              )}
              <button type="button" onClick={toggleCamera} className="p-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-700" title="Přepnout přední/zadní kameru">
                <SwitchCamera className="w-4 h-4" />
              </button>
              <button type="button" onClick={handleStopScanning} className="text-xs text-red-700 font-bold px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50">Zrušit</button>
            </div>
          </div>

          {scanMode === 'barcode' ? (
            <div className="relative overflow-hidden rounded-xl bg-black">
              <div id="reader" className="w-full min-h-[220px] sm:min-h-[280px]" />
              {scannerError && <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-3 p-5">
                <p className="text-sm text-amber-900 font-medium">{scannerError}</p>
                <button type="button" onClick={() => { scanHandledRef.current = false; setScannerError(null); setScannerStarted(false); window.setTimeout(() => setScannerStarted(true), 0); }} className="px-4 py-2 bg-[#800020] text-white rounded-lg text-sm font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4" />Zkusit znovu</button>
              </div>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-x-7 top-1/3 bottom-1/3 border-2 border-dashed border-rose-400 bg-rose-500/10 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="bg-black/70 text-white text-[11px] px-2 py-1 rounded-full font-bold">Zaměřte ISBN do rámečku</span>
                </div>
                {isOcrProcessing && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2 p-4"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /><p className="text-sm font-bold">{ocrStatus || 'Zpracovávám…'}</p></div>}
              </div>
              {scannerError && <p className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs text-left">{scannerError}</p>}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={isOcrProcessing} onClick={captureAndRecognizeIsbn} className="py-3 bg-[#800020] hover:bg-[#660019] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                  {isOcrProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {isOcrProcessing ? 'Čtu ISBN…' : 'Vyfotit a přečíst'}
                </button>
                <button type="button" disabled={isOcrProcessing} onClick={() => fileInputRef.current?.click()} className="py-3 border border-gray-300 hover:border-[#800020] text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2"><ImagePlus className="w-4 h-4" />Použít fotku</button>
              </div>
            </div>
          )}
        </div>
      )}

      {!scannerStarted && scannerError && <p role="alert" className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs text-left">{scannerError}</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-gray-500">Když kamera nefunguje, vyberte fotku obálky nebo kódu, případně zadejte ISBN ručně vedle skeneru.</p>
    </div>
  );
};
