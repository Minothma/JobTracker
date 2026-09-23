import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-zinc-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3 py-1.5 text-xs sm:text-sm rounded-md border bg-[#121214] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500'
              : 'border-[#27272A] hover:border-[#3F3F46]'
          } ${className}`}
          {...props}
        />
        {error && <span className="text-[11px] text-rose-400">{error}</span>}
        {helperText && !error && <span className="text-[11px] text-zinc-500">{helperText}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-zinc-300">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full px-3 py-1.5 text-xs sm:text-sm rounded-md border bg-[#121214] text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500'
              : 'border-[#27272A] hover:border-[#3F3F46]'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#121214] text-zinc-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-[11px] text-rose-400">{error}</span>}
      </div>
    );
  },
);

Select.displayName = 'Select';
