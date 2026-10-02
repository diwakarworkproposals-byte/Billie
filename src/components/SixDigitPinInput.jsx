import React, { useRef, useEffect } from 'react';

/**
 * 6-Digit PIN Input component with auto-focus, backspace, and paste support
 */
export default function SixDigitPinInput({
  value = '',
  onChange,
  masked = true,
  disabled = false,
  error = false,
  autoFocus = false
}) {
  const inputRefs = useRef([]);

  // Ensure digits array has 6 items
  const digits = Array(6)
    .fill('')
    .map((_, i) => (value && value[i] ? value[i] : ''));

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (newDigits[idx]) {
        newDigits[idx] = '';
        onChange(newDigits.join(''));
      } else if (idx > 0) {
        newDigits[idx - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;

    // Handle paste or single digit
    const newDigits = [...digits];
    if (val.length > 1) {
      // Pasted full or partial PIN
      const chars = val.slice(0, 6).split('');
      chars.forEach((ch, cIdx) => {
        if (idx + cIdx < 6) {
          newDigits[idx + cIdx] = ch;
        }
      });
      onChange(newDigits.join(''));
      const nextFocus = Math.min(5, idx + chars.length);
      inputRefs.current[nextFocus]?.focus();
    } else {
      // Single digit input
      newDigits[idx] = val;
      onChange(newDigits.join(''));
      if (idx < 5) {
        inputRefs.current[idx + 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIdx = Math.min(5, pasted.length);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="six-pin-container" onPaste={handlePaste}>
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type={masked ? 'password' : 'text'}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onChange={(e) => handleChange(e, idx)}
          className={`six-pin-box ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
          aria-label={`PIN Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
}
