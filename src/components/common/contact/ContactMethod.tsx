import React from 'react';

interface ContactMethodProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl?: string;
  onClick?: () => void;
  bgColor: string;
  iconColor: string;
  buttonColor: string;
  buttonHoverColor: string;
}

export default function ContactMethod({
  icon,
  title,
  description,
  actionLabel,
  actionUrl,
  onClick,
  bgColor,
  iconColor,
  buttonColor,
  buttonHoverColor
}: ContactMethodProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
        <div className={`h-8 w-8 ${iconColor}`}>
          {icon}
        </div>
      </div>
      <h2 className="text-xl font-bold text-center mb-2">{title}</h2>
      <p className="text-gray-600 text-center mb-4">
        {description}
      </p>
      <div className="text-center">
        {actionUrl ? (
          <a 
            href={actionUrl} 
            className={`inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white ${buttonColor} ${buttonHoverColor}`}
          >
            {actionLabel}
          </a>
        ) : (
          <button 
            onClick={onClick} 
            className={`inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white ${buttonColor} ${buttonHoverColor}`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

