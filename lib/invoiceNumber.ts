import { getNextInvoiceCounter } from './db';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Generates invoice number in format: yyMM/dd-[counter]
 * Example: 2605/15-001
 */
export async function generateInvoiceNumber(date: Date = new Date()): Promise<string> {
  const yy = String(date.getFullYear()).slice(-2);
  const MM = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const datePrefix = `${yy}${MM}/${dd}`;

  const counter = await getNextInvoiceCounter(datePrefix);
  const paddedCounter = String(counter).padStart(3, '0');

  return `${datePrefix}-${paddedCounter}`;
}

/**
 * Convert invoice number to a filesystem/storage-safe key
 * Replaces / with - 
 */
export function toSafeKey(invoiceNumber: string): string {
  return invoiceNumber.replace(/\//g, '-').replace(/[^a-zA-Z0-9_\-]/g, '_');
}
