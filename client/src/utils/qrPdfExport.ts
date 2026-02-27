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

const BRAND_PRIMARY = '#2D2A6E';
const BRAND_ACCENT = '#6B1D3A';
const BRAND_GRAY = '#6B7280';

/**
 * Loads an image from a URL and returns it as a base64 data URL.
 * Handles both network URLs and existing data URLs.
 */
function loadImageAsBase64(url: string): Promise<string> {
    // If already a data URL, return as-is
    if (url.startsWith('data:')) {
        return Promise.resolve(url);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

/**
 * Draws subtle decorative background curves
 */
function drawBackgroundPattern(doc: jsPDF, width: number, height: number) {
    doc.setDrawColor(230, 230, 235);
    doc.setLineWidth(0.3);

    const seed = 42;
    for (let i = 0; i < 8; i++) {
        const y = 40 + i * 35;
        const amplitude = 15 + (((seed + i * 7) % 10));
        const frequency = 0.02 + (((seed + i * 3) % 5) * 0.002);
        const xOffset = ((seed + i * 11) % 50);

        for (let x = 0; x < width - 3; x += 3) {
            const py1 = y + Math.sin((x + xOffset) * frequency) * amplitude;
            const py2 = y + Math.sin((x + 3 + xOffset) * frequency) * amplitude;
            doc.line(x, py1, x + 3, py2);
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

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Background fill
    doc.setFillColor(252, 252, 253);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative background pattern
    drawBackgroundPattern(doc, pageWidth, pageHeight);

    // ─── HEADER: Logo + Company info ───
    let headerY = margin;

    try {
        const logoBase64 = await loadImageAsBase64('/logo.png');
        doc.addImage(logoBase64, 'PNG', margin, headerY, 50, 14);
    } catch {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(BRAND_PRIMARY);
        doc.text('QUALITIVATE.IO', margin, headerY + 10);
    }

    // Company info at top-right
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

    // Divider
    headerY += 22;
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, headerY, pageWidth - margin, headerY);

    // ─── SURVEY TITLE ───
    const titleY = headerY + 20;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_PRIMARY);

    let titleFontSize = 28;
    doc.setFontSize(titleFontSize);
    while (doc.getTextWidth(surveyTitle) > contentWidth && titleFontSize > 14) {
        titleFontSize -= 1;
        doc.setFontSize(titleFontSize);
    }

    const titleLines: string[] = doc.splitTextToSize(surveyTitle, contentWidth);
    const titleLineHeight = titleFontSize * 0.4;
    const titleTotalHeight = titleLines.length * titleLineHeight;

    doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });

    // ─── QR CODE with branded border ───
    const qrSectionY = titleY + titleTotalHeight + 15;
    const qrBoxSize = 120;
    const qrBorderPadding = 8;
    const qrBorderRadius = 6;

    const borderX = (pageWidth - qrBoxSize - qrBorderPadding * 2) / 2;
    const borderW = qrBoxSize + qrBorderPadding * 2;
    const borderH = qrBoxSize + qrBorderPadding * 2;

    // Border frame
    doc.setDrawColor(BRAND_ACCENT);
    doc.setLineWidth(3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(borderX, qrSectionY, borderW, borderH, qrBorderRadius, qrBorderRadius, 'FD');

    // QR Code image
    try {
        const qrBase64 = await loadImageAsBase64(qrCodeUrl);
        const qrX = (pageWidth - qrBoxSize) / 2;
        const qrY = qrSectionY + qrBorderPadding;
        doc.addImage(qrBase64, 'PNG', qrX, qrY, qrBoxSize, qrBoxSize);
    } catch (e) {
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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BRAND_GRAY);
    doc.text('Open your phone camera and point it at the QR code above', pageWidth / 2, messageY + 7, { align: 'center' });

    // ─── FOOTER ───
    const footerY = pageHeight - margin;

    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);

    // Globe icon
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
    const displayUrl = surveyUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    doc.text(displayUrl, iconX + 5, footerY - 1.5);

    // ─── SAVE ───
    const safeTitle = surveyTitle
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
        .toLowerCase();

    doc.save(`${safeTitle || 'survey'}-qr.pdf`);
}
