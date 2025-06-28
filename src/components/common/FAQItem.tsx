import React from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
}

export default function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer p-6">
          <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
          <span className="relative ml-1.5 h-5 w-5 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-100 group-open:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-0 group-open:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </summary>
        <div className="px-6 pb-6 pt-0">
          <p className="text-gray-600">{answer}</p>
        </div>
      </details>
    </div>
  );
}