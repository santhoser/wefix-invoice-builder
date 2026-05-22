import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import InvoiceWizard from '@/components/wizard/InvoiceWizard';

export const metadata: Metadata = {
  title: 'New Invoice — WeFix Invoice Builder',
};

export default function NewInvoicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/home" className="text-gray-400 hover:text-gray-600 transition-colors" title="Back to Home">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Image src="/wefix_logo.png" alt="WeFix Handyman" width={80} height={36} className="object-contain" />
          <span className="text-gray-600 text-sm font-medium">New Invoice</span>
        </div>
      </nav>

      {/* Wizard */}
      <InvoiceWizard />
    </div>
  );
}
