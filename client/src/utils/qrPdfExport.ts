/**
 * QR Code Export Utility
 *
 * Generates branded assets for survey distribution:
 * - Square PNG image (2400×2400)
 * - A4 PDF flyer (210×297mm)
 *
 * Both include: Qualitivate logo, company logo, survey title,
 * QR code with branded center icon, and qualitivate.io link.
 * All text labels respect the current i18n language.
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

function getTopographyBase64(): string {
  const svg = `<svg width="2400" height="2400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 20C40 10 70 30 80 10" stroke="#F0F0F5" stroke-width="1.5" fill="none"/>
<path d="M10 50C30 40 60 60 90 50" stroke="#F0F0F5" stroke-width="1.5" fill="none"/>
<path d="M20 80C40 70 70 90 80 80" stroke="#F0F0F5" stroke-width="1.5" fill="none"/>
<path d="M5 10C25 0 55 20 65 0" stroke="#F5F5FA" stroke-width="1" fill="none"/>
<path d="M35 15C55 5 85 25 95 5" stroke="#F5F5FA" stroke-width="1" fill="none"/>
<path d="M0 30C20 20 50 40 80 30" stroke="#F5F5FA" stroke-width="1" fill="none"/>
<path d="M15 40C35 30 65 50 95 40" stroke="#F5F5FA" stroke-width="1" fill="none"/>
<path d="M5 60C25 50 55 70 85 60" stroke="#F5F5FA" stroke-width="1" fill="none"/>
<path d="M15 70C35 60 65 80 95 70" stroke="#F5F5FA" stroke-width="1" fill="none"/>
<path d="M0 90C20 80 50 100 80 90" stroke="#F5F5FA" stroke-width="1" fill="none"/>
<path d="M30 95C50 85 80 105 90 85" stroke="#F5F5FA" stroke-width="1" fill="none"/>
<path d="M10 25C15 20 25 30 35 25" stroke="#EBEBF0" stroke-width="0.5" fill="none"/>
<path d="M60 15C65 10 75 20 85 15" stroke="#EBEBF0" stroke-width="0.5" fill="none"/>
<path d="M20 55C25 50 35 60 45 55" stroke="#EBEBF0" stroke-width="0.5" fill="none"/>
<path d="M70 45C75 40 85 50 95 45" stroke="#EBEBF0" stroke-width="0.5" fill="none"/>
<path d="M10 85C15 80 25 90 35 85" stroke="#EBEBF0" stroke-width="0.5" fill="none"/>
<path d="M60 75C65 70 75 80 85 75" stroke="#EBEBF0" stroke-width="0.5" fill="none"/>
<path d="M25 15C31 12 38 18 42 16" stroke="#F0F0F5" stroke-width="0.6" fill="none"/>
<path d="M65 35C71 32 78 38 82 36" stroke="#F0F0F5" stroke-width="0.6" fill="none"/>
<path d="M15 65C21 62 28 68 32 66" stroke="#F0F0F5" stroke-width="0.6" fill="none"/>
<path d="M75 65C81 62 88 68 92 66" stroke="#F0F0F5" stroke-width="0.6" fill="none"/>
<path d="M40 85C46 82 53 88 57 86" stroke="#F0F0F5" stroke-width="0.6" fill="none"/>
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
    // Icon not available, QR stays as-is
  }
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

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Topography background pattern
  try {
    const bgImg = await loadImage(getTopographyBase64());
    ctx.drawImage(bgImg, 0, 0, SIZE, SIZE);
  } catch { /* skip */ }

  // Layout zones (evenly distributed):
  //   Header:  PAD → headerEnd
  //   Title:   titleStart → titleEnd
  //   QR:      qrStart → qrEnd
  //   Footer:  footerStart → SIZE - PAD
  const headerH = 120;
  const footerH = 120;
  const separatorGap = 40;

  const headerTop = PAD;
  const headerBottom = headerTop + headerH;
  const footerBottom = SIZE - PAD;
  const footerTop = footerBottom - footerH;

  const contentTop = headerBottom + separatorGap;
  const contentBottom = footerTop - separatorGap;
  const contentH = contentBottom - contentTop;

  // ── HEADER: Qualitivate logo (left) + www.qualitivate.io (right) ──
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

  // Globe icon + www.qualitivate.io on opposite side
  ctx.font = '500 36px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.textAlign = isRtl() ? 'left' : 'right';
  const linkX = isRtl() ? PAD : SIZE - PAD;
  const linkY = headerTop + headerH / 2 + 12;

  // Draw globe circle
  const globeX = isRtl() ? linkX + ctx.measureText(QUALITIVATE_LINK).width + 30 : linkX - ctx.measureText(QUALITIVATE_LINK).width - 30;
  const globeY = linkY - 10;
  const globeR = 14;
  ctx.strokeStyle = TEXT_SECONDARY;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(globeX, globeY, globeR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(globeX - globeR, globeY);
  ctx.lineTo(globeX + globeR, globeY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(globeX, globeY - globeR);
  ctx.lineTo(globeX, globeY + globeR);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(globeX, globeY, globeR * 0.5, globeR, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillText(QUALITIVATE_LINK, linkX, linkY);

  // ── Separator after header ──
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, headerBottom + separatorGap / 2);
  ctx.lineTo(SIZE - PAD, headerBottom + separatorGap / 2);
  ctx.stroke();

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

  // Title gets ~30% of content area, QR gets ~70%
  const titleAreaH = Math.min(contentH * 0.3, titleBlockH + 60);
  const qrAreaTop = contentTop + titleAreaH;
  const qrAreaH = contentBottom - qrAreaTop;

  const titleStartY = contentTop + (titleAreaH - titleBlockH) / 2 + titleFontSize;
  for (const line of titleLines) {
    ctx.fillText(line, SIZE / 2, titleStartY + titleLines.indexOf(line) * titleLineH);
  }

  // ── QR CODE ──
  const qrMaxSize = Math.min(qrAreaH - 160, SIZE - PAD * 4, 1300);
  const qrSize = Math.max(qrMaxSize, 600);
  const framePad = 28;
  const frameRadius = 28;
  const qrFrameSize = qrSize + framePad * 2;
  const qrFrameX = (SIZE - qrFrameSize) / 2;
  const qrFrameY = qrAreaTop + (qrAreaH - qrFrameSize - 100) / 2;
  const qrX = qrFrameX + framePad;
  const qrY = qrFrameY + framePad;

  // Frame
  drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, frameRadius);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = BRAND_INDIGO;
  ctx.lineWidth = 8;
  ctx.stroke();

  // "Share your opinion" text inside frame, above QR
  const shareText = t('export.shareOpinion');
  ctx.font = `600 32px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.textAlign = 'center';
  // Position above QR within the frame area isn't great; put it just above the frame
  ctx.fillText(`"${shareText}"`, SIZE / 2, qrFrameY - 20);

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

  // ── FOOTER: Company logo (left) + company website (right) ──
  // Separator before footer
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, footerTop - separatorGap / 2);
  ctx.lineTo(SIZE - PAD, footerTop - separatorGap / 2);
  ctx.stroke();

  let companyLogoDrawn = false;
  if (companyLogoUrl) {
    try {
      const cLogo = await loadImage(companyLogoUrl);
      const cs = fitImageInBox(cLogo, 400, 100);
      const cLogoY = footerTop + (footerH - cs.h) / 2;
      ctx.drawImage(cLogo, isRtl() ? SIZE - PAD - cs.w : PAD, cLogoY, cs.w, cs.h);
      companyLogoDrawn = true;
    } catch { /* skip */ }
  }
  if (!companyLogoDrawn && companyName) {
    ctx.font = 'bold 40px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.textAlign = isRtl() ? 'right' : 'left';
    ctx.fillText(companyName, isRtl() ? SIZE - PAD : PAD, footerTop + footerH / 2 + 14);
  }

  // qualitivate.io on footer right
  ctx.font = 'bold 36px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = BRAND_INDIGO;
  ctx.textAlign = isRtl() ? 'left' : 'right';
  ctx.fillText(QUALITIVATE_LINK, isRtl() ? PAD : SIZE - PAD, footerTop + footerH / 2 + 14);

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

  // Topography background
  try {
    doc.addImage(getTopographyBase64(), 'SVG', 0, 0, pw, ph, '', 'SLOW');
  } catch { /* skip */ }

  // Layout zones
  const headerH = 16;
  const footerH = 16;
  const gap = 8;

  const headerTop = margin;
  const headerBottom = headerTop + headerH;
  const footerBottom = ph - margin;
  const footerTop = footerBottom - footerH;

  const contentTop = headerBottom + gap;
  const contentBottom = footerTop - gap;
  const contentH = contentBottom - contentTop;
  const contentW = pw - margin * 2 - 10;

  // ── HEADER: Qualitivate logo (left) + www.qualitivate.io (right) ──
  try {
    const qLogoB64 = await loadImageToBase64('/branding/logo1.webp');
    doc.addImage(qLogoB64, 'PNG', margin, headerTop, 45, 14);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text('Qualitivate', margin, headerTop + 10);
  }

  // Globe icon + link
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  const linkTextW = doc.getTextWidth(QUALITIVATE_LINK);
  const linkRightX = pw - margin;
  doc.text(QUALITIVATE_LINK, linkRightX, headerTop + 9, { align: 'right' });

  // Globe
  const gx = linkRightX - linkTextW - 6;
  const gy = headerTop + 6;
  doc.setDrawColor(107, 114, 128);
  doc.setLineWidth(0.3);
  doc.circle(gx, gy, 3, 'S');
  doc.line(gx - 3, gy, gx + 3, gy);
  doc.line(gx, gy - 3, gx, gy + 3);
  doc.ellipse(gx, gy, 1.5, 3, 'S');

  // Separator
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, headerBottom + gap / 2, pw - margin, headerBottom + gap / 2);

  // ── SURVEY TITLE ──
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

  // Title area: ~25% of content
  const titleAreaH = Math.min(contentH * 0.25, titleBlockH + 20);
  const qrAreaTop = contentTop + titleAreaH;
  const qrAreaH = contentBottom - qrAreaTop;

  const titleY = contentTop + (titleAreaH - titleBlockH) / 2 + titleFontSize * 0.35;
  doc.text(titleLines, pw / 2, titleY, { align: 'center' });

  // ── QR CODE ──
  const qrSize = Math.min(qrAreaH - 30, pw - margin * 4, 140);
  const framePad = 6;
  const frameSize = qrSize + framePad * 2;
  const frameX = (pw - frameSize) / 2;

  // Center QR vertically in qrArea, leaving room for text above
  const shareText = `"${t('export.shareOpinion')}"`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const shareTextH = 8;

  const totalQrBlock = shareTextH + 4 + frameSize;
  const qrBlockY = qrAreaTop + (qrAreaH - totalQrBlock) / 2;

  // "Share your opinion" text above QR frame
  doc.setTextColor(17, 24, 39);
  doc.text(shareText, pw / 2, qrBlockY + shareTextH - 2, { align: 'center' });

  const frameY = qrBlockY + shareTextH + 4;

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

  // Qualitivate icon overlay on QR center
  try {
    const iconB64 = await loadImageToBase64('/branding/icon1.webp');
    const iconSize = qrSize * 0.18;
    const iconX = qrImgX + (qrSize - iconSize) / 2;
    const iconY = qrImgY + (qrSize - iconSize) / 2;
    const iconPad = iconSize * 0.15;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(iconX - iconPad, iconY - iconPad, iconSize + iconPad * 2, iconSize + iconPad * 2, iconPad, iconPad, 'F');
    doc.addImage(iconB64, 'PNG', iconX, iconY, iconSize, iconSize);
  } catch { /* skip */ }

  // ── FOOTER ──
  // Separator
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, footerTop - gap / 2, pw - margin, footerTop - gap / 2);

  // Company logo (left)
  let companyLogoDrawn = false;
  if (companyLogoUrl) {
    try {
      const cB64 = await loadImageToBase64(companyLogoUrl);
      doc.addImage(cB64, 'PNG', margin, footerTop, 40, 14);
      companyLogoDrawn = true;
    } catch { /* skip */ }
  }
  if (!companyLogoDrawn && companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(companyName, margin, footerTop + 10);
  }

  // qualitivate.io (right) with globe
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text(QUALITIVATE_LINK, pw - margin, footerTop + 10, { align: 'right' });

  const fLinkW = doc.getTextWidth(QUALITIVATE_LINK);
  const fgx = pw - margin - fLinkW - 6;
  const fgy = footerTop + 7;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.3);
  doc.circle(fgx, fgy, 3, 'S');
  doc.line(fgx - 3, fgy, fgx + 3, fgy);
  doc.line(fgx, fgy - 3, fgx, fgy + 3);
  doc.ellipse(fgx, fgy, 1.5, 3, 'S');

  // ── Save ──
  doc.save(`${sanitizeFilename(surveyTitle)}-qr.pdf`);
}
