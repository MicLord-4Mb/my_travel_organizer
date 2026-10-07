import React from 'react';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  'aria-label': ariaLabel,
}) => {
  return (
    <RadixCheckbox.Root
      id={id}
      checked={checked}
      onCheckedChange={(val) => onCheckedChange?.(val === true)}
      disabled={disabled}
      className={`${styles.root} ${className || ''}`}
      aria-label={ariaLabel}
    >
      <RadixCheckbox.Indicator className={styles.indicator}>
        <Check size={14} strokeWidth={3} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
};
