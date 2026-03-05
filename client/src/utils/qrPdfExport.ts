/**
 * QR Code Export Utility
 *
 * Generates branded assets for survey distribution:
 * - Square PNG image (2400×2400)
 * - A4 PDF flyer (210×297mm)
 *
 * Layout: Both logos at top, title, QR with branded icon overlay,
 * qualitivate.io link at middle-bottom. i18n-aware labels.
 */
import { jsPDF } from 'jspdf';
import i18n from '../i18n';

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
const QUALITIVATE_LINK = 'www.qualitivate.io';

function t(key: string): string {
  return i18n.t(key);
}

function isRtl(): boolean {
  return i18n.language === 'ar';
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
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
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
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
  img: HTMLImageElement, maxW: number, maxH: number
): { w: number; h: number } {
  const ratio = img.naturalWidth / img.naturalHeight;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) { h = maxH; w = h * ratio; }
  return { w, h };
}

function wrapText(
  ctx: CanvasRenderingContext2D, text: string, maxWidth: number
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

/**
 * Draws a smooth faded background with radial gradients and soft curves.
 */
function drawFadedBackground(ctx: CanvasRenderingContext2D, size: number) {
  // Soft radial glow top-left
  const g1 = ctx.createRadialGradient(
    size * 0.15, size * 0.1, 0,
    size * 0.15, size * 0.1, size * 0.5
  );
  g1.addColorStop(0, 'rgba(79, 70, 229, 0.04)');
  g1.addColorStop(0.5, 'rgba(79, 70, 229, 0.015)');
  g1.addColorStop(1, 'rgba(79, 70, 229, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, size, size);

  // Soft radial glow bottom-right
  const g2 = ctx.createRadialGradient(
    size * 0.85, size * 0.9, 0,
    size * 0.85, size * 0.9, size * 0.5
  );
  g2.addColorStop(0, 'rgba(99, 102, 241, 0.035)');
  g2.addColorStop(0.5, 'rgba(99, 102, 241, 0.012)');
  g2.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, size, size);

  // Soft topographic curves
  ctx.strokeStyle = 'rgba(200, 200, 220, 0.15)';
  ctx.lineWidth = 2;
  const curves = [
    { y: 0.12, amp: 0.03 }, { y: 0.25, amp: 0.04 }, { y: 0.38, amp: 0.025 },
    { y: 0.52, amp: 0.035 }, { y: 0.65, amp: 0.03 }, { y: 0.78, amp: 0.04 },
    { y: 0.88, amp: 0.025 }, { y: 0.95, amp: 0.03 },
  ];
  for (const c of curves) {
    ctx.beginPath();
    for (let x = 0; x <= size; x += 4) {
      const nx = x / size;
      const y = (c.y + Math.sin(nx * Math.PI * 3) * c.amp +
                 Math.sin(nx * Math.PI * 5 + 1) * c.amp * 0.5) * size;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Even softer secondary curves
  ctx.strokeStyle = 'rgba(200, 200, 220, 0.08)';
  ctx.lineWidth = 1.5;
  const curves2 = [
    { y: 0.06, amp: 0.02 }, { y: 0.18, amp: 0.03 }, { y: 0.32, amp: 0.02 },
    { y: 0.45, amp: 0.025 }, { y: 0.58, amp: 0.02 }, { y: 0.72, amp: 0.03 },
    { y: 0.82, amp: 0.02 }, { y: 0.92, amp: 0.025 },
  ];
  for (const c of curves2) {
    ctx.beginPath();
    for (let x = 0; x <= size; x += 4) {
      const nx = x / size;
      const y = (c.y + Math.sin(nx * Math.PI * 4 + 2) * c.amp +
                 Math.cos(nx * Math.PI * 2.5) * c.amp * 0.4) * size;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

/**
 * Generates an SVG topography pattern for PDF background with faded effect.
 */
function getFadedTopographySvg(): string {
  const svg = `<svg width="2100" height="2970" viewBox="0 0 210 297" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="g1" cx="15%" cy="10%" r="50%">
    <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.04"/>
    <stop offset="100%" stop-color="#4F46E5" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="g2" cx="85%" cy="90%" r="50%">
    <stop offset="0%" stop-color="#6366F1" stop-opacity="0.035"/>
    <stop offset="100%" stop-color="#6366F1" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="210" height="297" fill="url(#g1)"/>
<rect width="210" height="297" fill="url(#g2)"/>
<path d="M0 35C30 25 70 45 105 30C140 15 180 40 210 30" stroke="#C8C8DC" stroke-opacity="0.15" stroke-width="0.8" fill="none"/>
<path d="M0 75C40 60 80 85 120 70C160 55 190 80 210 65" stroke="#C8C8DC" stroke-opacity="0.12" stroke-width="0.8" fill="none"/>
<path d="M0 115C35 100 75 120 110 110C150 100 185 125 210 110" stroke="#C8C8DC" stroke-opacity="0.15" stroke-width="0.8" fill="none"/>
<path d="M0 155C30 145 65 165 105 150C145 135 185 160 210 150" stroke="#C8C8DC" stroke-opacity="0.12" stroke-width="0.8" fill="none"/>
<path d="M0 195C40 180 80 200 115 190C155 180 190 200 210 195" stroke="#C8C8DC" stroke-opacity="0.15" stroke-width="0.8" fill="none"/>
<path d="M0 235C35 225 70 245 110 230C150 215 185 240 210 230" stroke="#C8C8DC" stroke-opacity="0.12" stroke-width="0.8" fill="none"/>
<path d="M0 270C30 260 65 280 105 265C145 250 185 275 210 265" stroke="#C8C8DC" stroke-opacity="0.15" stroke-width="0.8" fill="none"/>
<path d="M0 55C25 48 55 62 85 52C115 42 150 58 180 48C200 42 210 50 210 50" stroke="#C8C8DC" stroke-opacity="0.08" stroke-width="0.5" fill="none"/>
<path d="M0 135C20 128 50 142 80 132C115 122 145 140 180 130C200 124 210 130 210 130" stroke="#C8C8DC" stroke-opacity="0.08" stroke-width="0.5" fill="none"/>
<path d="M0 215C25 208 55 222 85 212C115 202 150 218 180 208C200 202 210 210 210 210" stroke="#C8C8DC" stroke-opacity="0.08" stroke-width="0.5" fill="none"/>
</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

async function overlayIconOnQr(
  ctx: CanvasRenderingContext2D,
  qrX: number, qrY: number, qrSize: number
): Promise<void> {
  try {
    const icon = await loadImage('/branding/icon1.webp');
    const iconSize = Math.round(qrSize * 0.18);
    const iconX = qrX + (qrSize - iconSize) / 2;
    const iconY = qrY + (qrSize - iconSize) / 2;
    const pad = Math.round(iconSize * 0.15);

    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, iconX - pad, iconY - pad, iconSize + pad * 2, iconSize + pad * 2, pad);
    ctx.fill();

    ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
  } catch {
    // Icon not available
  }
}

async function overlayIconOnQrPdf(
  doc: jsPDF, qrImgX: number, qrImgY: number, qrSize: number
): Promise<void> {
  try {
    const iconImg = await loadImage('/branding/icon1.webp');
    const iconB64 = await loadImageToBase64('/branding/icon1.webp');
    const iconRatio = iconImg.naturalWidth / iconImg.naturalHeight;
    const iconH = qrSize * 0.18;
    const iconW = iconH * iconRatio;
    const iconX = qrImgX + (qrSize - iconW) / 2;
    const iconY = qrImgY + (qrSize - iconH) / 2;
    const iconPad = iconH * 0.15;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(
      iconX - iconPad, iconY - iconPad,
      iconW + iconPad * 2, iconH + iconPad * 2,
      iconPad, iconPad, 'F'
    );
    doc.addImage(iconB64, 'PNG', iconX, iconY, iconW, iconH);
  } catch { /* skip */ }
}

// ─── SQUARE IMAGE EXPORT (2400×2400) ───

export async function generateQrImage(options: QrExportOptions): Promise<void> {
  const { surveyTitle, qrCodeUrl, companyName, companyLogoUrl } = options;

  const SIZE = 2400;
  const PAD = 140;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // White base
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Smooth faded background
  drawFadedBackground(ctx, SIZE);

  // ── LAYOUT ZONES ──
  // Header (logos):      PAD → PAD + 120
  // Title:               after header
  // QR + share text:     center
  // qualitivate.io:      below QR
  // Footer (company):    bottom

  const headerH = 120;
  const footerH = 100;
  const headerTop = PAD;
  const headerBottom = headerTop + headerH;
  const footerBottom = SIZE - PAD;
  const footerTop = footerBottom - footerH;
  const contentTop = headerBottom + 40;
  const contentBottom = footerTop - 20;

  // ── HEADER: Qualitivate logo (left) + Company logo (right) ──
  const logoMaxH = 100;
  const logoMaxW = 480;

  try {
    const qLogo = await loadImage('/branding/logo1.webp');
    const qs = fitImageInBox(qLogo, logoMaxW, logoMaxH);
    const logoY = headerTop + (headerH - qs.h) / 2;
    ctx.drawImage(qLogo, isRtl() ? SIZE - PAD - qs.w : PAD, logoY, qs.w, qs.h);
  } catch {
    ctx.font = 'bold 56px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = BRAND_INDIGO;
    ctx.textAlign = isRtl() ? 'right' : 'left';
    ctx.fillText('Qualitivate', isRtl() ? SIZE - PAD : PAD, headerTop + 70);
  }

  if (companyLogoUrl) {
    try {
      const cLogo = await loadImage(companyLogoUrl);
      const cs = fitImageInBox(cLogo, logoMaxW, logoMaxH);
      const cLogoY = headerTop + (headerH - cs.h) / 2;
      ctx.drawImage(cLogo, isRtl() ? PAD : SIZE - PAD - cs.w, cLogoY, cs.w, cs.h);
    } catch {
      if (companyName) {
        ctx.font = '600 40px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.textAlign = isRtl() ? 'left' : 'right';
        ctx.fillText(companyName, isRtl() ? PAD : SIZE - PAD, headerTop + headerH / 2 + 14);
      }
    }
  } else if (companyName) {
    ctx.font = '600 40px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.textAlign = isRtl() ? 'left' : 'right';
    ctx.fillText(companyName, isRtl() ? PAD : SIZE - PAD, headerTop + headerH / 2 + 14);
  }

  // ── TITLE ──
  ctx.textAlign = 'center';
  ctx.fillStyle = TEXT_PRIMARY;
  const titleMaxW = SIZE - PAD * 2 - 80;

  let titleFontSize = 72;
  ctx.font = `bold ${titleFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  let titleLines = wrapText(ctx, surveyTitle, titleMaxW);
  while (titleLines.length > 4 && titleFontSize > 40) {
    titleFontSize -= 4;
    ctx.font = `bold ${titleFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    titleLines = wrapText(ctx, surveyTitle, titleMaxW);
  }

  const titleLineH = titleFontSize * 1.3;
  const titleBlockH = titleLines.length * titleLineH;

  // Remaining space for QR + link below title
  const belowTitleTop = contentTop + titleBlockH + 30;
  const linkFontSize = 42;
  const linkAreaH = linkFontSize + 30;
  const qrAreaH = contentBottom - belowTitleTop - linkAreaH;

  // Draw title
  const titleStartY = contentTop + titleFontSize;
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i], SIZE / 2, titleStartY + i * titleLineH);
  }

  // ── QR CODE ──
  const shareFont = 34;
  const shareTextH = shareFont + 20;
  const qrMaxSize = Math.min(qrAreaH - shareTextH - 40, SIZE - PAD * 4, 1300);
  const qrSize = Math.max(qrMaxSize, 500);
  const framePad = 28;
  const frameRadius = 28;
  const qrFrameSize = qrSize + framePad * 2;
  const totalQrBlock = shareTextH + qrFrameSize;
  const qrBlockY = belowTitleTop + (qrAreaH - totalQrBlock) / 2;

  // "Share your opinion" text above frame
  const shareText = t('export.shareOpinion');
  ctx.font = `600 ${shareFont}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.textAlign = 'center';
  ctx.fillText(`"${shareText}"`, SIZE / 2, qrBlockY + shareFont);

  const qrFrameX = (SIZE - qrFrameSize) / 2;
  const qrFrameY = qrBlockY + shareTextH;
  const qrX = qrFrameX + framePad;
  const qrY = qrFrameY + framePad;

  // Frame
  drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, frameRadius);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = BRAND_INDIGO;
  ctx.lineWidth = 8;
  ctx.stroke();

  try {
    const qrImg = await loadImage(qrCodeUrl);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    await overlayIconOnQr(ctx, qrX, qrY, qrSize);
  } catch {
    ctx.font = '36px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', SIZE / 2, qrY + qrSize / 2);
  }

  // ── QUALITIVATE.IO LINK (middle-bottom, below QR) ──
  const linkY = qrFrameY + qrFrameSize + linkAreaH / 2 + linkFontSize / 3;
  ctx.font = `bold ${linkFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = BRAND_INDIGO;
  ctx.textAlign = 'center';
  ctx.fillText(QUALITIVATE_LINK, SIZE / 2, linkY);

  // ── Download ──
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      'image/png', 1.0
    );
  });
  triggerDownload(blob, `${sanitizeFilename(surveyTitle)}-qr.png`);
}

// ─── A4 PDF EXPORT ───

export async function generateQrPdf(options: QrExportOptions): Promise<void> {
  const { surveyTitle, qrCodeUrl, companyName, companyLogoUrl } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();   // 297
  const margin = 20;

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pw, ph, 'F');

  // Faded topography background
  try {
    doc.addImage(getFadedTopographySvg(), 'SVG', 0, 0, pw, ph, '', 'SLOW');
  } catch { /* skip */ }

  // ── LAYOUT ──
  const headerH = 16;
  const headerTop = margin;
  const headerBottom = headerTop + headerH;
  const contentTop = headerBottom + 10;
  const contentBottom = ph - margin;
  const contentW = pw - margin * 2 - 10;

  // ── HEADER: Qualitivate logo (left) + Company logo (right) ──
  const pdfLogoMaxH = 14;
  const pdfLogoMaxW = 50;

  // Qualitivate logo - preserve ratio
  try {
    const qLogoImg = await loadImage('/branding/logo1.webp');
    const qLogoB64 = await loadImageToBase64('/branding/logo1.webp');
    const qs = fitImageInBox(qLogoImg, pdfLogoMaxW, pdfLogoMaxH);
    const qLogoY = headerTop + (headerH - qs.h) / 2;
    doc.addImage(qLogoB64, 'PNG', margin, qLogoY, qs.w, qs.h);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text('Qualitivate', margin, headerTop + 10);
  }

  // Company logo - preserve ratio
  if (companyLogoUrl) {
    try {
      const cLogoImg = await loadImage(companyLogoUrl);
      const cLogoB64 = await loadImageToBase64(companyLogoUrl);
      const cs = fitImageInBox(cLogoImg, pdfLogoMaxW, pdfLogoMaxH);
      const cLogoY = headerTop + (headerH - cs.h) / 2;
      doc.addImage(cLogoB64, 'PNG', pw - margin - cs.w, cLogoY, cs.w, cs.h);
    } catch {
      if (companyName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text(companyName, pw - margin, headerTop + 10, { align: 'right' });
      }
    }
  } else if (companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(companyName, pw - margin, headerTop + 10, { align: 'right' });
  }

  // Separator
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(margin, headerBottom + 5, pw - margin, headerBottom + 5);

  // ── TITLE ──
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);

  let titleFontSize = 26;
  doc.setFontSize(titleFontSize);
  while (doc.getTextWidth(surveyTitle) > contentW * 2.5 && titleFontSize > 14) {
    titleFontSize -= 1;
    doc.setFontSize(titleFontSize);
  }

  const titleLines: string[] = doc.splitTextToSize(surveyTitle, contentW);
  const titleBlockH = titleLines.length * (titleFontSize * 0.45);
  const titleY = contentTop + 5;
  doc.text(titleLines, pw / 2, titleY, { align: 'center' });

  const belowTitleY = titleY + titleBlockH + 8;

  // ── QR CODE (centered in remaining space) ──
  const linkAreaH = 14;
  const availableForQr = contentBottom - belowTitleY - linkAreaH - 10;
  const qrSize = Math.min(availableForQr - 20, pw - margin * 4, 145);
  const framePad = 6;
  const frameSize = qrSize + framePad * 2;

  // "Share your opinion" above frame
  const shareText = `"${t('export.shareOpinion')}"`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  const shareTextH = 8;
  const totalQrBlock = shareTextH + 4 + frameSize;
  const qrBlockTop = belowTitleY + (availableForQr - totalQrBlock) / 2;

  doc.text(shareText, pw / 2, qrBlockTop + shareTextH - 2, { align: 'center' });

  const frameX = (pw - frameSize) / 2;
  const frameY = qrBlockTop + shareTextH + 4;

  // Frame
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(frameX, frameY, frameSize, frameSize, 4, 4, 'F');
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(2.5);
  doc.roundedRect(frameX, frameY, frameSize, frameSize, 4, 4, 'S');

  // QR image
  const qrImgX = (pw - qrSize) / 2;
  const qrImgY = frameY + framePad;
  try {
    const qrBase64 = await loadImageToBase64(qrCodeUrl);
    doc.addImage(qrBase64, 'PNG', qrImgX, qrImgY, qrSize, qrSize);
  } catch {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('QR Code', pw / 2, qrImgY + qrSize / 2, { align: 'center' });
  }

  // Icon overlay on QR center (preserving ratio)
  await overlayIconOnQrPdf(doc, qrImgX, qrImgY, qrSize);

  // ── QUALITIVATE.IO LINK (middle-bottom, below QR) ──
  const linkY = frameY + frameSize + linkAreaH;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(79, 70, 229);
  doc.text(QUALITIVATE_LINK, pw / 2, linkY, { align: 'center' });

  // ── Save ──
  doc.save(`${sanitizeFilename(surveyTitle)}-qr.pdf`);
}
