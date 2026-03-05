/**
 * QR Code Export Utility
 *
 * Generates branded assets for survey distribution:
 * - Square PNG image (1200×1200)
 * - A4 PDF flyer (210×297mm)
 *
 * Both include: Qualitivate logo, company logo, survey title,
 * QR code, and qualitivate.io link.
 */
import { jsPDF } from 'jspdf';

export interface QrExportOptions {
  surveyTitle: string;
  qrCodeUrl: string;
  surveyUrl: string;
  companyName?: string;
  companyLogoUrl?: string;
}

const BRAND_INDIGO = '#4F46E5';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const QUALITIVATE_LINK = 'qualitivate.io';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    if (url.startsWith('data:')) {
      img.src = url;
    } else {
      img.src = url;
    }
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
    .toLowerCase() || 'survey';
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fitImageInBox(
  img: HTMLImageElement,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  const ratio = img.naturalWidth / img.naturalHeight;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w, h };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// ─── SQUARE IMAGE EXPORT ───

export async function generateQrImage(options: QrExportOptions): Promise<void> {
  const { surveyTitle, qrCodeUrl, companyName, companyLogoUrl } = options;

  const SIZE = 1200;
  const PADDING = 80;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Subtle border
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2);

  let cursorY = PADDING;

  // ── Header: Qualitivate logo (left) + Company logo (right) ──
  const logoMaxH = 60;
  const logoMaxW = 240;

  try {
    const qualitivateLogo = await loadImage('/branding/logo1.webp');
    const qs = fitImageInBox(qualitivateLogo, logoMaxW, logoMaxH);
    ctx.drawImage(qualitivateLogo, PADDING, cursorY, qs.w, qs.h);
  } catch {
    ctx.font = 'bold 32px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = BRAND_INDIGO;
    ctx.textAlign = 'left';
    ctx.fillText('Qualitivate', PADDING, cursorY + 40);
  }

  let companyLogoLoaded = false;
  if (companyLogoUrl) {
    try {
      const companyLogo = await loadImage(companyLogoUrl);
      const cs = fitImageInBox(companyLogo, logoMaxW, logoMaxH);
      ctx.drawImage(companyLogo, SIZE - PADDING - cs.w, cursorY, cs.w, cs.h);
      companyLogoLoaded = true;
    } catch { /* skip */ }
  }

  if (!companyLogoLoaded && companyName) {
    ctx.font = '600 24px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.textAlign = 'right';
    ctx.fillText(companyName, SIZE - PADDING, cursorY + 40);
  }

  cursorY += logoMaxH + 30;

  // ── Separator line ──
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, cursorY);
  ctx.lineTo(SIZE - PADDING, cursorY);
  ctx.stroke();
  cursorY += 30;

  // ── Survey Title ──
  ctx.textAlign = 'center';
  ctx.fillStyle = TEXT_PRIMARY;
  const titleMaxWidth = SIZE - PADDING * 2 - 40;

  let titleFontSize = 42;
  ctx.font = `bold ${titleFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;

  let titleLines = wrapText(ctx, surveyTitle, titleMaxWidth);
  while (titleLines.length > 3 && titleFontSize > 24) {
    titleFontSize -= 2;
    ctx.font = `bold ${titleFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    titleLines = wrapText(ctx, surveyTitle, titleMaxWidth);
  }

  const titleLineHeight = titleFontSize * 1.3;
  for (const line of titleLines) {
    ctx.fillText(line, SIZE / 2, cursorY + titleFontSize);
    cursorY += titleLineHeight;
  }

  cursorY += 20;

  // ── QR Code ──
  const availableSpace = SIZE - cursorY - PADDING - 80;
  const qrSize = Math.min(availableSpace, SIZE - PADDING * 4, 600);
  const qrX = (SIZE - qrSize) / 2;

  // QR frame
  const framePad = 16;
  drawRoundedRect(
    ctx,
    qrX - framePad, cursorY - framePad,
    qrSize + framePad * 2, qrSize + framePad * 2,
    16
  );
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = BRAND_INDIGO;
  ctx.lineWidth = 4;
  ctx.stroke();

  try {
    const qrImg = await loadImage(qrCodeUrl);
    ctx.drawImage(qrImg, qrX, cursorY, qrSize, qrSize);
  } catch {
    ctx.font = '20px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', SIZE / 2, cursorY + qrSize / 2);
  }

  cursorY += qrSize + framePad + 30;

  // ── "Scan to take the survey" instruction ──
  ctx.font = '600 22px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.textAlign = 'center';
  ctx.fillText('Scan the QR code to take the survey', SIZE / 2, cursorY);
  cursorY += 35;

  // ── qualitivate.io link ──
  ctx.font = 'bold 26px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = BRAND_INDIGO;
  ctx.textAlign = 'center';
  ctx.fillText(QUALITIVATE_LINK, SIZE / 2, cursorY);

  // ── Download ──
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
      1.0
    );
  });

  triggerDownload(blob, `${sanitizeFilename(surveyTitle)}-qr.png`);
}

// ─── A4 PDF EXPORT ───

export async function generateQrPdf(options: QrExportOptions): Promise<void> {
  const { surveyTitle, qrCodeUrl, companyName, companyLogoUrl, surveyUrl } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();   // 297
  const margin = 20;

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pw, ph, 'F');

  // Subtle background pattern (light dots grid)
  doc.setFillColor(245, 245, 250);
  for (let x = 10; x < pw; x += 15) {
    for (let y = 10; y < ph; y += 15) {
      doc.circle(x, y, 0.3, 'F');
    }
  }

  let cursorY = margin;

  // ── HEADER: Qualitivate logo (left) + Company logo (right) ──
  const logoMaxW = 45;
  const logoMaxH = 14;

  try {
    const qualitivateBase64 = await loadImageToBase64('/branding/logo1.webp');
    doc.addImage(qualitivateBase64, 'PNG', margin, cursorY, logoMaxW, logoMaxH);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text('Qualitivate', margin, cursorY + 10);
  }

  if (companyLogoUrl) {
    try {
      const companyBase64 = await loadImageToBase64(companyLogoUrl);
      doc.addImage(companyBase64, 'PNG', pw - margin - logoMaxW, cursorY, logoMaxW, logoMaxH);
    } catch {
      if (companyName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text(companyName, pw - margin, cursorY + 10, { align: 'right' });
      }
    }
  } else if (companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(companyName, pw - margin, cursorY + 10, { align: 'right' });
  }

  cursorY += logoMaxH + 8;

  // ── Separator ──
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pw - margin, cursorY);
  cursorY += 15;

  // ── Survey Title ──
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);

  let titleFontSize = 28;
  doc.setFontSize(titleFontSize);
  const contentWidth = pw - margin * 2 - 20;

  while (doc.getTextWidth(surveyTitle) > contentWidth * 2 && titleFontSize > 16) {
    titleFontSize -= 1;
    doc.setFontSize(titleFontSize);
  }

  const titleLines: string[] = doc.splitTextToSize(surveyTitle, contentWidth);
  doc.text(titleLines, pw / 2, cursorY, { align: 'center' });
  cursorY += titleLines.length * (titleFontSize * 0.45) + 15;

  // ── QR Code with branded frame ──
  const qrSize = Math.min(pw - margin * 4, 130);
  const framePad = 6;
  const frameX = (pw - qrSize) / 2 - framePad;
  const frameW = qrSize + framePad * 2;

  // Frame background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(frameX, cursorY - framePad, frameW, frameW, 4, 4, 'F');
  // Frame border
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(2.5);
  doc.roundedRect(frameX, cursorY - framePad, frameW, frameW, 4, 4, 'S');

  try {
    const qrBase64 = await loadImageToBase64(qrCodeUrl);
    doc.addImage(qrBase64, 'PNG', (pw - qrSize) / 2, cursorY, qrSize, qrSize);
  } catch {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('QR Code', pw / 2, cursorY + qrSize / 2, { align: 'center' });
  }

  cursorY += qrSize + framePad + 15;

  // ── Scan instruction ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(107, 114, 128);
  doc.text('Scan the QR code to take the survey', pw / 2, cursorY, { align: 'center' });
  cursorY += 10;

  // ── Survey URL ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  const displayUrl = surveyUrl.replace(/^https?:\/\//, '');
  const urlLines = doc.splitTextToSize(displayUrl, contentWidth);
  doc.text(urlLines, pw / 2, cursorY, { align: 'center' });

  // ── Footer ──
  const footerY = ph - margin;

  // Separator
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 12, pw - margin, footerY - 12);

  // qualitivate.io link centered
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text(QUALITIVATE_LINK, pw / 2, footerY, { align: 'center' });

  // Powered by text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Powered by Qualitivate', pw / 2, footerY - 5, { align: 'center' });

  // ── Save ──
  doc.save(`${sanitizeFilename(surveyTitle)}-qr.pdf`);
}

function loadImageToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return Promise.resolve(url);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}
