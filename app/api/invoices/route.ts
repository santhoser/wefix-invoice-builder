import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import {
  createInvoice,
  checkInvoiceNumberExists,
  storeJsonSnapshot,
  getCompanyProfile,
} from '@/lib/db';
import { InvoiceData } from '@/types/invoice';

async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.user?.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: InvoiceData = await request.json();
    const { details, customer, items, totals } = body;

    // Validate required fields
    if (!details?.invoiceNumber || !details?.date) {
      return NextResponse.json({ error: 'Invoice number and date are required.' }, { status: 400 });
    }
    if (!customer?.name || !customer?.address) {
      return NextResponse.json({ error: 'Customer name and address are required.' }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one invoice item is required.' }, { status: 400 });
    }

    // Check uniqueness of invoice number
    const exists = await checkInvoiceNumberExists(details.invoiceNumber);
    if (exists) {
      return NextResponse.json(
        { error: `Invoice number "${details.invoiceNumber}" already exists. Please use a different number.` },
        { status: 409 }
      );
    }

    // Create invoice in database
    const { id: invoiceId } = await createInvoice(body, session.user.username);

    // Store JSON snapshot
    let jsonFileId: string | undefined;
    let jsonError: string | undefined;
    try {
      const company = await getCompanyProfile();
      const snapshot = {
        invoiceId,
        invoiceNumber: details.invoiceNumber,
        date: details.date,
        includeAbn: details.includeAbn,
        company,
        customer,
        items,
        totals,
        savedAt: new Date().toISOString(),
        savedBy: session.user.username,
      };
      jsonFileId = await storeJsonSnapshot(invoiceId, details.invoiceNumber, snapshot);
    } catch (err) {
      console.error('JSON snapshot storage failed:', err);
      jsonError = 'Invoice saved but JSON snapshot could not be stored.';
    }

    return NextResponse.json({
      success: true,
      invoiceId,
      invoiceNumber: details.invoiceNumber,
      jsonFileId,
      warning: jsonError,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Invoice creation error:', error);
    return NextResponse.json({ error: `Failed to save invoice: ${message}` }, { status: 500 });
  }
}
