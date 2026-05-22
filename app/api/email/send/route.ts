import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { sendInvoiceEmail } from '@/lib/email';
import { getInvoiceById, getCompanyProfile, logEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.user?.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { invoiceId, recipients, subject, body: emailBody } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required.' }, { status: 400 });
    }
    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required.' }, { status: 400 });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = recipients.filter((r: string) => !emailRegex.test(r));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalid.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await getInvoiceById(invoiceId);
    if (!result) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    const company = await getCompanyProfile();
    const fullInvoice = { ...result, company };

    await sendInvoiceEmail(fullInvoice, recipients, subject, emailBody);

    await logEmail(invoiceId, recipients, subject || `Invoice ${result.invoice.invoiceNumber}`, 'Sent');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email sending error:', error);

    // Log failure
    try {
      const body = await request.json().catch(() => ({}));
      if (body.invoiceId) {
        await logEmail(body.invoiceId, body.recipients || [], body.subject || '', 'Failed', message);
      }
    } catch { /* ignore logging error */ }

    return NextResponse.json({ error: `Failed to send email: ${message}` }, { status: 500 });
  }
}
