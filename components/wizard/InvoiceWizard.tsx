'use client';

import { useState, useEffect, useCallback } from 'react';
import { InvoiceData, InvoiceDetails, CustomerDetails, InvoiceItem, WizardStep } from '@/types/invoice';
import InvoiceDetailsStep from './steps/InvoiceDetails';
import CustomerDetailsStep from './steps/CustomerDetails';
import ItemsStep from './steps/ItemsStep';
import OverviewActionsStep from './steps/OverviewActions';

const STEPS: { key: WizardStep; label: string; shortLabel: string }[] = [
  { key: 'details', label: 'Invoice Details', shortLabel: 'Details' },
  { key: 'customer', label: 'Customer Details', shortLabel: 'Customer' },
  { key: 'items', label: 'Items', shortLabel: 'Items' },
  { key: 'overview', label: 'Overview & Actions', shortLabel: 'Overview' },
];

const DEFAULT_DETAILS: InvoiceDetails = {
  date: new Date().toISOString().split('T')[0],
  invoiceNumber: '',
  includeAbn: true,
};

const DEFAULT_CUSTOMER: CustomerDetails = {
  name: '',
  address: '',
  suburb: '',
  state: '',
  pin: '',
  email: '',
  phone: '',
};

const createNewItem = (): InvoiceItem => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  description: '',
  quantity: 1,
  unitPrice: 0,
  lineTotal: 0,
});

export default function InvoiceWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [details, setDetails] = useState<InvoiceDetails>(DEFAULT_DETAILS);
  const [customer, setCustomer] = useState<CustomerDetails>(DEFAULT_CUSTOMER);
  const [items, setItems] = useState<InvoiceItem[]>([createNewItem()]);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load auto-generated invoice number on mount
  useEffect(() => {
    fetch('/api/invoices/counter')
      .then((r) => r.json())
      .then((data) => {
        if (data.invoiceNumber) {
          setDetails((prev) => ({ ...prev, invoiceNumber: data.invoiceNumber }));
        }
      })
      .catch(() => {});
  }, []);

  // Mark dirty whenever data changes
  useEffect(() => {
    const hasData =
      details.invoiceNumber !== '' ||
      customer.name !== '' ||
      items.some((i) => i.description !== '');
    setIsDirty(hasData);
  }, [details, customer, items]);

  const computedTotals = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxRate = 10;
    const taxAmount = parseFloat((subtotal * taxRate / 100).toFixed(2));
    const total = parseFloat((subtotal + taxAmount).toFixed(2));
    return { subtotal, taxRate, taxAmount, total };
  }, [items]);

  function getInvoiceData(): InvoiceData {
    const { subtotal, taxRate, taxAmount, total } = computedTotals();
    return {
      details,
      customer,
      items,
      totals: { subtotal, taxRate, taxAmount, total },
    };
  }

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  function goNext() {
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setCurrentStep(nextStep.key);
  }

  function goBack() {
    const prevStep = STEPS[stepIndex - 1];
    if (prevStep) setCurrentStep(prevStep.key);
  }

  function handleSaved(invoiceId: string) {
    setSavedInvoiceId(invoiceId);
    setIsDirty(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1">
            {STEPS.map((step, index) => {
              const isCompleted = index < stepIndex;
              const isActive = step.key === currentStep;
              return (
                <div key={step.key} className="flex items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`step-indicator ${isCompleted ? 'step-completed' : isActive ? 'step-active' : 'step-pending'}`}>
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.shortLabel}</span>
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`ml-2 sm:ml-4 h-px w-4 sm:w-8 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {currentStep === 'details' && (
          <InvoiceDetailsStep
            data={details}
            onChange={setDetails}
            onNext={goNext}
          />
        )}
        {currentStep === 'customer' && (
          <CustomerDetailsStep
            data={customer}
            onChange={setCustomer}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 'items' && (
          <ItemsStep
            items={items}
            onChange={setItems}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 'overview' && (
          <OverviewActionsStep
            invoiceData={getInvoiceData()}
            savedInvoiceId={savedInvoiceId}
            isDirty={isDirty}
            onSaved={handleSaved}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
