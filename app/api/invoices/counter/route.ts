import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { generateInvoiceNumber } from '@/lib/invoiceNumber';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.user?.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dateParam = request.nextUrl.searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : new Date();
    const invoiceNumber = await generateInvoiceNumber(date);
    return NextResponse.json({ invoiceNumber });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Invoice counter error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
