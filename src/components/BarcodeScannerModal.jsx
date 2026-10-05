import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Flashlight, RefreshCw, CheckCircle2, AlertCircle, ScanLine } from 'lucide-react';
import { useBackHandler } from '../utils/navigationManager';

/**
 * Play a crisp barcode scanner beep via Web Audio API
 */
function playBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch supermarket beep
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Ignore audio context autoplay errors
  }
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan, title = 'Scan Barcode / QR Code' }) {
  const [scannerError, setScannerError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera
  const [lastScanned, setLastScanned] = useState(null);
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'billie-barcode-reader';

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setScannerError(null);
    setLastScanned(null);

    const initScanner = async () => {
      try {
        const qrCode = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX
          ],
          verbose: false
        });
        html5QrCodeRef.current = qrCode;

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 180 },
          aspectRatio: 1.25
        };

        await qrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            if (!isMounted) return;
            playBeep();
            setLastScanned(decodedText);
            
            // Short delay to show scan success animation before calling onScan
            setTimeout(() => {
              if (onScan) onScan(decodedText);
              handleClose();
            }, 300);
          },
          (errorMessage) => {
            // Frame parse errors are normal while searching
          }
        );
      } catch (err) {
        console.error('[Scanner] Camera start error:', err);
        if (isMounted) {
          setScannerError(
            err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access in your browser or app settings.'
              : 'Could not access camera. Please make sure no other app is using it.'
          );
        }
      }
    };

    // Small delay to ensure DOM element is mounted
    const timer = setTimeout(initScanner, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('[Scanner] Stop error:', e);
      }
    }
    html5QrCodeRef.current = null;
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  // Close scanner on device back button press
  useBackHandler('barcode-scanner-modal', isOpen, handleClose, 30);

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) return;
    try {
      const nextState = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('[Scanner] Torch error:', e);
    }
  };

  const switchCamera = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="m3-barcode-scanner-backdrop animate-fade-in" onClick={handleClose}>
      <div 
        className="m3-barcode-scanner-card animate-scale-up" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="m3-barcode-scanner-header">
          <div className="m3-scanner-header-lead">
            <div className="m3-scanner-badge">
              <Camera size={22} />
            </div>
            <div>
              <h3 className="m3-scanner-title">{title}</h3>
              <p className="m3-scanner-subtitle">Align barcode or QR code within frame</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleClose} 
            className="m3-scanner-close-btn m3-ripple"
            aria-label="Close scanner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center Viewfinder Container with Reticle */}
        <div className="m3-scanner-viewfinder">
          <div id={scannerContainerId} className="m3-scanner-html5-feed"></div>

          {/* Aiming Reticle Corners */}
          <div className="m3-reticle-corner top-left"></div>
          <div className="m3-reticle-corner top-right"></div>
          <div className="m3-reticle-corner bottom-left"></div>
          <div className="m3-reticle-corner bottom-right"></div>

          {/* Laser Line Scanning Animation */}
          {!scannerError && !lastScanned && (
            <div className="m3-scanner-laser-line" />
          )}

          {/* Center alignment guide text */}
          {!scannerError && !lastScanned && (
            <div className="m3-scanner-frame-hint">
              <ScanLine size={14} />
              <span>Scanning automatically...</span>
            </div>
          )}

          {/* Success Overlay */}
          {lastScanned && (
            <div className="m3-scanner-success-overlay animate-scale-up">
              <CheckCircle2 size={44} className="mb-2 text-white" />
              <div className="font-extrabold text-base text-white">Product Scanned!</div>
              <div className="text-xs text-white/90 font-mono mt-1 px-3 py-1 bg-black/30 rounded-lg">{lastScanned}</div>
            </div>
          )}

          {/* Error Banner */}
          {scannerError && (
            <div className="m3-scanner-error-overlay animate-fade-in">
              <AlertCircle size={36} color="#f43f5e" className="mb-2" />
              <div className="text-xs text-rose-200 leading-relaxed text-center">
                {scannerError}
              </div>
            </div>
          )}
        </div>

        {/* Controls Toolbar (Torch & Camera Switch) */}
        <div className="m3-scanner-toolbar">
          <button
            type="button"
            onClick={toggleTorch}
            className={`m3-scanner-tool-btn ${torchOn ? 'active' : ''}`}
          >
            <Flashlight size={16} color={torchOn ? '#f59e0b' : 'currentColor'} />
            <span>{torchOn ? 'Torch ON' : 'Torch OFF'}</span>
          </button>

          <button
            type="button"
            onClick={switchCamera}
            className="m3-scanner-tool-btn"
          >
            <RefreshCw size={16} />
            <span>Switch Camera</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="m3-scanner-footer-note">
          Supports 1D Barcodes (EAN, UPC, Code 128) & 2D QR Codes
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

