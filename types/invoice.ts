export interface InvoiceDetails {
  date: string; // ISO date string YYYY-MM-DD
  invoiceNumber: string;
  includeAbn: boolean;
}

export interface CustomerDetails {
  name: string;
  address: string;
  suburb: string;
  state: string;
  pin: string;
  email: string;
  phone: string;
}

export interface InvoiceItem {
  id: string; // client-side temp ID
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceTotals {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface InvoiceData {
  details: InvoiceDetails;
  customer: CustomerDetails;
  items: InvoiceItem[];
  totals: InvoiceTotals;
}

export interface CompanyProfile {
  id: string;
  companyName: string;
  addressLine1: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  pin?: string;
  phone?: string;
  email?: string;
  abn?: string;
  accountName?: string;
  bsb?: string;
  accountNumber?: string;
  payId?: string;
  contactName?: string;
  contactPhone?: string;
  logoStorageKey?: string;
}

export interface SavedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  includeAbn: boolean;
  customerName: string;
  customerAddress: string;
  customerSuburb: string;
  customerState: string;
  customerPin: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotalAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  jsonFileId?: string;
  pdfFileId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedInvoiceItem {
  id: string;
  invoiceId: string;
  lineNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface FullInvoice {
  invoice: SavedInvoice;
  items: SavedInvoiceItem[];
  company: CompanyProfile;
}

export interface EmailPayload {
  invoiceId: string;
  recipients: string[];
  subject?: string;
  body?: string;
}

export type WizardStep = 'details' | 'customer' | 'items' | 'overview';
