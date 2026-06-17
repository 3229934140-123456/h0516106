import React, { useEffect } from 'react';
import { Scan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScanInput } from '@/hooks/useScanInput';

interface InputWithScanProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onScan?: (code: string) => void;
  onScanComplete?: (code: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export const InputWithScan: React.FC<InputWithScanProps> = ({
  value,
  onChange,
  placeholder = '扫码或手动输入',
  className,
  onScan,
  onScanComplete,
  label,
  required = false,
  error,
}) => {
  const { scannedCode, isScanning, clearCode } = useScanInput((code) => {
    onChange(code);
    onScan?.(code);
    onScanComplete?.(code);
  });

  useEffect(() => {
    if (scannedCode && scannedCode !== value) {
      onChange(scannedCode);
      onScanComplete?.(scannedCode);
    }
  }, [scannedCode, value, onChange, onScanComplete]);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            clearCode();
          }}
          placeholder={placeholder}
          className={cn(
            'w-full pl-4 pr-12 py-2.5 border rounded-lg text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-all duration-200',
            isScanning && 'border-primary-500 bg-primary-50',
            error ? 'border-danger-500' : 'border-neutral-300',
            className
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Scan
            size={18}
            className={cn(
              'transition-colors',
              isScanning ? 'text-primary-500 animate-pulse' : 'text-neutral-400'
            )}
          />
        </div>
      </div>
      {isScanning && (
        <p className="text-xs text-primary-500 animate-pulse">正在识别条码...</p>
      )}
      {error && (
        <p className="text-xs text-danger-500">{error}</p>
      )}
    </div>
  );
};
