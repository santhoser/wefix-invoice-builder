import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { generateInvoicePDF } from '@/lib/pdf';
import { getInvoiceById, getCompanyProfile, storePdfFile, updateInvoiceFileIds } from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.user?.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('invoiceId');
  if (!id) {
    return NextResponse.json({ error: 'invoiceId parameter is required.' }, { status: 400 });
  }

  try {
    const result = await getInvoiceById(id);
    if (!result) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const company = await getCompanyProfile();
    const pdfBuffer = await generateInvoicePDF({ ...result, company });

    // Store PDF in Supabase (best-effort)
    try {
      const pdfFileId = await storePdfFile(id, result.invoice.invoiceNumber, pdfBuffer);
      await updateInvoiceFileIds(id, undefined, pdfFileId);
    } catch (storageErr) {
      console.error('PDF storage failed (non-fatal):', storageErr);
    }

    const safeKey = result.invoice.invoiceNumber.replace(/\//g, '-');
    const inline = request.nextUrl.searchParams.get('inline') === 'true';
    const disposition = inline ? 'inline' : 'attachment';

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="Invoice-${safeKey}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: `PDF generation failed: ${message}` }, { status: 500 });
  }
}
