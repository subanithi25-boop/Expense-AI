import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseApi } from '../services/api';
import { ExpenseCategory, PolicyCheckResult } from '../types';
import { PolicyBadge } from '../components/common/PolicyBadge';
import { AnomalyBadge } from '../components/common/AnomalyBadge';
import { generateReceiptFile } from '../utils/receiptGenerator';
import { validateReceiptFile } from '../utils/receiptValidation';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  FileText,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Plus,
  Trash2,
  Camera,
  Layers,
  Calculator,
  Copy,
  Info,
  Check
} from 'lucide-react';

interface LineItem {
  description: string;
  amount: number;
  quantity?: number;
}

interface DuplicateNotice {
  isDuplicate: boolean;
  duplicateType?: string | null;
  matchedExpenseId?: string | null;
  message: string;
}

type FieldOrigin = 'extracted' | 'unverified' | 'edited';

export const ScanReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File and preview states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);

  // Drag-and-drop states
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Prevent browser from opening dropped files anywhere on the page
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // Extracted and editable fields
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [categoryReasoning, setCategoryReasoning] = useState('');
  const [categoryConfidence, setCategoryConfidence] = useState<number | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptHash, setReceiptHash] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [policyChecks, setPolicyChecks] = useState<PolicyCheckResult[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<any>('needs_review');
  const [anomaly, setAnomaly] = useState<any>(null);
  const [description, setDescription] = useState('');

  // Math calculation & duplicate validation
  const [calculationsValid, setCalculationsValid] = useState<boolean | null>(null);
  const [calculationNotes, setCalculationNotes] = useState<string>('');
  const [duplicateNotice, setDuplicateNotice] = useState<DuplicateNotice | null>(null);

  // Field provenance tracking (extracted vs unverified vs manually edited)
  const [fieldStatus, setFieldStatus] = useState<Record<string, 'extracted' | 'unverified'>>({
    merchant: 'unverified',
    date: 'unverified',
    amount: 'unverified',
    taxAmount: 'unverified',
    category: 'unverified'
  });
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  // Test Presets
  const testPresets = [
    { id: 'freshmart', label: 'FreshMart Supermarket (Grocery & INR)', desc: 'Real receipt: Rice, Milk, Eggs, 5% Tax' },
    { id: 'restaurant', label: 'The Capital Grille (Dining & Tips)', desc: 'Steak & Salad dinner with 8.5% tax' },
    { id: 'office', label: 'Staples #0482 (Office Supplies)', desc: 'Mouse, Paper box, Laptop stand' },
    { id: 'travel', label: 'Delta Air Lines (Flight Ticket)', desc: 'Economy flight with transportation tax' },
    { id: 'blurry', label: 'Unreadable / Blurry Image (Quality Check)', desc: 'Tests genuine OCR fallback & manual mode' }
  ];

  /**
   * Clears ALL previous extraction results so no data leaks from prior scans.
   */
  const resetExtractionState = () => {
    setMerchant('');
    setAmount('');
    setSubtotal('');
    setTaxAmount('');
    setCurrency('USD');
    setDate('');
    setCategory('Other');
    setCategoryReasoning('');
    setCategoryConfidence(null);
    setOcrConfidence(null);
    setReceiptUrl('');
    setReceiptHash('');
    setLineItems([]);
    setComplianceStatus('needs_review');
    setPolicyChecks([]);
    setAnomaly(null);
    setDescription('');
    setScanError(null);
    setQualityWarning(null);
    setCalculationNotes('');
    setCalculationsValid(null);
    setDuplicateNotice(null);
    setFieldStatus({
      merchant: 'unverified',
      date: 'unverified',
      amount: 'unverified',
      taxAmount: 'unverified',
      category: 'unverified'
    });
    setEditedFields(new Set());
  };

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileUpload(droppedFile);
    }
  };

  /**
   * Process a real uploaded receipt file using the backend neural OCR engine.
   */
  const handleFileUpload = async (uploadedFile: File) => {
    // Validate file type and size first
    const validation = validateReceiptFile(uploadedFile);
    if (!validation.valid) {
      setScanError(validation.error || 'Invalid receipt file.');
      return;
    }

    // 1. Immediately reset all previous extraction results
    resetExtractionState();

    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setScanning(true);

    try {
      // 2. Send actual file to real OCR backend
      const data = await expenseApi.scanReceipt(uploadedFile);

      if (data && data.extracted) {
        const ext = data.extracted;

        // Set extracted fields (or leave empty if not identified)
        setMerchant(ext.merchant || '');
        setAmount(ext.amount && ext.amount > 0 ? String(ext.amount) : '');
        setSubtotal(ext.subtotal && ext.subtotal > 0 ? String(ext.subtotal) : '');
        setTaxAmount(ext.taxAmount && ext.taxAmount > 0 ? String(ext.taxAmount) : '');
        setCurrency(ext.currency || 'USD');
        setDate(ext.date || '');
        setCategory(ext.category || 'Other');
        setCategoryReasoning(ext.categoryReasoning || '');
        setCategoryConfidence(ext.categoryConfidence || null);
        setOcrConfidence(ext.ocrConfidence !== undefined ? ext.ocrConfidence : null);
        setReceiptUrl(ext.receiptUrl || '');
        setReceiptHash(ext.receiptHash || '');
        setLineItems(ext.lineItems || []);
        setDescription(ext.merchant ? `Expenditure at ${ext.merchant}` : 'Receipt expense');

        // Math calculations reconciliation
        setCalculationsValid(ext.calculationsValid !== undefined ? ext.calculationsValid : null);
        setCalculationNotes(ext.calculationNotes || '');

        // Field extraction provenance
        if (ext.fieldStatus) {
          setFieldStatus(ext.fieldStatus);
        }

        // Duplicate detection
        if (ext.duplicateCheck) {
          setDuplicateNotice(ext.duplicateCheck);
        }

        // Compliance and policy checks
        setComplianceStatus(ext.complianceStatus || 'needs_review');
        setPolicyChecks(ext.policyChecks || []);
        setAnomaly(ext.anomaly || null);

        // Quality warnings
        if (ext.qualityWarning) {
          setQualityWarning(ext.qualityWarning);
        }
      }
    } catch (err: any) {
      console.error('[ScanReceipt] Upload error:', err);
      const errMsg = err.response?.data?.error || err.message || 'OCR extraction could not process this document. Please enter details manually.';
      setScanError(errMsg);
      setQualityWarning('Document was not automatically readable. You can verify and fill in the details manually.');
      setFieldStatus({
        merchant: 'unverified',
        date: 'unverified',
        amount: 'unverified',
        taxAmount: 'unverified',
        category: 'unverified'
      });
    } finally {
      setScanning(false);
    }
  };

  /**
   * Run one of the live test presets by generating a REAL image file and submitting it to OCR.
   */
  const handleSelectPreset = async (presetId: string) => {
    try {
      setScanning(true);
      const testFile = await generateReceiptFile(presetId);
      await handleFileUpload(testFile);
    } catch (err: any) {
      setScanning(false);
      setScanError(`Failed to load preset: ${err.message}`);
    }
  };

  /**
   * Mark a field as manually edited by the user
   */
  const handleFieldChange = (fieldName: string, setter: (val: any) => void, value: any) => {
    setter(value);
    setEditedFields((prev) => new Set(prev).add(fieldName));
  };

  /**
   * Helper to render provenance badge next to fields
   */
  const renderFieldBadge = (fieldName: string, value: string) => {
    if (editedFields.has(fieldName)) {
      return (
        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
          ✏️ Manually edited
        </span>
      );
    }
    if (fieldStatus[fieldName] === 'extracted' && value.trim().length > 0) {
      return (
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
          ✓ Extracted from receipt
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
        ⚠️ Needs verification
      </span>
    );
  };

  // Line item manipulation
  const handleAddLineItem = () => {
    setLineItems((prev) => [...prev, { description: 'New item', amount: 0, quantity: 1 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateLineItem = (index: number, field: keyof LineItem, val: any) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSaveExpense = async () => {
    if (!merchant.trim() || !amount.trim() || parseFloat(amount) <= 0) {
      setScanError('Please enter a valid Merchant and Total Amount before saving.');
      return;
    }

    setSaving(true);
    try {
      await expenseApi.createExpense({
        merchant: merchant.trim(),
        amount: parseFloat(amount),
        taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
        currency,
        date: date || new Date().toISOString().split('T')[0],
        category,
        description: description.trim() || `Receipt expense at ${merchant}`,
        receiptUrl: receiptUrl || previewUrl || undefined,
        receiptHash: receiptHash || undefined,
        lineItems: lineItems.length > 0 ? lineItems : undefined,
        ocrConfidence: ocrConfidence || undefined
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        navigate('/dashboard/expenses');
      }, 900);
    } catch (err: any) {
      setScanError(err.response?.data?.error || err.message || 'Failed to submit expense');
    } finally {
      setSaving(false);
    }
  };

  const lineItemsSum = lineItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            AI Receipt Scanner & Verification Studio
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Dynamic Neural OCR
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload any paper or digital receipt. SpendWise AI reads the real document, dynamically extracts vendors, dates, itemized lines, verifies arithmetic, and runs compliance checks in real-time.
        </p>
      </div>

      {/* Real Testing Presets Bar */}
      <div className="p-4 bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-emerald-500" /> Live Receipt Test Presets (Real OCR Execution):
          </span>
          <span className="text-[11px] text-slate-400">Click any preset to generate and upload a real receipt to OCR</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {testPresets.map((p) => (
            <button
              key={p.id}
              disabled={scanning}
              onClick={() => handleSelectPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col ${
                p.id === 'blurry'
                  ? 'border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
              } disabled:opacity-50`}
            >
              <span>{p.label}</span>
              <span className="text-[10px] opacity-60 font-normal">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duplicate Submission Warning Alert */}
      {duplicateNotice && duplicateNotice.isDuplicate && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm flex items-center gap-2">
              <span>Potential Duplicate Submission Detected</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                {duplicateNotice.duplicateType === 'file_hash' ? 'Exact File Hash Match' : 'Identical Transaction Match'}
              </span>
            </div>
            <p className="text-xs">{duplicateNotice.message}</p>
            <p className="text-[11px] opacity-80">
              SpendWise AI verified the SHA-256 cryptographic hash against stored receipts. You may proceed if this is an authorized re-filing.
            </p>
          </div>
        </div>
      )}

      {/* Main Scanner Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Receipt Upload & Image Canvas */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#131B2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>Receipt Document Canvas</span>
              {ocrConfidence !== null && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> OCR Confidence: {ocrConfidence}%
                </span>
              )}
            </h3>

            {/* Upload Zone / Image Box */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative min-h-[380px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 overflow-hidden transition-all duration-150 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                  e.target.value = '';
                }}
              />

              {previewUrl ? (
                <div className="relative w-full h-full flex items-center justify-center min-h-[350px]">
                  {file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf') ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-800">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">PDF Document ({((file.size || 0) / 1024).toFixed(1)} KB)</p>
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="max-h-[350px] max-w-full rounded-lg object-contain transition-transform duration-200 shadow-md"
                      style={{
                        transform: `rotate(${rotation}deg) scale(${zoom})`
                      }}
                    />
                  )}

                  {/* Drag overlay when replacing file via drag-and-drop */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10 p-4 text-center rounded-lg pointer-events-none">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg mb-2">
                        <UploadCloud className="w-6 h-6 animate-bounce" />
                      </div>
                      <p className="text-sm font-bold text-white">Drop receipt to replace current file</p>
                      <p className="text-xs text-emerald-200 mt-0.5">Supports JPG, PNG, WebP, PDF up to 25MB</p>
                    </div>
                  )}

                  {/* Toolbar Overlay */}
                  <div className="absolute bottom-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-full text-white text-xs shadow-lg">
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1 hover:bg-slate-800 rounded-full"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(z + 0.2, 2.2))}
                      className="p-1 hover:bg-slate-800 rounded-full"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
                      className="p-1 hover:bg-slate-800 rounded-full"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 hover:bg-slate-800 rounded-full"
                      title="Replace file"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer text-center p-6 space-y-3 hover:scale-105 transition-transform"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border transition-colors ${
                      isDragging
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <UploadCloud className={`w-7 h-7 ${isDragging ? 'animate-bounce' : ''}`} />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold transition-colors ${
                        isDragging ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isDragging ? 'Drop receipt file here to scan' : 'Drop any receipt image or PDF here, or browse'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Supports JPG, PNG, WebP, PDF up to 25MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    Choose Receipt File
                  </button>
                </div>
              )}

              {/* Scanning Overlay Spinner */}
              {scanning && (
                <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 z-10 p-6 text-center">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-sm font-bold">Executing Dynamic Neural OCR...</div>
                  <div className="text-xs text-slate-300 max-w-xs">
                    Processing actual uploaded pixels, detecting currency, reading itemized lines, and checking corporate policy.
                  </div>
                </div>
              )}
            </div>

            {/* Error / Quality Notice */}
            {(scanError || qualityWarning) && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div className="space-y-0.5">
                  <div className="font-bold">OCR Notice</div>
                  <p>{scanError || qualityWarning}</p>
                  <p className="text-[11px] opacity-75">You can edit or enter missing fields manually on the right.</p>
                </div>
              </div>
            )}

            {/* Document Hash */}
            {receiptHash && (
              <div className="mt-3 px-3 py-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>SHA-256 Digest:</span>
                <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={receiptHash}>
                  {receiptHash}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right 7 Cols: Extracted Data Review & Policy Compliance Form */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#131B2E] rounded-xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Extracted Receipt Details</span>
                  {ocrConfidence !== null && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      (Dynamic extraction from document)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Verify or edit fields. Extracted values are populated dynamically from your uploaded receipt.
                </p>
              </div>

              {ocrConfidence !== null && (
                <div className="flex items-center gap-2">
                  <PolicyBadge status={complianceStatus} />
                  {anomaly && <AnomalyBadge anomaly={anomaly} />}
                </div>
              )}
            </div>

            {/* Arithmetic Verification Banner */}
            {calculationNotes && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  calculationsValid
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{calculationsValid ? 'Math Verified:' : 'Calculation Check:'}</span>
                  <span>{calculationNotes}</span>
                </div>
                {calculationsValid && (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-[10px] font-bold uppercase shrink-0">
                    Balanced
                  </span>
                )}
              </div>
            )}

            {/* Fields Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Merchant Field */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Merchant / Vendor *</label>
                  {renderFieldBadge('merchant', merchant)}
                </div>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => handleFieldChange('merchant', setMerchant, e.target.value)}
                  placeholder="e.g. FreshMart, Delta Air Lines, Staples"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Transaction Date Field */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transaction Date *</label>
                  {renderFieldBadge('date', date)}
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleFieldChange('date', setDate, e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Total Amount & Currency */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Amount *</label>
                  {renderFieldBadge('amount', amount)}
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => handleFieldChange('amount', setAmount, e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <select
                    value={currency}
                    onChange={(e) => handleFieldChange('currency', setCurrency, e.target.value)}
                    className="w-24 px-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (CA$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
              </div>

              {/* Tax / VAT Amount */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tax / VAT Amount</label>
                  {renderFieldBadge('taxAmount', taxAmount)}
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => handleFieldChange('taxAmount', setTaxAmount, e.target.value)}
                  placeholder="0.00"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Suggested Category & Reasoning */}
              <div className="sm:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Suggested Category</label>
                    {renderFieldBadge('category', category)}
                  </div>
                  {categoryReasoning && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      AI Reasoning: {categoryReasoning}
                    </span>
                  )}
                </div>
                <select
                  value={category}
                  onChange={(e) => handleFieldChange('category', setCategory, e.target.value as ExpenseCategory)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Travel">Travel</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Meals & Entertainment">Meals & Entertainment</option>
                  <option value="Groceries & Supplies">Groceries & Supplies</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Software & Subscriptions">Software & Subscriptions</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Client Meetings">Client Meetings</option>
                  <option value="Training & Education">Training & Education</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Business Notes */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Business Purpose / Notes</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Weekly team pantry supplies, client lunch, project server fee"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Itemized Line Items Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  Itemized Line Items ({lineItems.length})
                </label>
                <div className="flex items-center gap-2">
                  {lineItems.length > 0 && (
                    <span className="text-[11px] text-slate-500">
                      Items Sum: <strong className="text-slate-800 dark:text-slate-200">{currency} {lineItemsSum.toFixed(2)}</strong>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
              </div>

              {lineItems.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Item Description</th>
                        <th className="px-3 py-2 w-20 text-center">Qty</th>
                        <th className="px-3 py-2 text-right w-28">Amount ({currency})</th>
                        <th className="px-2 py-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded px-1 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => handleUpdateLineItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                              className="w-14 text-center bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded px-1 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold">
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) => handleUpdateLineItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded px-1 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  No line items extracted. Click "Add Item" if itemized breakdown is needed.
                </div>
              )}
            </div>

            {/* Live Policy Verification Summary */}
            {policyChecks.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Policy Compliance Verdict
                </label>
                <div className="space-y-1.5">
                  {policyChecks.map((p, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        p.status === 'violation'
                          ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                          : p.status === 'warning'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {p.status === 'violation' ? (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        ) : p.status === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-semibold">{p.ruleName}:</span>
                        <span>{p.message}</span>
                      </div>
                      {p.actual && <span className="text-[11px] opacity-75 shrink-0 ml-2">{p.actual}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Receipt hash checked against stored records for duplicate submission protection.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/expenses')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  disabled={saving || !merchant.trim() || !amount || parseFloat(amount) <= 0}
                  onClick={handleSaveExpense}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02]"
                >
                  {saving ? (
                    'Saving Expense...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Save Verified Expense
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
