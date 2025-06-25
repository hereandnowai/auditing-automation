
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Expect a Tailwind border color class e.g. 'border-yellow-400'
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'border-yellow-400' }) => { // Updated default color to a Tailwind yellow
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  // The color prop should be a Tailwind class like 'border-yellow-400' or 'border-[var(--hnai-primary)]'
  // If using CSS variable, ensure Tailwind JIT can pick it up or define it in tailwind.config.js
  // For simplicity here, using a close Tailwind yellow.
  // To use exact --hnai-primary, it would be `border-[var(--hnai-primary)]`
  
  // Using a class that refers to the CSS variable directly is also possible if Tailwind's JIT is configured or understands it.
  // However, `color = 'border-[var(--hnai-primary)]'` is more robust here.
  const spinnerColorClass = color === 'border-yellow-400' ? 'border-[var(--hnai-primary)]' : color;


  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 ${spinnerColorClass} ${sizeClasses[size]}`}></div>
  );
};

export default Spinner;