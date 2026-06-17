import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Printer, X } from 'lucide-react';

interface QRCodePrintProps {
  trackingNo: string;
  sampleName: string;
  onClose: () => void;
}

export const QRCodePrint: React.FC<QRCodePrintProps> = ({
  trackingNo,
  sampleName,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>样品标签 - ${trackingNo}</title>
          <style>
            @page { size: 60mm 40mm; margin: 2mm; }
            body { font-family: 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; }
            .label { width: 56mm; height: 36mm; padding: 2mm; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .tracking-no { font-size: 12px; font-weight: bold; margin-bottom: 2mm; }
            .qr-container { margin-bottom: 2mm; }
            .sample-name { font-size: 10px; text-align: center; max-width: 100%; overflow: hidden; }
            .date { font-size: 8px; color: #666; margin-top: 1mm; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[420px] animate-slide-in-right">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-800">样品标签打印</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div
            ref={printRef}
            className="label border-2 border-dashed border-neutral-300 rounded-lg p-4 w-[220px] h-[160px] flex flex-col items-center justify-center bg-white"
          >
            <div className="tracking-no text-sm font-bold text-neutral-800 mb-2">
              {trackingNo}
            </div>
            <div className="qr-container mb-2">
              <QRCodeCanvas
                value={trackingNo}
                size={80}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="sample-name text-xs text-neutral-700 text-center max-w-full overflow-hidden">
              {sampleName}
            </div>
            <div className="date text-[10px] text-neutral-400 mt-1">
              {new Date().toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Printer size={18} />
            <span>打印标签</span>
          </button>
        </div>
      </div>
    </div>
  );
};
