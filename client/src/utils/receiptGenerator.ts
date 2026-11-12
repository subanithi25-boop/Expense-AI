/**
 * Utility to generate real PNG receipt images on the fly via HTML5 Canvas.
 * These are used by the test preset buttons so they upload REAL images to the OCR engine.
 * No hardcoded values are sent as extraction results.
 */

export async function generateReceiptFile(presetId: string): Promise<File> {
  // If FreshMart preset, fetch the user's uploaded receipt directly as a real File
  if (presetId === 'freshmart') {
    try {
      const res = await fetch('/uploads/1792587206734-1b07deb5.png');
      if (res.ok) {
        const blob = await res.blob();
        return new File([blob], 'freshmart_receipt.png', { type: 'image/png' });
      }
    } catch {
      // Fallback to canvas render below
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }

  if (presetId === 'blurry') {
    // Generate low-contrast blurry noise image without readable text
    canvas.width = 400;
    canvas.height = 300;
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#c8c8c8');
    grad.addColorStop(0.5, '#b0b0b0');
    grad.addColorStop(1, '#d0d0d0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Add blurry gray patches
    ctx.filter = 'blur(12px)';
    ctx.fillStyle = '#9e9e9e';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 400, Math.random() * 300, 30 + Math.random() * 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'none';

    return new Promise<File>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas blob failed'));
        resolve(new File([blob], 'blurry_unreadable_sample.png', { type: 'image/png' }));
      }, 'image/png');
    });
  }

  // Specifications for different test receipt types
  let title = '';
  let lines: string[] = [];

  if (presetId === 'restaurant') {
    title = 'THE CAPITAL GRILLE';
    lines = [
      'THE CAPITAL GRILLE',
      '1338 Chestnut Street',
      'Table 14 - Party of 4',
      'Date: 2026-03-14',
      '----------------------------------------',
      'Item                     Qty     Amount',
      'Bone-in Ribeye Steak       1     $68.00',
      'Pan-seared Chilean Bass    1     $54.00',
      'Artisanal Greens Salad     1     $18.00',
      'Sparkling San Pellegrino   2     $16.00',
      '----------------------------------------',
      'Subtotal                        $156.00',
      'Tax (8.5%)                       $13.26',
      'Total                           $169.26',
      'Payment: Corporate Amex ending 4012',
      '----------------------------------------',
      'Thank you for dining with The Capital Grille!'
    ];
  } else if (presetId === 'office') {
    title = 'STAPLES #0482';
    lines = [
      'STAPLES #0482',
      'Commercial Supplies Center',
      'Date: 2026-03-15',
      'Invoice No: STP-948102',
      '----------------------------------------',
      'Item                     Qty     Amount',
      'Wireless Ergonomic Mouse   1     $49.99',
      'Recycled Copy Paper Box    1     $64.50',
      'Gel Pen Set 12-pack        1     $19.99',
      'Aluminum Laptop Stand      1     $59.99',
      '----------------------------------------',
      'Subtotal                        $194.47',
      'Tax (8.5%)                       $16.53',
      'Total                           $211.00',
      'Payment Method: Corporate Visa',
      '----------------------------------------',
      'Thank you for shopping with Staples!'
    ];
  } else if (presetId === 'travel') {
    title = 'DELTA AIR LINES';
    lines = [
      'DELTA AIR LINES',
      'Passenger Ticket & Baggage Receipt',
      'Date: 2026-03-08',
      'Flight DL 1492 JFK -> SFO',
      'Economy Class Seat 14B',
      '----------------------------------------',
      'Flight DL 1492 Economy          $589.20',
      'Federal Transportation Tax       $44.19',
      'Passenger Facility Charge         $4.50',
      '----------------------------------------',
      'Subtotal                        $589.20',
      'Tax                              $48.69',
      'Total                           $637.89',
      'Status: Confirmed Paid via Mastercard',
      '----------------------------------------',
      'Thank you for flying with Delta Air Lines!'
    ];
  } else {
    // Default FreshMart canvas rendering if fetch not available
    title = 'FreshMart';
    lines = [
      'FreshMart - YOUR DAILY NEEDS',
      '123 Green Park Street',
      'Bangalore - 560001',
      'GSTIN: 29ABCDE1234F1Z5',
      'Invoice No: FM2025001234',
      'Date: 15-04-2025',
      '----------------------------------------',
      'Item Qty Price Amount',
      'Organic Rice 5kg 1 299.00 299.00',
      'Atta 10kg 1 349.00 349.00',
      'Fresh Milk 1L 2 52.00 104.00',
      'Cooking Oil 1L 1 149.00 149.00',
      'Eggs (12 pcs) 1 72.00 72.00',
      'Tomatoes 1kg 1 45.00 45.00',
      'Bananas 1kg 1 40.00 40.00',
      'Detergent 1kg 1 120.00 120.00',
      '----------------------------------------',
      'Subtotal 1,178.00',
      'Tax (5%) 58.90',
      'Total 1,236.90',
      'Payment Method: UPI ID user@oksbi',
      '----------------------------------------',
      'Thank you for shopping with FreshMart!'
    ];
  }

  // Draw high-resolution receipt image for Tesseract OCR
  canvas.width = 650;
  canvas.height = 750;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Text settings
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Courier New", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, 45);

  ctx.font = '15px "Courier New", Courier, monospace';
  ctx.textAlign = 'left';

  let y = 80;
  for (const line of lines) {
    if (line.includes('Total') && !line.includes('Subtotal')) {
      ctx.font = 'bold 16px "Courier New", Courier, monospace';
    } else {
      ctx.font = '15px "Courier New", Courier, monospace';
    }
    ctx.fillText(line, 40, y);
    y += 26;
  }

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas blob failed'));
      resolve(new File([blob], `${presetId}_receipt.png`, { type: 'image/png' }));
    }, 'image/png');
  });
}
