import nodemailer from 'nodemailer';
import { FullInvoice } from '@/types/invoice';
import { generateInvoicePDF } from './pdf';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendInvoiceEmail(
  fullInvoice: FullInvoice,
  recipients: string[],
  customSubject?: string,
  customBody?: string
): Promise<void> {
  const { invoice, company } = fullInvoice;

  const pdfBuffer = await generateInvoicePDF(fullInvoice);

  const subject =
    customSubject ||
    `Invoice ${invoice.invoiceNumber} from ${company.companyName}`;

  const safeKey = invoice.invoiceNumber.replace(/\//g, '-');

  const body =
    customBody ||
    `Dear ${invoice.customerName},\n\nPlease find attached your invoice ${invoice.invoiceNumber}.\n\nIf you have any questions, please don't hesitate to contact us.\n\nKind regards,\n${company.companyName}\n${company.phone || ''}\n${company.email || ''}`;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipients.join(', '),
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
    attachments: [
      {
        filename: `Invoice-${safeKey}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
