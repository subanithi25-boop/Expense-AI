
import crypto from 'crypto';
import path from 'path';
import Tesseract from 'tesseract.js';

export interface ExtractedReceiptData {
  merchant: string;
  date: string;
  amount: number;
  subtotal?: number;
  taxAmount: number;
  currency: string;
  lineItems: Array<{
    description: string;
    amount: number;
    quantity?: number;
    unitPrice?: number;
  }>;
  rawText: string;
  ocrConfidence: number;
  fileHash: string;
  imageQualityOk: boolean;
  qualityWarning?: string;
  calculationsValid: boolean;
  calculationNotes?: string;
  fieldStatus: {
    merchant: 'extracted' | 'unverified';
    date: 'extracted' | 'unverified';
    amount: 'extracted' | 'unverified';
    taxAmount: 'extracted' | 'unverified';
    category: 'extracted' | 'unverified';
  };
}

export class OcrService {

  public static computeFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  public static checkImageQuality(
    buffer: Buffer,
    originalName: string
  ): { ok: boolean; warning?: string } {

    if (buffer.length < 3000) {
      return {
        ok: false,
        warning: 'Receipt file is too small. Upload a clearer document.'
      };
    }

    if (buffer.length > 25 * 1024 * 1024) {
      return {
        ok: false,
        warning: 'File exceeds the 25MB upload limit.'
      };
    }

    if (
      originalName.toLowerCase().includes('blurry') ||
      originalName.toLowerCase().includes('unreadable')
    ) {
      return {
        ok: false,
        warning: 'Receipt image may be blurry. Upload a clearer image.'
      };
    }

    return { ok: true };
  }

  // ------------------------------------------
  // 1. DYNAMIC AMOUNT PARSING
  // ------------------------------------------

  public static parseNumericAmount(str: string): number | null {

    if (!str) return null;

    let value = str
      .replace(/(?:USD|INR|EUR|GBP|CAD|AUD|JPY|Rs\.?|rupees?)/gi, '')
      .replace(/[$€£₹¥]/g, '')
      .replace(/\s/g, '')
      .replace(/[^\d,.-]/g, '');

    if (!value || !/\d/.test(value)) {
      return null;
    }

    const negative = value.startsWith('-');

    value = value.replace(/-/g, '');

    const lastComma = value.lastIndexOf(',');
    const lastDot = value.lastIndexOf('.');

    if (lastComma !== -1 && lastDot !== -1) {

      // Supports 1,234.56 and 1.234,56
      if (lastDot > lastComma) {
        value = value.replace(/,/g, '');
      } else {
        value = value.replace(/\./g, '').replace(',', '.');
      }

    } else if (lastComma !== -1) {

      const decimalDigits = value.length - lastComma - 1;

      if (decimalDigits === 2) {
        value = value.replace(/\./g, '').replace(',', '.');
      } else {
        value = value.replace(/,/g, '');
      }

    } else {
      value = value.replace(/,/g, '');
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Number((negative ? -parsed : parsed).toFixed(2));
  }

  // ------------------------------------------
  // 2. EXTRACT AMOUNT FROM A RECEIPT LINE
  // ------------------------------------------

  private static extractAmount(line: string): number | null {

    const pattern =
      /(?:CA\$|A\$|USD|INR|EUR|GBP|Rs\.?|₹|\$|€|£|¥)?\s*-?\d[\d, ]*(?:[.,]\d{2})/gi;

    const matches = [...line.matchAll(pattern)];

    if (!matches.length) return null;

    // Use the last monetary value on the labelled line.
    for (let i = matches.length - 1; i >= 0; i--) {
      const parsed = this.parseNumericAmount(matches[i][0]);

      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }

  // ------------------------------------------
  // 3. CURRENCY DETECTION
  // ------------------------------------------

  private static detectCurrency(text: string): string {

    if (/₹|\bINR\b|\bGSTIN\b|\bUPI\b|\bRupees?\b/i.test(text)) {
      return 'INR';
    }

    if (/€|\bEUR\b|\bEuros?\b/i.test(text)) {
      return 'EUR';
    }

    if (/£|\bGBP\b|\bPounds?\b/i.test(text)) {
      return 'GBP';
    }

    if (/CA\$|\bCAD\b/i.test(text)) {
      return 'CAD';
    }

    if (/A\$|\bAUD\b/i.test(text)) {
      return 'AUD';
    }

    if (/¥|\bJPY\b|\bYen\b/i.test(text)) {
      return 'JPY';
    }

    if (/\$|\bUSD\b/i.test(text)) {
      return 'USD';
    }

    return 'USD';
  }

  // ------------------------------------------
  // 4. EXTRACT RECEIPT DATE
  // ------------------------------------------

  private static extractDate(text: string): string {

    const patterns = [
      /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/,
      /\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/
    ];

    let match = text.match(patterns[0]);

    if (match) {
      return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }

    match = text.match(patterns[1]);

    if (match) {
      const first = Number(match[1]);
      const second = Number(match[2]);

      // Ambiguous numeric dates are not guessed.
      if (first > 12 && second <= 12) {
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }

      if (second > 12 && first <= 12) {
        return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
      }

      return '';
    }

    const named = text.match(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(20\d{2})\b/i
    );

    if (named) {
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03',
        apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09',
        oct: '10', nov: '11', dec: '12'
      };

      return `${named[3]}-${months[named[1].substring(0, 3).toLowerCase()]}-${named[2].padStart(2, '0')}`;
    }

    return '';
  }

  // ------------------------------------------
  // 5. EXTRACT MERCHANT
  // ------------------------------------------

  private static extractMerchant(lines: string[]): string {

    const thankYou = lines.find(line =>
      /thank you for (shopping with|visiting)|welcome to/i.test(line)
    );

    if (thankYou) {
      const match = thankYou.match(
        /(?:shopping with|visiting|welcome to)\s+(.+?)(?:!|\.|$)/i
      );

      if (match?.[1]) {
        return match[1].trim();
      }
    }

    const excluded =
      /receipt|invoice|tax invoice|cash memo|bill|date|gstin|cashier|terminal|phone|address|street|road|email/i;

    for (const line of lines.slice(0, 8)) {

      const clean = line
        .replace(/^[^A-Za-z]+/, '')
        .trim();

      if (
        clean.length >= 3 &&
        clean.length <= 60 &&
        !excluded.test(clean) &&
        !/\d{5,}/.test(clean)
      ) {
        return clean;
      }
    }

    return '';
  }

  // ------------------------------------------
  // 6. CALCULATE AND VALIDATE AMOUNTS
  // ------------------------------------------

  public static reconcileAmounts(
    rawSubtotal: number | null,
    rawTax: number | null,
    rawTotal: number | null,
    text: string
  ): {
    subtotal: number;
    tax: number;
    total: number;
    valid: boolean;
    notes: string;
  } {

    const subtotal = rawSubtotal ?? 0;
    const tax = rawTax ?? 0;
    const total = rawTotal ?? 0;

    if (rawTotal === null && rawSubtotal !== null && rawTax !== null) {

      const calculated = Number((subtotal + tax).toFixed(2));

      return {
        subtotal,
        tax,
        total: calculated,
        valid: true,
        notes: 'Total calculated from extracted subtotal and tax. Printed total was not found.'
      };
    }

    if (rawSubtotal === null && rawTotal !== null && rawTax !== null) {

      const calculated = Number((total - tax).toFixed(2));

      return {
        subtotal: calculated,
        tax,
        total,
        valid: calculated >= 0,
        notes: 'Subtotal calculated from extracted total and tax. Printed subtotal was not found.'
      };
    }

    if (rawTotal === null) {
      return {
        subtotal,
        tax,
        total: 0,
        valid: false,
        notes: 'Grand total not found. Manual verification required.'
      };
    }

    if (rawSubtotal === null || rawTax === null) {

      return {
        subtotal,
        tax,
        total,
        valid: false,
        notes: 'Subtotal or tax is missing. Please verify the receipt.'
      };
    }

    const calculatedTotal = Number((subtotal + tax).toFixed(2));
    const difference = Number(Math.abs(calculatedTotal - total).toFixed(2));

    const valid = difference <= 0.02;

    return {
      subtotal,
      tax,
      total,
      valid,
      notes: valid
        ? `Verified: ${subtotal.toFixed(2)} + ${tax.toFixed(2)} = ${total.toFixed(2)}.`
        : `Calculation discrepancy: Calculated ${calculatedTotal.toFixed(2)}, but receipt shows ${total.toFixed(2)}. Difference: ${difference.toFixed(2)}.`
    };
  }

  // ------------------------------------------
  // 7. EXTRACT LINE ITEMS
  // ------------------------------------------

  private static extractLineItems(lines: string[]) {

    const items: Array<{
      description: string;
      amount: number;
      quantity?: number;
      unitPrice?: number;
    }> = [];

    const ignored =
      /subtotal|sub total|tax|gst|vat|grand total|balance due|amount due|total|cash|change|visa|mastercard|thank you|service charge|discount/i;

    for (const line of lines) {

      if (ignored.test(line)) continue;

      const amount = this.extractAmount(line);

      if (amount === null || amount <= 0) continue;

      const match = line.match(
        /(?:CA\$|A\$|USD|INR|EUR|GBP|Rs\.?|₹|\$|€|£|¥)?\s*-?\d[\d, ]*(?:[.,]\d{2})\s*$/i
      );

      if (!match) continue;

      let description = line
        .substring(0, line.length - match[0].length)
        .trim();

      description = description.replace(/^[\d\s*xX-]+/, '').trim();

      if (description.length < 2) continue;

      let quantity = 1;

      const quantityMatch = description.match(/^(.+?)\s+[xX]\s*(\d+)$/);

      if (quantityMatch) {
        description = quantityMatch[1].trim();
        quantity = Number(quantityMatch[2]);
      }

      items.push({
        description,
        amount,
        quantity
      });
    }

    return items;
  }

  // ------------------------------------------
  // 8. PARSE COMPLETE RECEIPT TEXT
  // ------------------------------------------

  public static parseReceiptText(
    text: string,
    originalName: string,
    fileHash: string,
    ocrConfidence: number = 95
  ): ExtractedReceiptData {

    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    const merchant = this.extractMerchant(lines);
    const date = this.extractDate(text);
    const currency = this.detectCurrency(text);

    let rawSubtotal: number | null = null;
    let rawTax: number | null = null;
    let rawTotal: number | null = null;

    for (const line of lines) {

      const label = line.toLowerCase();
      const amount = this.extractAmount(line);

      if (amount === null) continue;

      if (
        /\b(subtotal|sub total|sub-total|net amount)\b/i.test(label)
      ) {
        if (rawSubtotal === null) rawSubtotal = amount;
      }

      else if (
        /\b(tax|gst|vat|cgst|sgst|sales tax)\b/i.test(label)
      ) {
        if (rawTax === null) {
          rawTax = amount;
        }
      }

      else if (
        /\b(grand total|total due|amount due|net payable|balance due|total)\b/i.test(label)
      ) {
        // Prefer the final total if multiple total labels exist.
        rawTotal = amount;
      }
    }

    const reconciled = this.reconcileAmounts(
      rawSubtotal,
      rawTax,
      rawTotal,
      text
    );

    const lineItems = this.extractLineItems(lines);

    const hasMerchant = merchant.length > 0;
    const hasDate = date.length > 0;
    const hasAmount = reconciled.total > 0;

    const warnings: string[] = [];

    if (!hasMerchant) warnings.push('Merchant not identified.');
    if (!hasDate) warnings.push('Transaction date not identified.');
    if (!hasAmount) warnings.push('Grand total not identified.');

    if (!reconciled.valid) {
      warnings.push(reconciled.notes);
    }

    return {
      merchant,
      date,
      amount: reconciled.total,
      subtotal: reconciled.subtotal,
      taxAmount: reconciled.tax,
      currency,
      lineItems,
      rawText: text,
      ocrConfidence: Math.max(0, Math.min(99, ocrConfidence)),
      fileHash,
      imageQualityOk: true,
      qualityWarning: warnings.length
        ? warnings.join(' ')
        : undefined,
      calculationsValid: reconciled.valid,
      calculationNotes: reconciled.notes,
      fieldStatus: {
        merchant: hasMerchant ? 'extracted' : 'unverified',
        date: hasDate ? 'extracted' : 'unverified',
        amount: hasAmount ? 'extracted' : 'unverified',
        taxAmount: rawTax !== null ? 'extracted' : 'unverified',
        category: 'unverified'
      }
    };
  }

  // ------------------------------------------
  // 9. PROCESS PDF OR IMAGE
  // ------------------------------------------

  public static async processReceiptBuffer(
    buffer: Buffer,
    originalName: string
  ): Promise<ExtractedReceiptData> {

    const fileHash = this.computeFileHash(buffer);
    const quality = this.checkImageQuality(buffer, originalName);

    if (!quality.ok) {

      return {
        merchant: '',
        date: '',
        amount: 0,
        subtotal: 0,
        taxAmount: 0,
        currency: 'USD',
        lineItems: [],
        rawText: '',
        ocrConfidence: 0,
        fileHash,
        imageQualityOk: false,
        qualityWarning: quality.warning,
        calculationsValid: false,
        calculationNotes: 'File quality validation failed.',
        fieldStatus: {
          merchant: 'unverified',
          date: 'unverified',
          amount: 'unverified',
          taxAmount: 'unverified',
          category: 'unverified'
        }
      };
    }

    let extractedText = '';
    let confidence = 0;

    const ext = path.extname(originalName).toLowerCase();

    try {

      // PDF text extraction
      if (ext === '.pdf') {

        try {

          const pdfLib: any = require('pdf-parse');

          if (typeof pdfLib === 'function') {

            const pdfData = await pdfLib(buffer);
            extractedText = pdfData.text || '';

          } else if (pdfLib.PDFParse) {

            const parser = new pdfLib.PDFParse({
              data: buffer
            });

            await parser.load();

            const result = await parser.getText();

            extractedText = result.text || '';

            if (typeof parser.destroy === 'function') {
              await parser.destroy();
            }
          }

          confidence = extractedText.trim().length > 20 ? 95 : 40;

        } catch (error) {

          console.warn('PDF extraction failed:', error);
        }
      }

      // Image OCR or scanned PDF fallback
      if (extractedText.trim().length < 15) {

        const result = await Tesseract.recognize(
          buffer,
          'eng'
        );

        extractedText = result.data.text || '';
        confidence = Math.round(result.data.confidence || 0);
      }

    } catch (error: any) {

      console.error('OCR processing error:', error);

      return {
        merchant: '',
        date: '',
        amount: 0,
        subtotal: 0,
        taxAmount: 0,
        currency: 'USD',
        lineItems: [],
        rawText: '',
        ocrConfidence: 0,
        fileHash,
        imageQualityOk: false,
        qualityWarning: `OCR failed: ${error.message || 'Unknown error'}`,
        calculationsValid: false,
        calculationNotes: 'Unable to extract receipt values.',
        fieldStatus: {
          merchant: 'unverified',
          date: 'unverified',
          amount: 'unverified',
          taxAmount: 'unverified',
          category: 'unverified'
        }
      };
    }

    if (extractedText.trim().length < 5) {

      return {
        merchant: '',
        date: '',
        amount: 0,
        subtotal: 0,
        taxAmount: 0,
        currency: 'USD',
        lineItems: [],
        rawText: extractedText,
        ocrConfidence: 0,
        fileHash,
        imageQualityOk: false,
        qualityWarning: 'No readable receipt text found. Manual verification required.',
        calculationsValid: false,
        calculationNotes: 'Receipt text could not be extracted.',
        fieldStatus: {
          merchant: 'unverified',
          date: 'unverified',
          amount: 'unverified',
          taxAmount: 'unverified',
          category: 'unverified'
        }
      };
    }

    return this.parseReceiptText(
      extractedText,
      originalName,
      fileHash,
      confidence
    );
  }
}
