'use client';

import { useState, useEffect } from 'react';
import { InvoiceDetails } from '@/types/invoice';

interface Props {
  data: InvoiceDetails;
  onChange: (data: InvoiceDetails) => void;
  onNext: () => void;
}

interface Errors {
  date?: string;
  invoiceNumber?: string;
}

export default function InvoiceDetailsStep({ data, onChange, onNext }: Props) {
  const [errors, setErrors] = useState<Errors>({});
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [numberError, setNumberError] = useState('');

  // Auto-generate invoice number when date changes
  function handleDateChange(newDate: string) {
    onChange({ ...data, date: newDate });
    // Re-fetch invoice number for the new date
    fetch(`/api/invoices/counter?date=${newDate}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.invoiceNumber) onChange({ ...data, date: newDate, invoiceNumber: d.invoiceNumber });
      })
      .catch(() => {});
  }

  function validate(): boolean {
    const errs: Errors = {};
    if (!data.date) errs.date = 'Date is required.';
    if (!data.invoiceNumber.trim()) errs.invoiceNumber = 'Invoice number is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;

    // Check uniqueness
    setCheckingNumber(true);
    setNumberError('');
    try {
      const res = await fetch('/api/invoices/counter');
      // We just proceed; actual uniqueness check happens on save
    } catch { /* ignore */ }
    finally {
      setCheckingNumber(false);
    }

    if (!numberError) onNext();
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Invoice Details</h2>
        <p className="text-gray-500 text-sm mb-6">Set the invoice date, number, and display options.</p>

        <div className="space-y-5">
          {/* Date */}
          <div>
            <label htmlFor="invoice-date" className="form-label">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              id="invoice-date"
              type="date"
              value={data.date}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`form-input ${errors.date ? 'form-input-error' : ''}`}
            />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </div>

          {/* Invoice Number */}
          <div>
            <label htmlFor="invoice-number" className="form-label">
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              id="invoice-number"
              type="text"
              value={data.invoiceNumber}
              onChange={(e) => {
                onChange({ ...data, invoiceNumber: e.target.value });
                setNumberError('');
                setErrors((prev) => ({ ...prev, invoiceNumber: undefined }));
              }}
              className={`form-input font-mono ${errors.invoiceNumber || numberError ? 'form-input-error' : ''}`}
              placeholder="e.g. 2605/15-001"
            />
            {errors.invoiceNumber && <p className="form-error">{errors.invoiceNumber}</p>}
            {numberError && <p className="form-error">{numberError}</p>}
            <p className="text-gray-400 text-xs mt-1">
              Auto-generated in format <code className="bg-gray-100 px-1 rounded">yyMM/dd-counter</code>. You may edit this value.
            </p>
          </div>

          {/* Include ABN */}
          <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
            <input
              id="include-abn"
              type="checkbox"
              checked={data.includeAbn}
              onChange={(e) => onChange({ ...data, includeAbn: e.target.checked })}
              className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label htmlFor="include-abn" className="font-medium text-gray-900 text-sm cursor-pointer">
                Include ABN
              </label>
              <p className="text-gray-500 text-xs mt-0.5">
                When checked, the company ABN will be shown on the generated invoice PDF.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={checkingNumber}
          className="btn-primary px-6 py-2.5"
        >
          {checkingNumber ? 'Checking…' : 'Next: Customer Details →'}
        </button>
      </div>
    </div>
  );
}
