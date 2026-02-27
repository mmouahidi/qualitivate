/**
 * QR Code PDF Export Utility
 *
 * Generates a branded A4 PDF flyer with the survey QR code,
 * company logo, survey title, and scan instructions.
 */
import { jsPDF } from 'jspdf';

export interface QrPdfOptions {
    surveyTitle: string;
    qrCodeUrl: string;
    companyName?: string;
    companyActivity?: string;
    surveyUrl: string;
}

// Brand colors
const BRAND_PRIMARY = '#2D2A6E'; // Navy/indigo from logo
const BRAND_ACCENT = '#6B1D3A';  // Maroon from reference image border
const BRAND_GRAY = '#6B7280';
const BRAND_LIGHT = '#F3F4F6';

/**
 * Loads an image from a URL and returns it as a base64 data URL.
 */
async function loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

/**
 * Draws subtle decorative background lines (topographic-style)
 */
function drawBackgroundPattern(doc: jsPDF, width: number, height: number) {
    doc.setDrawColor(230, 230, 235);
    doc.setLineWidth(0.3);

    // Curved decorative lines
    for (let i = 0; i < 8; i++) {
        const y = 40 + i * 35;
        const amplitude = 15 + Math.random() * 10;
        const frequency = 0.02 + Math.random() * 0.01;
        const xOffset = Math.random() * 50;

        const points: [number, number][] = [];
        for (let x = -10; x <= width + 10; x += 3) {
            const py = y + Math.sin((x + xOffset) * frequency) * amplitude;
            points.push([x, py]);
        }

        if (points.length > 1) {
            for (let j = 0; j < points.length - 1; j++) {
                doc.line(points[j][0], points[j][1], points[j + 1][0], points[j + 1][1]);
            }
        }
    }
}

/**
 * Main PDF generation function
 */
export async function generateQrPdf(options: QrPdfOptions): Promise<void> {
    const { surveyTitle, qrCodeUrl, companyName, companyActivity, surveyUrl } = options;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();   // 210
    const pageHeight = doc.internal.pageSize.getHeight();  // 297
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Background
    doc.setFillColor(252, 252, 253);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Subtle decorative background pattern
    drawBackgroundPattern(doc, pageWidth, pageHeight);

    // ─── HEADER: Logo + Company info ───
    let headerY = margin;

    try {
        const logoBase64 = await loadImageAsBase64('/logo.png');
        // Logo at top-left
        doc.addImage(logoBase64, 'PNG', margin, headerY, 50, 14);
    } catch {
        // Fallback: text logo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(BRAND_PRIMARY);
        doc.text('QUALITIVATE.IO', margin, headerY + 10);
    }

    // Company info / activity at top-right
    if (companyName || companyActivity) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(BRAND_GRAY);

        const rightX = pageWidth - margin;
        let infoY = headerY + 5;

        if (companyName) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(companyName, rightX, infoY, { align: 'right' });
            infoY += 5;
        }
        if (companyActivity) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const activities = companyActivity.split(',').map(s => s.trim());
            activities.forEach(activity => {
                doc.text(activity.toUpperCase(), rightX, infoY, { align: 'right' });
                infoY += 4;
            });
        }
    }

    // Thin divider line
    headerY += 22;
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, headerY, pageWidth - margin, headerY);

    // ─── SURVEY TITLE ───
    const titleY = headerY + 20;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_PRIMARY);

    // Scale font to fit
    let titleFontSize = 28;
    doc.setFontSize(titleFontSize);
    while (doc.getTextWidth(surveyTitle) > contentWidth && titleFontSize > 14) {
        titleFontSize -= 1;
        doc.setFontSize(titleFontSize);
    }

    // Split title if it's still too long
    const titleLines = doc.splitTextToSize(surveyTitle, contentWidth);
    const titleLineHeight = titleFontSize * 0.4;
    const titleTotalHeight = titleLines.length * titleLineHeight;

    doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });

    // ─── QR CODE with branded border ───
    const qrSectionY = titleY + titleTotalHeight + 15;
    const qrBoxSize = 120; // mm
    const qrBorderPadding = 8;
    const qrBorderRadius = 6;

    // Outer border (maroon/brand accent)
    const borderX = (pageWidth - qrBoxSize - qrBorderPadding * 2) / 2;
    const borderY = qrSectionY;
    const borderW = qrBoxSize + qrBorderPadding * 2;
    const borderH = qrBoxSize + qrBorderPadding * 2;

    doc.setDrawColor(BRAND_ACCENT);
    doc.setLineWidth(3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(borderX, borderY, borderW, borderH, qrBorderRadius, qrBorderRadius, 'FD');

    // QR Code image
    try {
        const qrBase64 = await loadImageAsBase64(qrCodeUrl);
        const qrX = (pageWidth - qrBoxSize) / 2;
        const qrY = qrSectionY + qrBorderPadding;
        doc.addImage(qrBase64, 'PNG', qrX, qrY, qrBoxSize, qrBoxSize);
    } catch {
        // Fallback: placeholder text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(BRAND_GRAY);
        doc.text('QR Code could not be loaded', pageWidth / 2, qrSectionY + qrBoxSize / 2, { align: 'center' });
    }

    // ─── SCAN MESSAGE ───
    const messageY = qrSectionY + borderH + 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(BRAND_PRIMARY);
    doc.text('Scan the QR code to participate', pageWidth / 2, messageY, { align: 'center' });

    // Sub-message
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BRAND_GRAY);
    doc.text('Open your phone camera and point it at the QR code above', pageWidth / 2, messageY + 7, { align: 'center' });

    // ─── FOOTER: URL ───
    const footerY = pageHeight - margin;

    // Footer divider
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);

    // Globe icon (circle + lines) as a simple drawn icon
    const iconX = pageWidth / 2 - 30;
    const iconY = footerY - 3;
    doc.setDrawColor(BRAND_ACCENT);
    doc.setLineWidth(0.5);
    doc.circle(iconX, iconY, 2.5, 'S');
    doc.line(iconX - 2.5, iconY, iconX + 2.5, iconY);
    doc.line(iconX, iconY - 2.5, iconX, iconY + 2.5);

    // URL text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BRAND_GRAY);

    // Clean up URL for display
    const displayUrl = surveyUrl
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');

    doc.text(displayUrl, iconX + 5, footerY - 1.5);

    // ─── SAVE ───
    const safeTitle = surveyTitle
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
        .toLowerCase();

    doc.save(`${safeTitle}-qr.pdf`);
}
