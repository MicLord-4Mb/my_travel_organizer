import React, { forwardRef, useId, useState } from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelIcon?: React.ReactNode;
  labelRight?: React.ReactNode;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelIcon,
      labelRight,
      helperText,
      error,
      leftIcon,
      rightSlot,
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
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedBy =
      [ariaDescribedByProp, error ? errorId : helperText ? helperId : undefined]
        .filter(Boolean)
        .join(' ') || undefined;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={`${styles.fieldWrapper} ${containerClassName || ''}`}>
        {(label || labelRight) && (
          <div className={styles.labelRow}>
            {label && (
              <label htmlFor={inputId} className={styles.label}>
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
            styles.inputContainer,
            isFocused ? styles.focused : '',
            error ? styles.hasError : '',
            disabled ? styles.disabled : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={ariaInvalidProp ?? (error ? true : undefined)}
            aria-describedby={describedBy}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={[
              styles.input,
              leftIcon ? styles.withLeftIcon : '',
              rightSlot ? styles.withRightSlot : '',
              className || '',
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
          {rightSlot && <span className={styles.rightSlot}>{rightSlot}</span>}
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

Input.displayName = 'Input';
