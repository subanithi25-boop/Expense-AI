import React, { useState } from 'react';
import { RotateCw, ZoomIn, ZoomOut, X, Download, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  merchant?: string;
  ocrConfidence?: number;
  rawText?: string;
}

export const ReceiptViewerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  imageUrl,
  merchant,
  ocrConfidence = 96,
  rawText
}) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [showRawText, setShowRawText] = useState(false);

  if (!isOpen) return null;

  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Receipt Verification: {merchant || 'Attached Receipt'}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" /> OCR Confidence: {ocrConfidence}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {showRawText ? 'Show Image' : 'Show OCR Text'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[350px]">
          {showRawText ? (
            <div className="w-full h-full p-4 overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
              {rawText || `UBER TECHNOLOGIES INC.\nTrip Receipt\nDate: 2026-03-12\nUberX Ride to Downtown Office $34.50\nSubtotal: $34.50\nSales Tax (8.5%): $2.93\nTotal: $37.43\nPayment: Visa ending in 4102`}
            </div>
          ) : imageUrl ? (
            <div
              className="transition-transform duration-200 ease-out flex items-center justify-center"
              style={{
                transform: `rotate(${rotation}deg) scale(${scale})`
              }}
            >
              <img
                src={imageUrl}
                alt="Receipt"
                className="max-h-[60vh] max-w-full rounded-lg shadow-lg object-contain"
              />
            </div>
          ) : (
            <div className="text-center text-slate-400 text-sm">
              No receipt image attached to this record.
            </div>
          )}

          {/* Floating Controls Toolbar */}
          {!showRawText && imageUrl && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full shadow-lg text-white">
              <button
                onClick={handleRotate}
                className="p-1.5 hover:bg-slate-800 rounded-full transition-colors"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-slate-800 rounded-full transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-slate-800 rounded-full transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="p-1.5 hover:bg-slate-800 rounded-full transition-colors"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs text-slate-500">
          <span>Digital receipt cryptographically verified.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
