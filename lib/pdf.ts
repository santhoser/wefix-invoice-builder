import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { CompanyProfile, FullInvoice } from '@/types/invoice';

const NAVY = '#1e3a5f';
const LIGHT_GRAY = '#f5f5f5';
const MID_GRAY = '#9ca3af';
const DARK_GRAY = '#374151';
const BLACK = '#111827';
const WHITE = '#ffffff';
const ACCENT = '#2563eb';

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export async function generateInvoicePDF(fullInvoice: FullInvoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { invoice, items, company } = fullInvoice;

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: company.companyName,
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // ── Header Background ─────────────────────────────────────────────────────
    doc.rect(0, 0, pageWidth, 140).fill(NAVY);

    // ── Logo ──────────────────────────────────────────────────────────────────
    const logoPath = path.join(process.cwd(), 'public', 'wefix_logo.png');
    let logoLoaded = false;
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, marginLeft, 20, { width: 100, height: 80 });
        logoLoaded = true;
      } catch {
        logoLoaded = false;
      }
    }

    if (!logoLoaded) {
      // Fallback text logo
      doc.fontSize(20).fillColor(WHITE).font('Helvetica-Bold')
        .text('WEFIX', marginLeft, 35)
        .text('HANDYMAN', marginLeft, 55);
    }

    // ── Company Info (right side of header) ───────────────────────────────────
    const companyX = pageWidth - marginRight - 220;
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(16)
      .text(company.companyName, companyX, 22, { width: 220, align: 'right' });

    doc.font('Helvetica').fontSize(9).fillColor('#c7d8f0');
    let companyY = 46;

    const addressParts = [company.addressLine1];
    if (company.addressLine2) addressParts.push(company.addressLine2);
    const locationPart = [company.suburb, company.state, company.pin].filter(Boolean).join(' ');
    if (locationPart) addressParts.push(locationPart);
    addressParts.forEach((line) => {
      doc.text(line, companyX, companyY, { width: 220, align: 'right' });
      companyY += 13;
    });

    if (company.phone) {
      doc.text(`Ph: ${company.phone}`, companyX, companyY, { width: 220, align: 'right' });
      companyY += 13;
    }
    if (invoice.includeAbn && company.abn) {
      doc.text(`ABN: ${company.abn}`, companyX, companyY, { width: 220, align: 'right' });
      companyY += 13;
    }
    if (company.email) {
      doc.text(company.email, companyX, companyY, { width: 220, align: 'right' });
    }

    // ── INVOICE title bar ─────────────────────────────────────────────────────
    const titleBarY = 140;
    doc.rect(0, titleBarY, pageWidth, 36).fill(ACCENT);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(20)
      .text('INVOICE', marginLeft, titleBarY + 8, { width: contentWidth, align: 'center' });

    // ── Invoice # and Date (right side) ───────────────────────────────────────
    const infoY = titleBarY + 55;
    const rightCol = pageWidth - marginRight - 200;

    doc.rect(rightCol - 10, infoY - 10, 210, 54).fillAndStroke('#f0f4ff', '#dde5ff');
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
      .text('INVOICE #', rightCol, infoY, { width: 80 });
    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(invoice.invoiceNumber, rightCol + 80, infoY, { width: 120 });

    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
      .text('DATE', rightCol, infoY + 20, { width: 80 });
    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(formatDate(invoice.invoiceDate), rightCol + 80, infoY + 20, { width: 120 });

    // ── Bill To ───────────────────────────────────────────────────────────────
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
      .text('BILL TO:', marginLeft, infoY);

    doc.fillColor(BLACK).font('Helvetica').fontSize(9);
    let billY = infoY + 18;
    doc.font('Helvetica-Bold').text(invoice.customerName, marginLeft, billY);
    billY += 14;
    doc.font('Helvetica').text(invoice.customerAddress, marginLeft, billY);
    billY += 14;
    const cityLine = [invoice.customerSuburb, invoice.customerState, invoice.customerPin].filter(Boolean).join(' ');
    doc.text(cityLine, marginLeft, billY);
    billY += 14;
    if (invoice.customerPhone) {
      doc.text(`Ph: ${invoice.customerPhone}`, marginLeft, billY);
      billY += 14;
    }
    if (invoice.customerEmail) {
      doc.text(invoice.customerEmail, marginLeft, billY);
    }

    // ── Items Table ───────────────────────────────────────────────────────────
    const tableStartY = Math.max(infoY + 90, billY + 30);

    // Table header
    doc.rect(marginLeft, tableStartY, contentWidth, 24).fill(NAVY);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
      .text('DESCRIPTION', marginLeft + 10, tableStartY + 7, { width: contentWidth - 120 })
      .text('AMOUNT', pageWidth - marginRight - 100, tableStartY + 7, { width: 90, align: 'right' });

    // Table rows
    let rowY = tableStartY + 24;
    items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? WHITE : LIGHT_GRAY;
      const rowHeight = 28;

      doc.rect(marginLeft, rowY, contentWidth, rowHeight).fill(bgColor);
      doc.fillColor(DARK_GRAY).font('Helvetica').fontSize(9)
        .text(item.description, marginLeft + 10, rowY + 6, { width: contentWidth - 140 });

      if (item.quantity !== 1) {
        doc.fillColor(MID_GRAY).fontSize(8)
          .text(`Qty: ${item.quantity} × ${formatCurrency(item.unitPrice)}`,
            marginLeft + 10, rowY + 17, { width: contentWidth - 140 });
      }

      doc.fillColor(DARK_GRAY).font('Helvetica').fontSize(9)
        .text(formatCurrency(item.lineTotal), pageWidth - marginRight - 100, rowY + 10,
          { width: 90, align: 'right' });

      rowY += rowHeight;
    });

    // Bottom border of table
    doc.rect(marginLeft, rowY, contentWidth, 1).fill(NAVY);

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalsX = pageWidth - marginRight - 220;
    let totalsY = rowY + 20;

    const subtotalAmount = invoice.subtotalAmount;
    const taxAmount = invoice.taxAmount;
    const totalAmount = invoice.totalAmount;
    const taxRate = invoice.taxRate;

    // Subtotal row
    doc.rect(totalsX, totalsY - 4, 220, 22).fill(LIGHT_GRAY);
    doc.fillColor(DARK_GRAY).font('Helvetica').fontSize(9)
      .text('SUBTOTAL', totalsX + 10, totalsY + 2, { width: 110 });
    doc.text(formatCurrency(subtotalAmount), totalsX + 110, totalsY + 2, { width: 100, align: 'right' });

    totalsY += 22;
    doc.rect(totalsX, totalsY - 4, 220, 22).fill(WHITE);
    doc.fillColor(DARK_GRAY).font('Helvetica').fontSize(9)
      .text(`GST (${taxRate}%)`, totalsX + 10, totalsY + 2, { width: 110 });
    doc.text(formatCurrency(taxAmount), totalsX + 110, totalsY + 2, { width: 100, align: 'right' });

    totalsY += 22;
    doc.rect(totalsX, totalsY - 4, 220, 28).fill(NAVY);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
      .text('TOTAL', totalsX + 10, totalsY + 5, { width: 110 })
      .text(formatCurrency(totalAmount), totalsX + 110, totalsY + 5, { width: 100, align: 'right' });

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = pageHeight - 110;
    doc.rect(0, footerY - 10, pageWidth, 1).fill('#e5e7eb');

    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11)
      .text('Thank you for choosing ' + company.companyName + '!',
        marginLeft, footerY + 5, { width: contentWidth, align: 'center' });

    doc.fillColor(MID_GRAY).font('Helvetica').fontSize(8)
      .text('We appreciate your business.', marginLeft, footerY + 22,
        { width: contentWidth, align: 'center' });

    // Account details
    const hasAccountDetails = company.accountName || company.bsb || company.accountNumber || company.payId;
    if (hasAccountDetails) {
      doc.rect(marginLeft, footerY + 42, contentWidth, 28).fill(LIGHT_GRAY);

      const accountParts: string[] = [];
      if (company.accountName) accountParts.push(`Account: ${company.accountName}`);
      if (company.bsb) accountParts.push(`BSB: ${company.bsb}`);
      if (company.accountNumber) accountParts.push(`Account No: ${company.accountNumber}`);
      if (company.payId) accountParts.push(`PayID: ${company.payId}`);

      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8)
        .text('PAYMENT DETAILS', marginLeft + 10, footerY + 46, { width: contentWidth - 20 });
      doc.fillColor(DARK_GRAY).font('Helvetica').fontSize(8)
        .text(accountParts.join('  |  '), marginLeft + 10, footerY + 58, { width: contentWidth - 20 });
    }

    // Contact line
    const contactParts: string[] = [];
    if (company.contactName) contactParts.push(company.contactName);
    if (company.contactPhone) contactParts.push(`Ph: ${company.contactPhone}`);
    if (company.email) contactParts.push(company.email);

    if (contactParts.length > 0) {
      doc.fillColor(MID_GRAY).font('Helvetica').fontSize(8)
        .text(contactParts.join('  |  '), marginLeft, footerY + 80,
          { width: contentWidth, align: 'center' });
    }

    doc.end();
  });
}
