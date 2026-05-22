import { createSupabaseAdmin } from './supabase';
import { CompanyProfile, InvoiceData, SavedInvoice, SavedInvoiceItem } from '@/types/invoice';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getAdmin() {
  return createSupabaseAdmin();
}

// ─── Company Profile ────────────────────────────────────────────────────────

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from('company_profile')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    // Return default profile if none exists
    return {
      id: 'default',
      companyName: process.env.COMPANY_NAME || 'WEFIX HANDYMAN',
      addressLine1: process.env.COMPANY_ADDRESS_1 || '123 Service Street',
      addressLine2: process.env.COMPANY_ADDRESS_2 || '',
      suburb: process.env.COMPANY_SUBURB || 'Melbourne',
      state: process.env.COMPANY_STATE || 'VIC',
      pin: process.env.COMPANY_PIN || '3000',
      phone: process.env.COMPANY_PHONE || '0400 000 000',
      email: process.env.COMPANY_EMAIL || 'info@wefixhandyman.com.au',
      abn: process.env.COMPANY_ABN || '12 345 678 901',
      accountName: process.env.COMPANY_ACCOUNT_NAME || 'WEFIX HANDYMAN',
      bsb: process.env.COMPANY_BSB || '000-000',
      accountNumber: process.env.COMPANY_ACCOUNT_NUMBER || '000000000',
      payId: process.env.COMPANY_PAY_ID || 'info@wefixhandyman.com.au',
      contactName: process.env.COMPANY_CONTACT_NAME || 'WeFix Handyman',
      contactPhone: process.env.COMPANY_CONTACT_PHONE || '0400 000 000',
    };
  }

  return {
    id: data.id,
    companyName: data.company_name,
    addressLine1: data.address_line_1,
    addressLine2: data.address_line_2,
    suburb: data.suburb,
    state: data.state,
    pin: data.pin,
    phone: data.phone,
    email: data.email,
    abn: data.abn,
    accountName: data.account_name,
    bsb: data.bsb,
    accountNumber: data.account_number,
    payId: data.pay_id,
    contactName: data.contact_name,
    contactPhone: data.contact_phone,
    logoStorageKey: data.logo_storage_key,
  };
}

// ─── Invoice Counter ─────────────────────────────────────────────────────────

export async function getNextInvoiceCounter(datePrefix: string): Promise<number> {
  const supabase = getAdmin();

  // Use a counter table for concurrency-safe increments
  const { data, error } = await supabase.rpc('get_next_invoice_counter', {
    p_date_prefix: datePrefix,
  });

  if (error) {
    // Fallback: count existing invoices for today's prefix and add 1
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .like('invoice_number', `${datePrefix}-%`);
    return (count || 0) + 1;
  }

  return data as number;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function checkInvoiceNumberExists(invoiceNumber: string, excludeId?: string): Promise<boolean> {
  const supabase = getAdmin();
  let query = supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('invoice_number', invoiceNumber);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { count } = await query;
  return (count || 0) > 0;
}

export async function createInvoice(
  invoiceData: InvoiceData,
  createdBy: string
): Promise<{ id: string; invoiceNumber: string }> {
  const supabase = getAdmin();
  const id = uuidv4();

  const { subtotal, taxRate, taxAmount, total } = invoiceData.totals;

  const { error: invoiceError } = await supabase.from('invoices').insert({
    id,
    invoice_number: invoiceData.details.invoiceNumber,
    invoice_date: invoiceData.details.date,
    include_abn: invoiceData.details.includeAbn,
    customer_name: invoiceData.customer.name,
    customer_address: invoiceData.customer.address,
    customer_suburb: invoiceData.customer.suburb,
    customer_state: invoiceData.customer.state,
    customer_pin: invoiceData.customer.pin,
    customer_email: invoiceData.customer.email || null,
    customer_phone: invoiceData.customer.phone || null,
    subtotal_amount: subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total_amount: total,
    status: 'Saved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: createdBy,
    updated_by: createdBy,
  });

  if (invoiceError) {
    throw new Error(`Failed to create invoice: ${invoiceError.message}`);
  }

  // Insert line items
  const items = invoiceData.items.map((item, index) => ({
    id: uuidv4(),
    invoice_id: id,
    line_no: index + 1,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: item.lineTotal,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error: itemsError } = await supabase.from('invoice_items').insert(items);

  if (itemsError) {
    // Rollback invoice
    await supabase.from('invoices').delete().eq('id', id);
    throw new Error(`Failed to create invoice items: ${itemsError.message}`);
  }

  return { id, invoiceNumber: invoiceData.details.invoiceNumber };
}

export async function getInvoiceById(id: string): Promise<{ invoice: SavedInvoice; items: SavedInvoiceItem[] } | null> {
  const supabase = getAdmin();

  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (invError || !invoice) return null;

  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('line_no');

  if (itemsError) return null;

  return {
    invoice: mapInvoiceRow(invoice),
    items: (items || []).map(mapItemRow),
  };
}

export async function updateInvoiceFileIds(
  invoiceId: string,
  jsonFileId?: string,
  pdfFileId?: string
): Promise<void> {
  const supabase = getAdmin();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (jsonFileId) updates.json_file_id = jsonFileId;
  if (pdfFileId) updates.pdf_file_id = pdfFileId;

  await supabase.from('invoices').update(updates).eq('id', invoiceId);
}

export async function updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
  const supabase = getAdmin();
  await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', invoiceId);
}

// ─── File Storage ────────────────────────────────────────────────────────────

export async function storeJsonSnapshot(
  invoiceId: string,
  invoiceNumber: string,
  payload: unknown
): Promise<string> {
  const supabase = getAdmin();
  const safeName = invoiceNumber.replace(/\//g, '-').replace(/\s/g, '_');
  const fileName = `${safeName}.json`;
  const storagePath = `invoices/${safeName}/${fileName}`;
  const jsonContent = JSON.stringify(payload, null, 2);

  const { error: uploadError } = await supabase.storage
    .from('invoice-files')
    .upload(storagePath, Buffer.from(jsonContent, 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload JSON snapshot: ${uploadError.message}`);
  }

  // Record in invoice_files table
  const fileId = uuidv4();
  await supabase.from('invoice_files').insert({
    id: fileId,
    invoice_id: invoiceId,
    file_type: 'JSON',
    storage_provider: 'SupabaseStorage',
    bucket_name: 'invoice-files',
    storage_key: storagePath,
    original_file_name: fileName,
    mime_type: 'application/json',
    file_size_bytes: Buffer.byteLength(jsonContent, 'utf-8'),
    created_at: new Date().toISOString(),
  });

  return fileId;
}

export async function storePdfFile(
  invoiceId: string,
  invoiceNumber: string,
  pdfBuffer: Buffer
): Promise<string> {
  const supabase = getAdmin();
  const safeName = invoiceNumber.replace(/\//g, '-').replace(/\s/g, '_');
  const fileName = `${safeName}.pdf`;
  const storagePath = `invoices/${safeName}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('invoice-files')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  const fileId = uuidv4();
  await supabase.from('invoice_files').insert({
    id: fileId,
    invoice_id: invoiceId,
    file_type: 'PDF',
    storage_provider: 'SupabaseStorage',
    bucket_name: 'invoice-files',
    storage_key: storagePath,
    original_file_name: fileName,
    mime_type: 'application/pdf',
    file_size_bytes: pdfBuffer.length,
    created_at: new Date().toISOString(),
  });

  return fileId;
}

export async function getPdfBuffer(invoiceId: string): Promise<Buffer | null> {
  const supabase = getAdmin();

  const { data: fileRecord } = await supabase
    .from('invoice_files')
    .select('storage_key, bucket_name')
    .eq('invoice_id', invoiceId)
    .eq('file_type', 'PDF')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!fileRecord) return null;

  const { data, error } = await supabase.storage
    .from(fileRecord.bucket_name)
    .download(fileRecord.storage_key);

  if (error || !data) return null;

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Email Log ───────────────────────────────────────────────────────────────

export async function logEmail(
  invoiceId: string,
  recipients: string[],
  subject: string,
  status: 'Sent' | 'Failed',
  errorMessage?: string
): Promise<void> {
  const supabase = getAdmin();
  await supabase.from('email_log').insert({
    id: uuidv4(),
    invoice_id: invoiceId,
    recipient_list: recipients.join(', '),
    subject,
    status,
    error_message: errorMessage || null,
    sent_at: status === 'Sent' ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
  });
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapInvoiceRow(row: Record<string, unknown>): SavedInvoice {
  return {
    id: row.id as string,
    invoiceNumber: row.invoice_number as string,
    invoiceDate: row.invoice_date as string,
    includeAbn: row.include_abn as boolean,
    customerName: row.customer_name as string,
    customerAddress: row.customer_address as string,
    customerSuburb: row.customer_suburb as string,
    customerState: row.customer_state as string,
    customerPin: row.customer_pin as string,
    customerEmail: row.customer_email as string | undefined,
    customerPhone: row.customer_phone as string | undefined,
    subtotalAmount: Number(row.subtotal_amount),
    taxRate: Number(row.tax_rate),
    taxAmount: Number(row.tax_amount),
    totalAmount: Number(row.total_amount),
    status: row.status as string,
    jsonFileId: row.json_file_id as string | undefined,
    pdfFileId: row.pdf_file_id as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapItemRow(row: Record<string, unknown>): SavedInvoiceItem {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    lineNo: row.line_no as number,
    description: row.description as string,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  };
}
