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
 * Gets the base64 SVG topography background
 */
function getTopographyBase64(): string {
    const svg = `<svg width="800" height="1131" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M50 0V100M0 50H100" stroke="#E5E7EB" stroke-width="1"/>
<path d="M20 20C40 10 70 30 80 10" stroke="#F3F4F6" stroke-width="2" fill="none"/>
<path d="M10 50C30 40 60 60 90 50" stroke="#F3F4F6" stroke-width="2" fill="none"/>
<path d="M20 80C40 70 70 90 80 80" stroke="#F3F4F6" stroke-width="2" fill="none"/>
<path d="M5 10C25 0 55 20 65 0" stroke="#F9FAFB" stroke-width="1.5" fill="none"/>
<path d="M35 15C55 5 85 25 95 5" stroke="#F9FAFB" stroke-width="1.5" fill="none"/>
<path d="M0 30C20 20 50 40 80 30" stroke="#F9FAFB" stroke-width="1.5" fill="none"/>
<path d="M15 40C35 30 65 50 95 40" stroke="#F9FAFB" stroke-width="1.5" fill="none"/>
<path d="M5 60C25 50 55 70 85 60" stroke="#F9FAFB" stroke-width="1.5" fill="none"/>
<path d="M15 70C35 60 65 80 95 70" stroke="#F9FAFB" stroke-width="1.5" fill="none"/>
<path d="M0 90C20 80 50 100 80 90" stroke="#F9FAFB" stroke-width="1.5" fill="none"/>
<path d="M30 95C50 85 80 105 90 85" stroke="#F9FAFB" stroke-width="1.5" fill="none"/>
<path d="M10 25C15 20 25 30 35 25" stroke="#E5E7EB" stroke-width="0.5" fill="none"/>
<path d="M60 15C65 10 75 20 85 15" stroke="#E5E7EB" stroke-width="0.5" fill="none"/>
<path d="M20 55C25 50 35 60 45 55" stroke="#E5E7EB" stroke-width="0.5" fill="none"/>
<path d="M70 45C75 40 85 50 95 45" stroke="#E5E7EB" stroke-width="0.5" fill="none"/>
<path d="M10 85C15 80 25 90 35 85" stroke="#E5E7EB" stroke-width="0.5" fill="none"/>
<path d="M60 75C65 70 75 80 85 75" stroke="#E5E7EB" stroke-width="0.5" fill="none"/>
<path d="M25 15C31 12 38 18 42 16" stroke="#F3F4F6" stroke-width="0.8" fill="none"/>
<path d="M65 35C71 32 78 38 82 36" stroke="#F3F4F6" stroke-width="0.8" fill="none"/>
<path d="M15 65C21 62 28 68 32 66" stroke="#F3F4F6" stroke-width="0.8" fill="none"/>
<path d="M75 65C81 62 88 68 92 66" stroke="#F3F4F6" stroke-width="0.8" fill="none"/>
<path d="M40 85C46 82 53 88 57 86" stroke="#F3F4F6" stroke-width="0.8" fill="none"/>
</svg>`;
    const base64 = btoa(svg);
    return `data:image/svg+xml;base64,${base64}`;
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

    // Background fill (white base)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative static SVG background pattern
    doc.addImage(getTopographyBase64(), 'SVG', 0, 0, pageWidth, pageHeight, '', 'SLOW');

    // ─── HEADER ───
    let headerY = margin;

    // Top Left Logo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);

    try {
        // Try exact logo.webp first to match the brand mark
        const logoBase64 = await loadImageAsBase64('/branding/logo1.webp');
        // Assume logo has text, size accordingly based on natural ratio
        doc.addImage(logoBase64, 'WEBP', margin, headerY, 45, 12);
    } catch {
        // Fallback text
        doc.setFont('helvetica', 'bold');
        doc.text('Qualitivate', margin, headerY + 8);
    }

    // Top Right URL
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const topRightText = 'www.qualtivate.io';
    const textWidth = doc.getTextWidth(topRightText);
    const topRightX = pageWidth - margin - textWidth;

    // Draw simple globe icon
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    const topIconX = topRightX - 6;
    const topIconY = headerY + 4;
    doc.circle(topIconX, topIconY, 3, 'S');
    doc.line(topIconX - 3, topIconY, topIconX + 3, topIconY);
    doc.line(topIconX, topIconY - 3, topIconX, topIconY + 3);
    // Draw ellipse for globe effect
    doc.ellipse(topIconX, topIconY, 1.5, 3, 'S');

    doc.text(topRightText, topRightX, headerY + 5.5);

    // ─── SURVEY TITLE ───
    doc.setFont('helvetica', 'normal');
    // Using a thin, crisp font appearance
    doc.setTextColor(0, 0, 0);

    let titleFontSize = 26;
    doc.setFontSize(titleFontSize);
    const contentWidth = pageWidth - margin * 4; // Much narrower for centered text

    while (doc.getTextWidth(surveyTitle) > contentWidth && titleFontSize > 14) {
        titleFontSize -= 1;
        doc.setFontSize(titleFontSize);
    }

    const titleLines: string[] = doc.splitTextToSize(surveyTitle, contentWidth);
    const titleTotalHeight = titleLines.length * (titleFontSize * 0.35);

    // Position title centered about 40mm down from top
    const titleY = 55;
    doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });

    // ─── QR CODE FRAME ───
    // Fixed height layout based on template ratio
    const qrSectionY = titleY + titleTotalHeight + 15;
    const borderPadding = 8;
    // Calculate square box width filling most of page width
    const borderW = pageWidth - (margin * 3.5);
    const borderH = borderW; // Perfect square
    const borderX = (pageWidth - borderW) / 2;
    const qrBorderRadius = 4;

    // Draw the massive thick blurple frame
    doc.setDrawColor(79, 70, 229); // #4F46E5 Brand
    doc.setLineWidth(3.5);
    doc.setFillColor(255, 255, 255);

    // Fill white first to obscure the topography behind the QR area
    doc.roundedRect(borderX, qrSectionY, borderW, borderH, qrBorderRadius, qrBorderRadius, 'F');
    // Draw stroke
    doc.roundedRect(borderX, qrSectionY, borderW, borderH, qrBorderRadius, qrBorderRadius, 'S');

    // ─── QR CODE IMAGE ───
    const qrBoxSize = borderW - (borderPadding * 2);
    try {
        const qrBase64 = await loadImageAsBase64(qrCodeUrl);
        const qrX = borderX + borderPadding;
        const qrY = qrSectionY + borderPadding;
        doc.addImage(qrBase64, 'PNG', qrX, qrY, qrBoxSize, qrBoxSize);
    } catch (e) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text('QR Code rendering failed', pageWidth / 2, qrSectionY + borderH / 2, { align: 'center' });
    }

    // ─── FOOTER ───
    const footerY = pageHeight - margin - 5;

    // Left Logo (Afflatus logic)
    // The design is specific to Afflatus Consulting Group. We will try to load their logo if we have it,
    // otherwise fallback to text. If the server provides a logo in the future, we can wire it.
    try {
        // Look for the specific abstract triangle logo if it exists dynamically in assets
        const footerLogoBase64 = await loadImageAsBase64('/images/logo.png');
        doc.addImage(footerLogoBase64, 'PNG', margin, footerY - 12, 40, 15);
    } catch {
        // Text fallback
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        // Multi-line Afflatus styling
        const cLines = (companyName || 'Afflatus Consulting').split(' ');
        let cy = footerY - 8;
        cLines.forEach(l => {
            doc.text(l, margin + 5, cy);
            cy += 5;
        });

        // Faux logo mark
        doc.setDrawColor(107, 29, 58); // Maroon
        doc.setLineWidth(1);
        doc.line(margin, footerY - 15, margin, footerY);
    }

    // Right side website 
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const displayUrl = 'www.afflatus.consulting';
    const bTextWidth = doc.getTextWidth(displayUrl);
    const bRightX = pageWidth - margin - bTextWidth;

    // Bottom globe icon
    const bIconX = bRightX - 6;
    const bIconY = footerY - 1.5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.circle(bIconX, bIconY, 3, 'S');
    doc.line(bIconX - 3, bIconY, bIconX + 3, bIconY);
    doc.line(bIconX, bIconY - 3, bIconX, bIconY + 3);
    doc.ellipse(bIconX, bIconY, 1.5, 3, 'S');

    doc.text(displayUrl, bRightX, footerY);

    // ─── SAVE ───
    const safeTitle = surveyTitle
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
        .toLowerCase();

    doc.save(`${safeTitle || 'survey'}-qr.pdf`);
}
