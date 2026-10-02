import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Flashlight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

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
          qrbox: { width: 260, height: 180 },
          aspectRatio: 1.333334
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

  return (
    <div className="low-stock-modal-backdrop">
      <div className="low-stock-modal-card" style={{ maxWidth: '420px', padding: '20px' }}>
        {/* Header */}
        <div className="low-stock-header">
          <div className="low-stock-header-main">
            <div className="low-stock-icon-badge" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
              <Camera size={24} />
            </div>
            <div>
              <h3 className="low-stock-title">{title}</h3>
              <p className="low-stock-subtitle">Point camera at product barcode or QR</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="low-stock-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', background: '#000', minHeight: '260px' }}>
          <div id={scannerContainerId} style={{ width: '100%', minHeight: '260px' }}></div>

          {/* Laser Line Scanning Animation */}
          {!scannerError && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #10b981, #34d399, transparent)',
                boxShadow: '0 0 10px #10b981',
                animation: 'scannerLaser 2s ease-in-out infinite alternate',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Success Overlay */}
          {lastScanned && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(16, 185, 129, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                padding: '16px',
                textAlign: 'center',
                zIndex: 10
              }}
            >
              <CheckCircle2 size={48} style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>Code Scanned!</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>{lastScanned}</div>
            </div>
          )}

          {/* Error Banner */}
          {scannerError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.92)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f8fafc',
                padding: '20px',
                textAlign: 'center',
                zIndex: 10
              }}
            >
              <AlertCircle size={40} color="#f43f5e" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '0.86rem', color: '#fca5a5', lineHeight: 1.4 }}>
                {scannerError}
              </div>
            </div>
          )}
        </div>

        {/* Controls Toolbar (Torch & Camera Switch) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={toggleTorch}
            className="low-stock-chip-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
          >
            <Flashlight size={16} color={torchOn ? '#f59e0b' : 'currentColor'} />
            <span>{torchOn ? 'Torch ON' : 'Torch OFF'}</span>
          </button>

          <button
            type="button"
            onClick={switchCamera}
            className="low-stock-chip-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
          >
            <RefreshCw size={16} />
            <span>Switch Camera</span>
          </button>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--md-on-surface-variant, #64748b)' }}>
          Supports Barcodes (EAN, UPC, Code 128) & QR Codes
        </div>
      </div>
    </div>
  );
}
