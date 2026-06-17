import { useState, useEffect, useCallback, useRef } from 'react';

export function useScanInput(onScan?: (code: string) => void) {
  const [scannedCode, setScannedCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const now = Date.now();
    const timeDiff = now - lastKeyTimeRef.current;
    
    if (timeDiff > 100) {
      bufferRef.current = '';
    }
    
    lastKeyTimeRef.current = now;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (bufferRef.current.length > 0) {
        const code = bufferRef.current;
        setScannedCode(code);
        bufferRef.current = '';
        setIsScanning(false);
        if (onScan) {
          onScan(code);
        }
      }
    } else if (e.key.length === 1) {
      if (timeDiff <= 100) {
        setIsScanning(true);
      }
      bufferRef.current += e.key;
    }
  }, [onScan]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const clearCode = useCallback(() => {
    setScannedCode('');
    bufferRef.current = '';
  }, []);

  return {
    scannedCode,
    isScanning,
    clearCode,
    setScannedCode,
  };
}
