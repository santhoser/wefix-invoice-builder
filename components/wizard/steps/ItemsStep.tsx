'use client';

import { useState } from 'react';
import { InvoiceItem } from '@/types/invoice';

interface Props {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function createNewItem(): InvoiceItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: '',
    quantity: 1,
    unitPrice: 0,
    lineTotal: 0,
  };
}

function calcLineTotal(qty: number, price: number): number {
  return parseFloat((qty * price).toFixed(2));
}

export default function ItemsStep({ items, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});

  function updateItem(id: string, field: keyof InvoiceItem, rawValue: string | number) {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: rawValue };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(rawValue) : item.quantity;
        const price = field === 'unitPrice' ? Number(rawValue) : item.unitPrice;
        next.lineTotal = calcLineTotal(qty, price);
      }
      return next;
    });
    onChange(updated);
    // Clear field error
    setErrors((prev) => {
      const copy = { ...prev };
      if (copy[id]) {
        delete copy[id][field as string];
        if (Object.keys(copy[id]).length === 0) delete copy[id];
      }
      return copy;
    });
  }

  function addItem() {
    onChange([...items, createNewItem()]);
  }

  function removeItem(id: string) {
    if (items.length === 1) return; // keep at least one
    onChange(items.filter((i) => i.id !== id));
  }

  function validate(): boolean {
    const newErrors: Record<string, Record<string, string>> = {};
    let valid = true;

    items.forEach((item) => {
      const itemErrors: Record<string, string> = {};
      if (!item.description.trim()) {
        itemErrors.description = 'Description is required.';
        valid = false;
      }
      if (!item.quantity || item.quantity <= 0) {
        itemErrors.quantity = 'Quantity must be greater than 0.';
        valid = false;
      }
      if (item.unitPrice < 0) {
        itemErrors.unitPrice = 'Price must be 0 or greater.';
        valid = false;
      }
      if (Object.keys(itemErrors).length > 0) {
        newErrors[item.id] = itemErrors;
      }
    });

    setErrors(newErrors);
    return valid;
  }

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const taxRate = 10;
  const tax = parseFloat((subtotal * taxRate / 100).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Items</h2>
          <button
            onClick={addItem}
            className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-6">Add one or more line items to the invoice.</p>

        {/* Items */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const itemErrors = errors[item.id] || {};
            return (
              <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1 rounded"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="form-label">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className={`form-input ${itemErrors.description ? 'form-input-error' : ''}`}
                    placeholder="Describe the work or service performed"
                  />
                  {itemErrors.description && <p className="form-error">{itemErrors.description}</p>}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Quantity */}
                  <div>
                    <label className="form-label">
                      Qty <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className={`form-input ${itemErrors.quantity ? 'form-input-error' : ''}`}
                      placeholder="1"
                    />
                    {itemErrors.quantity && <p className="form-error">{itemErrors.quantity}</p>}
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="form-label">
                      Unit Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className={`form-input pl-6 ${itemErrors.unitPrice ? 'form-input-error' : ''}`}
                        placeholder="0.00"
                      />
                    </div>
                    {itemErrors.unitPrice && <p className="form-error">{itemErrors.unitPrice}</p>}
                  </div>

                  {/* Total */}
                  <div>
                    <label className="form-label">Total</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                      <input
                        type="text"
                        readOnly
                        value={item.lineTotal.toFixed(2)}
                        className="form-input pl-6 bg-white text-gray-700 cursor-default"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={addItem}
          className="mt-4 w-full border-2 border-dashed border-gray-200 hover:border-blue-300 text-gray-400 hover:text-blue-500 rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Another Item
        </button>

        {/* Totals Summary */}
        <div className="mt-6 border-t border-gray-200 pt-5">
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>GST ({taxRate}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-300 pt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary px-6 py-2.5">
          ← Back
        </button>
        <button onClick={handleNext} className="btn-primary px-6 py-2.5">
          Next: Overview →
        </button>
      </div>
    </div>
  );
}
