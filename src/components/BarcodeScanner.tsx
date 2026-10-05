import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess }) => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scannerStarted) {
      // Initialize scanner after element is in DOM
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          supportedScanTypes: [
            Html5QrcodeScanType.SCAN_TYPE_CAMERA
          ],
          rememberLastUsedCamera: true
        },
        /* verbose= */ false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // Success
          onScanSuccess(decodedText);
          // Stop scanning after successful detection
          scanner.clear().catch(console.error);
          setScannerStarted(false);
        },
        (_errorMessage) => {
          // Scan errors happen on every frame when barcode is not found, ignore
        }
      );

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [scannerStarted, onScanSuccess]);

  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
      {!scannerStarted ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-wine-50 text-[#800020] flex items-center justify-center">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Skenování čárového kódu knihy</h3>
            <p className="text-sm text-gray-500 max-w-xs mt-1">
              Naměřte fotoaparát na čárový kód (EAN/ISBN) na zadní straně knihy.
            </p>
          </div>
          <button
            onClick={() => setScannerStarted(true)}
            className="px-6 py-2.5 bg-[#800020] hover:bg-[#660019] text-white font-medium rounded-lg shadow transition duration-150 flex items-center space-x-2 cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            <span>Spustit fotoaparát</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-3 px-2">
            <span className="text-sm font-medium text-gray-700">Aktivní skener čárových kódů</span>
            <button
              onClick={() => {
                if (scannerRef.current) {
                  scannerRef.current.clear().catch(console.error);
                }
                setScannerStarted(false);
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded border border-red-200 hover:bg-red-50 cursor-pointer"
            >
              Zrušit skenování
            </button>
          </div>
          <div id="reader" className="w-full overflow-hidden rounded-lg bg-black"></div>
        </div>
      )}
    </div>
  );
};
