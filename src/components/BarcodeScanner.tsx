import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess }) => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'https' | 'notfound' | 'general' | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Check if secure context (HTTPS or localhost)
  const isSecureContext = window.isSecureContext ?? (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const startCamera = async () => {
    setErrorMessage(null);
    setErrorType(null);
    setIsInitializing(true);

    if (!isSecureContext) {
      setErrorMessage('Prohlížeč blokuje fotoaparát, protože stránka nebyla načtena přes zabezpečené HTTPS rozhraní.');
      setErrorType('https');
      setIsInitializing(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Váš prohlížeč nebo zařízení nepodporuje přístup k fotoaparátu.');
      setErrorType('general');
      setIsInitializing(false);
      return;
    }

    try {
      // 1. Explicitly request camera permission to trigger browser prompt and test availability
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      // Immediately stop the stream track after permission grant so Html5Qrcode can bind to it
      stream.getTracks().forEach(track => track.stop());

      setScannerStarted(true);
    } catch (err: unknown) {
      console.error('Camera permission/access error:', err);
      setIsInitializing(false);

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorType('permission');
          setErrorMessage('Přístup k fotoaparátu byl zamítnut. Povolte prosím přístup k fotoaparátu v nastavení prohlížeče (ikona zámku u adresního řádku).');
          return;
        }
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorType('notfound');
          setErrorMessage('Nebyl nalezen žádný dostupný fotoaparát nebo kamera na vašem zařízení.');
          return;
        }
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setErrorType('general');
          setErrorMessage('Fotoaparát je momentálně používán jinou aplikací nebo se ho nepodařilo spustit.');
          return;
        }
      }

      setErrorType('general');
      setErrorMessage('Nepodařilo se spustit fotoaparát. Zkontrolujte oprávnění v prohlížeči.');
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (scannerStarted) {
      const html5Qrcode = new Html5Qrcode("reader");
      html5QrcodeRef.current = html5Qrcode;

      const config = {
        fps: 10,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.333333
      };

      html5Qrcode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (isMounted) {
            onScanSuccess(decodedText);
            html5Qrcode.stop().then(() => {
              html5Qrcode.clear();
            }).catch(console.error);
            setScannerStarted(false);
            setIsInitializing(false);
          }
        },
        (_scanError) => {
          // Ignore repeated scan errors per frame
        }
      ).then(() => {
        if (isMounted) {
          setIsInitializing(false);
        }
      }).catch((err) => {
        console.error("Html5Qrcode start failed:", err);
        if (isMounted) {
          setScannerStarted(false);
          setIsInitializing(false);
          setErrorType('general');
          setErrorMessage('Nepodařilo se zahájit snímání čárového kódu. Zkuste obnovit stránku.');
        }
      });
    }

    return () => {
      isMounted = false;
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().then(() => {
          html5QrcodeRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, [scannerStarted, onScanSuccess]);

  const stopScanner = () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      html5QrcodeRef.current.stop().then(() => {
        html5QrcodeRef.current?.clear();
        setScannerStarted(false);
        setIsInitializing(false);
      }).catch(console.error);
    } else {
      setScannerStarted(false);
      setIsInitializing(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-center">
      {!scannerStarted ? (
        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#800020]/10 text-[#800020] flex items-center justify-center shadow-inner">
            <Camera className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900">Skenování čárového kódu knihy</h3>
            <p className="text-sm text-gray-500 max-w-xs mt-1">
              Naměřte fotoaparát na čárový kód (EAN/ISBN) na zadní straně knihy.
            </p>
          </div>

          {errorMessage && (
            <div className="w-full p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl text-left space-y-2 animate-fade-in">
              <div className="flex items-start space-x-2.5">
                {errorType === 'https' ? (
                  <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold text-red-800">Chyba spuštění fotoaparátu</p>
                  <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>

              {errorType === 'permission' && (
                <div className="bg-white/80 p-3 rounded-lg border border-red-100 text-xs text-gray-700 space-y-1.5 mt-2">
                  <p className="font-semibold text-gray-900">Jak povolit fotoaparát v prohlížeči:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Klikněte na ikonu 🔒 nebo nastavení v adresním řádku prohlížeče nahoře.</li>
                    <li>Najděte položku <strong>Fotoaparát / Kamera</strong> a změňte ji na <strong>Povolit</strong>.</li>
                    <li>Obnovte stránku (F5 nebo tlačítkem Obnovit).</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={startCamera}
            disabled={isInitializing}
            className="px-6 py-3 bg-[#800020] hover:bg-[#660019] active:scale-95 disabled:opacity-50 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center space-x-2.5 cursor-pointer"
          >
            {isInitializing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Příprava fotoaparátu...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>Spustit fotoaparát</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fotoaparát aktivní</span>
            </span>
            <button
              type="button"
              onClick={stopScanner}
              className="text-xs text-red-600 hover:text-red-800 font-semibold px-2.5 py-1 rounded-md border border-red-200 hover:bg-red-50 cursor-pointer transition-colors"
            >
              Zrušit skenování
            </button>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-black border border-gray-800 min-h-[260px] flex items-center justify-center">
            {isInitializing && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 text-white space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-[#800020]" />
                <span className="text-xs font-medium">Načítání hledáčku...</span>
              </div>
            )}
            <div id="reader" className="w-full"></div>
          </div>

          <p className="text-xs text-gray-500">
            Namiřte kameru tak, aby čárový kód ležel uvnitř vyznačeného pole.
          </p>
        </div>
      )}
    </div>
  );
};
