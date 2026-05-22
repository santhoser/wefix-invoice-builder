'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface HomeAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  phase: string;
  onClick?: () => void;
}

export default function HomePage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
    } catch {
      setLoggingOut(false);
    }
  }

  const actions: HomeAction[] = [
    {
      id: 'generate',
      label: 'Generate New Invoice',
      description: 'Create a professional invoice for a customer using the step-by-step wizard.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      enabled: true,
      phase: 'Phase 1',
      onClick: () => router.push('/invoice/new'),
    },
    {
      id: 'regenerate',
      label: 'Regenerate Old Invoice',
      description: 'Find and regenerate a previously saved invoice.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      enabled: false,
      phase: 'Phase 2',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Configure company details, branding, and email preferences.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      enabled: false,
      phase: 'Phase 2',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/wefix_logo.png"
              alt="WeFix Handyman"
              width={100}
              height={44}
              className="object-contain"
            />
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn-secondary text-sm px-4 py-2"
          >
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Invoice Builder</h1>
          <p className="text-gray-500 text-sm mt-1">Select an action to get started.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.enabled ? action.onClick : undefined}
              disabled={!action.enabled}
              className={`
                card p-6 text-left transition-all duration-200 group
                ${action.enabled
                  ? 'hover:shadow-md hover:border-blue-200 cursor-pointer hover:-translate-y-0.5'
                  : 'opacity-60 cursor-not-allowed bg-gray-50'
                }
              `}
            >
              <div className={`
                mb-4 inline-flex p-3 rounded-xl
                ${action.enabled
                  ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                  : 'bg-gray-100 text-gray-400'
                }
              `}>
                {action.icon}
              </div>

              <h2 className={`font-semibold text-base mb-2 ${action.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                {action.label}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {action.description}
              </p>

              {!action.enabled && (
                <span className="mt-3 inline-block text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {action.phase}
                </span>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
