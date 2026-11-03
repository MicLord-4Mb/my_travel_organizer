import React, { forwardRef, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelIcon?: React.ReactNode;
  labelRight?: React.ReactNode;
  options?: ReadonlyArray<SelectOption>;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      labelIcon,
      labelRight,
      options,
      helperText,
      error,
      children,
      className,
      containerClassName,
      disabled,
      required,
      id,
      onFocus,
      onBlur,
      'aria-describedby': ariaDescribedByProp,
      'aria-invalid': ariaInvalidProp,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;
    const describedBy =
      [ariaDescribedByProp, error ? errorId : helperText ? helperId : undefined]
        .filter(Boolean)
        .join(' ') || undefined;

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={`${styles.fieldWrapper} ${containerClassName || ''}`}>
        {(label || labelRight) && (
          <div className={styles.labelRow}>
            {label && (
              <label htmlFor={selectId} className={styles.label}>
                {labelIcon && <span className={styles.labelIcon}>{labelIcon}</span>}
                <span>{label}</span>
                {required && <span className={styles.required}>*</span>}
              </label>
            )}
            {labelRight && <span className={styles.labelRight}>{labelRight}</span>}
          </div>
        )}

        <div
          className={[
            styles.selectContainer,
            isFocused ? styles.focused : '',
            error ? styles.hasError : '',
            disabled ? styles.disabled : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={ariaInvalidProp ?? (error ? true : undefined)}
            aria-describedby={describedBy}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`${styles.select} ${className || ''}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span className={styles.chevronIcon} aria-hidden="true">
            <ChevronDown size={18} />
          </span>
        </div>

        {error ? (
          <span id={errorId} className={styles.errorText} role="alert">
            {error}
          </span>
        ) : helperText ? (
          <span id={helperId} className={styles.helperText}>
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
