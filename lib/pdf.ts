import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import type { FullInvoice } from '@/types/invoice';

const NAVY = '#305496';
const BORDER = '#203764';
const TOTAL_LABEL = '#B4C6E7';
const TOTAL_VALUE = '#D9E2F3';
const BLACK = '#000000';
const WHITE = '#ffffff';

const PAGE = {
  width: 595.28,
  height: 841.89,
  frameX: 65.04,
  frameY: 85.77,
  frameW: 482.88,
  frameH: 679.9,
  left: 66.48,
  right: 545.52,
  contentW: 479.04,
};

const TABLE = {
  x: 66.48,
  y: 347.06,
  w: 479.04,
  headerH: 16.08,
  rowH: 15.96,
  descX: 66.48,
  descW: 315.19,
  qtyX: 381.67,
  qtyW: 28.2,
  unitX: 409.87,
  unitW: 53.31,
  amountX: 463.18,
  amountW: 82.34,
};

const TOTALS = {
  x: 381.67,
  y: 650.35,
  labelW: 81.51,
  valueW: 82.34,
  rowH: 14.04,
  totalH: 16.68,
};

type FontSet = {
  regular: string;
  bold: string;
  italic: string;
  boldItalic: string;
};

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCurrencyValue(amount: number): string {
  return amount.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = Math.max(0, Math.min(11, Number(month) - 1));
  return `${day}-${monthNames[monthIndex]}-${year.slice(-2)}`;
}

function registerFonts(doc: PDFKit.PDFDocument): FontSet {
  const fonts: FontSet = {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
    boldItalic: 'Helvetica-BoldOblique',
  };

  const fontsDir = path.join(process.env.SystemRoot || 'C:\\Windows', 'Fonts');
  const candidates = {
    regular: path.join(fontsDir, 'calibri.ttf'),
    bold: path.join(fontsDir, 'calibrib.ttf'),
    italic: path.join(fontsDir, 'calibrii.ttf'),
    boldItalic: path.join(fontsDir, 'calibriz.ttf'),
  };

  try {
    if (fs.existsSync(candidates.regular)) {
      doc.registerFont('Calibri', candidates.regular);
      fonts.regular = 'Calibri';
    }
    if (fs.existsSync(candidates.bold)) {
      doc.registerFont('Calibri-Bold', candidates.bold);
      fonts.bold = 'Calibri-Bold';
    }
    if (fs.existsSync(candidates.italic)) {
      doc.registerFont('Calibri-Italic', candidates.italic);
      fonts.italic = 'Calibri-Italic';
    }
    if (fs.existsSync(candidates.boldItalic)) {
      doc.registerFont('Calibri-BoldItalic', candidates.boldItalic);
      fonts.boldItalic = 'Calibri-BoldItalic';
    }
  } catch {
    return fonts;
  }

  return fonts;
}

function text(
  doc: PDFKit.PDFDocument,
  value: string,
  x: number,
  y: number,
  options: PDFKit.Mixins.TextOptions & {
    font?: string;
    size?: number;
    color?: string;
  } = {}
) {
  const { font = 'Helvetica', size = 10, color = BLACK, ...textOptions } = options;
  doc.font(font).fontSize(size).fillColor(color).text(value, x, y, {
    lineBreak: false,
    ...textOptions,
  });
}

function drawFilledCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke = BORDER
) {
  doc.save()
    .lineWidth(0.84)
    .rect(x, y, w, h)
    .fillAndStroke(fill, stroke)
    .restore();
}

function drawLine(
  doc: PDFKit.PDFDocument,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width = 0.84
) {
  doc.save()
    .strokeColor(BORDER)
    .lineWidth(width)
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .stroke()
    .restore();
}

function drawCenteredHeader(
  doc: PDFKit.PDFDocument,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fonts: FontSet
) {
  text(doc, label, x, y + 2.2, {
    width: w,
    align: 'center',
    font: fonts.bold,
    size: 11,
    color: WHITE,
  });
}

function companyAddressLines(company: FullInvoice['company']): string[] {
  const lines = [company.addressLine1, company.addressLine2].filter(Boolean) as string[];
  const location = [company.suburb, company.state, company.pin].filter(Boolean).join(' ');
  if (location) lines.push(location);
  return lines;
}

function wrapText(doc: PDFKit.PDFDocument, value: string, width: number, font: string, size: number): string[] {
  doc.font(font).fontSize(size);
  const lines: string[] = [];
  const paragraphs = value.split(/\r?\n/);

  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      return;
    }

    let line = '';
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (doc.widthOfString(next) <= width || !line) {
        line = next;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
  });

  return lines.length > 0 ? lines : [''];
}

function drawLogo(doc: PDFKit.PDFDocument, fonts: FontSet) {
  const logoPath = path.join(process.cwd(), 'public', 'wefix_logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 66, 86.73, { width: 201.66, height: 51.45 });
      return;
    } catch {
      // Fall back to text below.
    }
  }

  text(doc, 'WEFIX HANDYMAN', 66, 98, {
    width: 202,
    font: fonts.bold,
    size: 20,
    color: NAVY,
  });
}

function drawCompanyBlock(doc: PDFKit.PDFDocument, fullInvoice: FullInvoice, fonts: FontSet) {
  const { company, invoice } = fullInvoice;
  const x = 68.28;
  let y = 144.1;

  companyAddressLines(company).forEach((line) => {
    text(doc, line, x, y, { width: 184, font: fonts.bold, size: 10.08 });
    y += 13.3;
  });

  if (company.phone) {
    text(doc, `Phone: ${company.phone}`, x, y, { width: 184, font: fonts.bold, size: 10.08 });
    y += 13.3;
  }
  if (invoice.includeAbn && company.abn) {
    text(doc, `ABN : ${company.abn}`, x, y, { width: 184, font: fonts.bold, size: 10.08 });
    y += 13.3;
  }
  if (company.email) {
    text(doc, `Email : ${company.email}`, x, y, {
      width: 184,
      font: fonts.italic,
      size: 10.08,
      underline: true,
    });
  }
}

function drawTopSection(doc: PDFKit.PDFDocument, fullInvoice: FullInvoice, fonts: FontSet) {
  const { invoice } = fullInvoice;

  drawLogo(doc, fonts);
  drawCompanyBlock(doc, fullInvoice, fonts);

  text(doc, 'INVOICE', 430, 98.4, {
    width: 112,
    align: 'right',
    font: fonts.boldItalic,
    size: 18.36,
  });

  const bandY = 237.23;
  drawFilledCell(doc, 66.48, bandY, 184.73, 14.16, NAVY, NAVY);
  drawFilledCell(doc, 381.67, bandY, 163.85, 14.16, NAVY, NAVY);

  text(doc, 'BILL TO', 75.96, bandY + 2.15, {
    width: 170,
    font: fonts.bold,
    size: 11.04,
    color: WHITE,
  });
  text(doc, 'INVOICE #', 399.55, bandY + 2.15, {
    width: 80,
    font: fonts.bold,
    size: 11.04,
    color: WHITE,
  });
  text(doc, 'DATE', 492.46, bandY + 2.15, {
    width: 48,
    font: fonts.bold,
    size: 11.04,
    color: WHITE,
  });

  const billX = 68.52;
  let billY = 252.6;
  text(doc, invoice.customerName, billX, billY, { width: 235, font: fonts.regular, size: 11.04 });
  billY += 15.96;
  text(doc, invoice.customerAddress, billX, billY, { width: 235, font: fonts.regular, size: 11.04 });
  billY += 15.96;
  text(doc, [invoice.customerSuburb, invoice.customerState, invoice.customerPin].filter(Boolean).join('   '), billX, billY, {
    width: 235,
    font: fonts.regular,
    size: 11.04,
  });
  billY += 15.96;
  text(doc, `Phone : ${invoice.customerPhone || ''}`, billX, billY, {
    width: 235,
    font: fonts.regular,
    size: 11.04,
  });
  billY += 15.96;
  text(doc, `Email : ${invoice.customerEmail || ''}`, billX, billY, {
    width: 235,
    font: fonts.regular,
    size: 11.04,
  });

  text(doc, invoice.invoiceNumber, 375.07, 252.84, {
    width: 80,
    align: 'left',
    font: fonts.regular,
    size: 10.08,
  });
  text(doc, formatDate(invoice.invoiceDate), 480.34, 252.84, {
    width: 62,
    align: 'left',
    font: fonts.regular,
    size: 10.08,
  });
}

function drawItemsTable(doc: PDFKit.PDFDocument, items: FullInvoice['items'], fonts: FontSet): number {
  drawFilledCell(doc, TABLE.x, TABLE.y, TABLE.w, TABLE.headerH, NAVY, NAVY);
  drawCenteredHeader(doc, 'DESCRIPTION', TABLE.descX, TABLE.y, TABLE.descW, TABLE.headerH, fonts);
  drawCenteredHeader(doc, 'QTY', TABLE.qtyX, TABLE.y, TABLE.qtyW, TABLE.headerH, fonts);
  drawCenteredHeader(doc, 'UNIT PRICE', TABLE.unitX, TABLE.y, TABLE.unitW, TABLE.headerH, fonts);
  drawCenteredHeader(doc, 'AMOUNT', TABLE.amountX, TABLE.y, TABLE.amountW, TABLE.headerH, fonts);

  let rowY = TABLE.y + TABLE.headerH;
  items.forEach((item) => {
    const descriptionLines = wrapText(doc, item.description, TABLE.descW - 8, fonts.regular, 11.04);
    const rowHeight = Math.max(TABLE.rowH, descriptionLines.length * TABLE.rowH);

    doc.save()
      .lineWidth(0.84)
      .rect(TABLE.x, rowY, TABLE.w, rowHeight)
      .strokeColor(BORDER)
      .stroke()
      .restore();

    descriptionLines.forEach((line, index) => {
      text(doc, line, TABLE.descX + 2.04, rowY + 2.32 + index * TABLE.rowH, {
        width: TABLE.descW - 8,
        font: fonts.regular,
        size: 11.04,
      });
    });

    text(doc, item.quantity.toString(), TABLE.qtyX + 2, rowY + 2.32, {
      width: TABLE.qtyW - 4,
      align: 'center',
      font: fonts.regular,
      size: 11.04,
    });
    text(doc, formatCurrency(item.unitPrice), TABLE.unitX + 2, rowY + 2.32, {
      width: TABLE.unitW - 4,
      align: 'right',
      font: fonts.regular,
      size: 11.04,
    });
    text(doc, formatCurrency(item.lineTotal), TABLE.amountX + 2, rowY + 2.32, {
      width: TABLE.amountW - 5,
      align: 'right',
      font: fonts.regular,
      size: 11.04,
    });

    rowY += rowHeight;
  });

  return rowY;
}

function drawTotals(
  doc: PDFKit.PDFDocument,
  fullInvoice: FullInvoice,
  fonts: FontSet,
  minY: number
): { top: number; bottom: number } {
  const { invoice } = fullInvoice;
  const totalsY = Math.max(TOTALS.y, minY + 18);
  const rows = [
    ['SUBTOTAL', formatCurrencyValue(invoice.subtotalAmount), TOTALS.rowH, fonts.italic, 11.04],
    ['TAX RATE', `${invoice.taxRate.toFixed(3)}%`, TOTALS.rowH, fonts.italic, 11.04],
    ['TAX', formatCurrencyValue(invoice.taxAmount), TOTALS.rowH, fonts.italic, 11.04],
    ['TOTAL', formatCurrency(invoice.totalAmount), TOTALS.totalH, fonts.bold, 12.96],
  ] as const;

  let y = totalsY;
  rows.forEach(([label, value, height, font, size]) => {
    drawFilledCell(doc, TOTALS.x, y, TOTALS.labelW, height, TOTAL_LABEL);
    drawFilledCell(doc, TOTALS.x + TOTALS.labelW, y, TOTALS.valueW, height, TOTAL_VALUE);
    text(doc, label, TOTALS.x + 9.48, y + 1.8, {
      width: TOTALS.labelW - 14,
      font,
      size,
    });
    text(doc, value, TOTALS.x + TOTALS.labelW + 5, y + 1.8, {
      width: TOTALS.valueW - 10,
      align: 'right',
      font,
      size,
    });
    y += height;
  });

  return { top: totalsY, bottom: y };
}

function drawGridLines(doc: PDFKit.PDFDocument, tableRowsBottom: number, totalsTop: number, totalsBottom: number) {
  const top = TABLE.y;
  const itemGridBottom = Math.max(tableRowsBottom, totalsTop);

  // Outer table borders continue to the totals bottom. The inner item-only
  // dividers stop at the totals block so they do not cut through totals cells.
  [66.12, 381.31, 545.04].forEach((x) => drawLine(doc, x, top, x, totalsBottom));
  [409.51, 462.82].forEach((x) => drawLine(doc, x, top, x, itemGridBottom));

  drawLine(doc, TABLE.x, top, TABLE.x + TABLE.w, top);
  drawLine(doc, TABLE.x, TABLE.y + TABLE.headerH, TABLE.x + TABLE.w, TABLE.y + TABLE.headerH);
  drawLine(doc, TABLE.x, totalsBottom, TABLE.x + TABLE.w, totalsBottom);
}

function drawFooter(doc: PDFKit.PDFDocument, fullInvoice: FullInvoice, fonts: FontSet, contentBottom: number) {
  const { company } = fullInvoice;
  const accountY = Math.max(708, contentBottom + 16);
  const thankYouY = Math.max(672, accountY - 84);

  text(doc, 'Thank you for your business!', 66.48, thankYouY, {
    width: 315.19,
    align: 'center',
    font: fonts.boldItalic,
    size: 11.04,
  });

  const accountLine1 = company.accountName
    ? `Account details: A/C Name: ${company.accountName},`
    : 'Account details:';
  const accountParts: string[] = [];
  if (company.bsb) accountParts.push(`BSB :  ${company.bsb}`);
  if (company.accountNumber) accountParts.push(`A/C No  :  ${company.accountNumber}`);
  if (company.payId) accountParts.push(`Pay ID ${company.payId}`);

  text(doc, accountLine1, 66.48, accountY, {
    width: PAGE.contentW,
    align: 'center',
    font: fonts.bold,
    size: 11.04,
  });
  if (accountParts.length > 0) {
    text(doc, accountParts.join(', '), 66.48, accountY + 14.4, {
      width: PAGE.contentW,
      align: 'center',
      font: fonts.bold,
      size: 11.04,
    });
  }

  text(doc, 'If you have any questions about this invoice, please contact', 66.48, accountY + 28.5, {
    width: PAGE.contentW,
    align: 'center',
    font: fonts.italic,
    size: 9.24,
  });

  const contactName = company.contactName || company.companyName;
  const contactPhone = company.contactPhone || company.phone || '';
  text(doc, `${contactName}${contactPhone ? ` @ ${contactPhone}` : ''}`, 66.48, accountY + 41.8, {
    width: PAGE.contentW,
    align: 'center',
    font: fonts.bold,
    size: 9.24,
  });
}

export async function generateInvoicePDF(fullInvoice: FullInvoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { invoice, company } = fullInvoice;

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: company.companyName,
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const fonts = registerFonts(doc);

    doc.save()
      .lineWidth(0.84)
      .rect(PAGE.frameX, PAGE.frameY, PAGE.frameW, PAGE.frameH)
      .strokeColor(BORDER)
      .stroke()
      .restore();

    drawTopSection(doc, fullInvoice, fonts);
    const itemRowsBottom = drawItemsTable(doc, fullInvoice.items, fonts);
    const totals = drawTotals(doc, fullInvoice, fonts, itemRowsBottom);
    drawGridLines(doc, itemRowsBottom, totals.top, totals.bottom);
    drawFooter(doc, fullInvoice, fonts, totals.bottom);

    doc.end();
  });
}
