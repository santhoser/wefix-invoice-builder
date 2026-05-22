'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceData } from '@/types/invoice';

interface Props {
  invoiceData: InvoiceData;
  savedInvoiceId: string | null;
  isDirty: boolean;
  onSaved: (invoiceId: string) => void;
  onBack: () => void;
}

type ActionState = 'idle' | 'loading' | 'success' | 'error';

function formatCurrency(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function OverviewActionsStep({
  invoiceData,
  savedInvoiceId,
  isDirty,
  onSaved,
  onBack,
}: Props) {
  const router = useRouter();
  const { details, customer, items, totals } = invoiceData;

  const [saveState, setSaveState] = useState<ActionState>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const [downloadState, setDownloadState] = useState<ActionState>('idle');
  const [emailState, setEmailState] = useState<ActionState>('idle');
  const [emailMessage, setEmailMessage] = useState('');

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipients, setRecipients] = useState<string[]>(
    customer.email ? [customer.email] : []
  );
  const [newRecipient, setNewRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Invoice ${details.invoiceNumber}`);

  const isSaved = !!savedInvoiceId;

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaveState('loading');
    setSaveMessage('');
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveState('error');
        setSaveMessage(data.error || 'Save failed. Please try again.');
        return;
      }
      setSaveState('success');
      setSaveMessage(data.warning || 'Invoice saved successfully!');
      onSaved(data.invoiceId);
    } catch {
      setSaveState('error');
      setSaveMessage('Network error. Please check your connection and try again.');
    }
  }

  // ── Download PDF ──────────────────────────────────────────────────────────

  async function handleDownload() {
    if (!savedInvoiceId) return;
    setDownloadState('loading');
    try {
      const res = await fetch(`/api/pdf/generate?invoiceId=${savedInvoiceId}`);
      if (!res.ok) {
        setDownloadState('error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeKey = details.invoiceNumber.replace(/\//g, '-');
      a.href = url;
      a.download = `Invoice-${safeKey}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadState('success');
      setTimeout(() => setDownloadState('idle'), 3000);
    } catch {
      setDownloadState('error');
    }
  }

  // ── Print ─────────────────────────────────────────────────────────────────

  function handlePrint() {
    if (!savedInvoiceId) return;
    const url = `/api/pdf/generate?invoiceId=${savedInvoiceId}&inline=true`;
    window.open(url, '_blank');
  }

  // ── Email ─────────────────────────────────────────────────────────────────

  function addRecipient() {
    const email = newRecipient.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailMessage('Please enter a valid email address.');
      return;
    }
    if (recipients.includes(email)) {
      setEmailMessage('This email is already in the list.');
      return;
    }
    setRecipients((prev) => [...prev, email]);
    setNewRecipient('');
    setEmailMessage('');
  }

  function removeRecipient(email: string) {
    setRecipients((prev) => prev.filter((r) => r !== email));
  }

  async function handleSendEmail() {
    if (recipients.length === 0) {
      setEmailMessage('Please add at least one recipient.');
      return;
    }
    setEmailState('loading');
    setEmailMessage('');
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: savedInvoiceId,
          recipients,
          subject: emailSubject,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailState('error');
        setEmailMessage(data.error || 'Failed to send email.');
        return;
      }
      setEmailState('success');
      setEmailMessage('Email sent successfully!');
      setShowEmailModal(false);
      setTimeout(() => setEmailState('idle'), 3000);
    } catch {
      setEmailState('error');
      setEmailMessage('Network error. Could not send email.');
    }
  }

  // ── Close ─────────────────────────────────────────────────────────────────

  function handleClose() {
    if (isDirty && !isSaved) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave without saving?')) {
        return;
      }
    }
    router.push('/home');
  }

  return (
    <div className="space-y-6">
      {/* Invoice Preview Card */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">WEFIX HANDYMAN</div>
            <div className="text-slate-300 text-sm mt-0.5">Invoice Preview</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm text-slate-300">#{details.invoiceNumber}</div>
            <div className="text-xs text-slate-400 mt-0.5">{formatDate(details.date)}</div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Bill To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h4>
              <div className="text-sm text-gray-900 font-semibold">{customer.name || '—'}</div>
              <div className="text-sm text-gray-600 mt-0.5">{customer.address}</div>
              <div className="text-sm text-gray-600">
                {[customer.suburb, customer.state, customer.pin].filter(Boolean).join(' ')}
              </div>
              {customer.phone && <div className="text-sm text-gray-500 mt-1">Ph: {customer.phone}</div>}
              {customer.email && <div className="text-sm text-gray-500">{customer.email}</div>}
            </div>
            <div className="text-sm text-gray-600 space-y-1 sm:text-right">
              <div>
                <span className="text-gray-400">Invoice #: </span>
                <span className="font-mono font-semibold text-gray-900">{details.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-gray-400">Date: </span>
                <span className="text-gray-900">{formatDate(details.date)}</span>
              </div>
              {details.includeAbn && (
                <div className="text-xs text-gray-400">ABN will be shown on PDF</div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-200">
              <div className="col-span-7">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>
            {items.map((item, i) => (
              <div key={item.id} className={`grid grid-cols-12 gap-2 py-3 text-sm ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="col-span-7 text-gray-900">{item.description || <span className="text-gray-300">No description</span>}</div>
                <div className="col-span-2 text-right text-gray-500">{item.quantity}</div>
                <div className="col-span-3 text-right font-medium text-gray-900">
                  {formatCurrency(item.lineTotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>GST ({totals.taxRate}%)</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-300 pt-2">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {saveMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${
          saveState === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Email Status */}
      {emailState === 'success' && (
        <div className="px-4 py-3 rounded-lg text-sm border bg-green-50 border-green-200 text-green-700">
          {emailMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Close */}
          <button onClick={handleClose} className="btn-secondary py-2.5">
            ✕ Close
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saveState === 'loading' || isSaved}
            className={`py-2.5 ${isSaved ? 'btn-success' : 'btn-navy'} col-span-1`}
          >
            {saveState === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </span>
            ) : isSaved ? (
              '✓ Saved'
            ) : (
              '💾 Save'
            )}
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            disabled={!isSaved}
            className="btn-secondary py-2.5 disabled:opacity-40"
            title={!isSaved ? 'Save the invoice first' : ''}
          >
            🖨️ Print
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!isSaved || downloadState === 'loading'}
            className="btn-secondary py-2.5 disabled:opacity-40"
            title={!isSaved ? 'Save the invoice first' : ''}
          >
            {downloadState === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Downloading…
              </span>
            ) : downloadState === 'success' ? '✓ Downloaded' : '⬇ Download'}
          </button>

          {/* Email */}
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={!isSaved || emailState === 'loading'}
            className="btn-secondary py-2.5 disabled:opacity-40"
            title={!isSaved ? 'Save the invoice first' : ''}
          >
            {emailState === 'loading' ? 'Sending…' : '✉ Email'}
          </button>
        </div>

        {!isSaved && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            Save the invoice first to enable Print, Download, and Email.
          </p>
        )}
      </div>

      {/* Back */}
      <div>
        <button onClick={onBack} className="btn-secondary px-6 py-2.5">
          ← Back to Items
        </button>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg text-gray-900">Send Invoice by Email</h3>
              <button
                onClick={() => { setShowEmailModal(false); setEmailMessage(''); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="form-label">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Recipients */}
            <div className="mb-4">
              <label className="form-label">
                Recipients <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => { setNewRecipient(e.target.value); setEmailMessage(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                  className="form-input flex-1"
                  placeholder="email@example.com"
                />
                <button onClick={addRecipient} className="btn-primary px-3">
                  Add
                </button>
              </div>

              {recipients.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {recipients.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                      {r}
                      <button onClick={() => removeRecipient(r)} className="hover:text-red-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {emailMessage && (
              <div className={`px-3 py-2 rounded-lg text-sm mb-4 ${
                emailState === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {emailMessage}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowEmailModal(false); setEmailMessage(''); }}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailState === 'loading'}
                className="btn-primary px-4 py-2"
              >
                {emailState === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </span>
                ) : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
