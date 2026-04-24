import React from 'react';

interface FormFieldProps {
  label?: string;
  error?: string | null | undefined;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

/**
 * Standard wrapper for form fields with label and error message.
 */
export function FormField({ label, error, children, className = '', required }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-[11px] font-black text-white/40 uppercase tracking-widest px-1 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-[11px] font-bold text-rose-400 px-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`form-input ${error ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500' : ''} ${className}`}
        {...props}
      />
    );
  },
);

FormInput.displayName = 'FormInput';

interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const FormTextArea = React.forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`form-textarea ${error ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500' : ''} ${className}`}
        {...props}
      />
    );
  },
);

FormTextArea.displayName = 'FormTextArea';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`form-select ${error ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);

FormSelect.displayName = 'FormSelect';
