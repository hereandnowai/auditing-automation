
import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, type = 'info', onClose }) => {
  const baseClasses = "p-4 rounded-md flex items-start text-sm";
  
  // Updated typeClasses for new branding
  const typeClasses = {
    success: "bg-green-100 text-green-800 border border-green-300", // Standard green, good contrast
    error: "bg-red-100 text-red-800 border border-red-300",       // Standard red
    warning: "bg-amber-100 text-amber-800 border border-amber-300", // Amber for warning (distinct from primary yellow)
    info: "bg-teal-50 text-teal-800 border border-teal-200",     // Shades of secondary brand color (teal)
  };
  
  const IconComponent = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  }[type];

  const iconColors = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-teal-600",
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]} shadow-md mb-4`}>
      <IconComponent className={`w-5 h-5 mr-3 flex-shrink-0 ${iconColors[type]}`} />
      <div className="flex-grow whitespace-pre-wrap">{message}</div>
      {onClose && (
        <button 
          onClick={onClose} 
          className={`ml-4 -mr-1 -mt-1 p-1 rounded-md focus:outline-none hover:bg-opacity-20 hover:bg-current ${iconColors[type]}`}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;