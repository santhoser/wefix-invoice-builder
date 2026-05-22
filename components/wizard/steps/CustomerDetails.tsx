'use client';

import { useState } from 'react';
import { CustomerDetails } from '@/types/invoice';

interface Props {
  data: CustomerDetails;
  onChange: (data: CustomerDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Errors {
  name?: string;
  address?: string;
  suburb?: string;
  state?: string;
  pin?: string;
  email?: string;
}

const AUSTRALIAN_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

export default function CustomerDetailsStep({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Errors>({});

  function update(field: keyof CustomerDetails, value: string) {
    onChange({ ...data, [field]: value });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Errors = {};
    if (!data.name.trim()) errs.name = 'Customer name is required.';
    if (!data.address.trim()) errs.address = 'Address is required.';
    if (!data.suburb.trim()) errs.suburb = 'Suburb is required.';
    if (!data.state.trim()) errs.state = 'State is required.';
    if (!data.pin.trim()) errs.pin = 'Postcode is required.';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Customer Details</h2>
        <p className="text-gray-500 text-sm mb-6">These details will appear in the Bill To section of the invoice.</p>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="customer-name" className="form-label">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              id="customer-name"
              type="text"
              value={data.name}
              onChange={(e) => update('name', e.target.value)}
              className={`form-input ${errors.name ? 'form-input-error' : ''}`}
              placeholder="Full name or company name"
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="customer-address" className="form-label">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              id="customer-address"
              type="text"
              value={data.address}
              onChange={(e) => update('address', e.target.value)}
              className={`form-input ${errors.address ? 'form-input-error' : ''}`}
              placeholder="123 Example Street"
            />
            {errors.address && <p className="form-error">{errors.address}</p>}
          </div>

          {/* Suburb + State + Pin */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="customer-suburb" className="form-label">
                Suburb <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-suburb"
                type="text"
                value={data.suburb}
                onChange={(e) => update('suburb', e.target.value)}
                className={`form-input ${errors.suburb ? 'form-input-error' : ''}`}
                placeholder="Melbourne"
              />
              {errors.suburb && <p className="form-error">{errors.suburb}</p>}
            </div>

            <div>
              <label htmlFor="customer-state" className="form-label">
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="customer-state"
                value={data.state}
                onChange={(e) => update('state', e.target.value)}
                className={`form-input ${errors.state ? 'form-input-error' : ''}`}
              >
                <option value="">Select</option>
                {AUSTRALIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p className="form-error">{errors.state}</p>}
            </div>

            <div>
              <label htmlFor="customer-pin" className="form-label">
                Postcode <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-pin"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={data.pin}
                onChange={(e) => update('pin', e.target.value.replace(/\D/g, ''))}
                className={`form-input ${errors.pin ? 'form-input-error' : ''}`}
                placeholder="3000"
              />
              {errors.pin && <p className="form-error">{errors.pin}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="customer-email" className="form-label">
              Email <span className="text-gray-400 font-normal">(optional — used for invoice delivery)</span>
            </label>
            <input
              id="customer-email"
              type="email"
              inputMode="email"
              value={data.email}
              onChange={(e) => update('email', e.target.value)}
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="customer@example.com"
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="customer-phone" className="form-label">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="customer-phone"
              type="tel"
              inputMode="tel"
              value={data.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="form-input"
              placeholder="0400 000 000"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary px-6 py-2.5">
          ← Back
        </button>
        <button onClick={handleNext} className="btn-primary px-6 py-2.5">
          Next: Items →
        </button>
      </div>
    </div>
  );
}
