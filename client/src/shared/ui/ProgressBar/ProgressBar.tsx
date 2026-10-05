import React from 'react';
import styles from './ProgressBar.module.css';

export type ProgressBarVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'transport'
  | 'lodging'
  | 'muted';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: ProgressBarVariant;
  height?: number | string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'primary',
  height,
  className,
  style,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`${styles.track} ${className || ''}`}
      style={{ ...(height ? { height } : {}), ...style }}
      {...props}
    >
      <div
        className={`${styles.fill} ${styles[variant]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
