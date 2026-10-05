import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'transport'
  | 'lodging'
  | 'activities'
  | 'dining'
  | 'active'
  | 'upcoming'
  | 'past'
  | 'success'
  | 'danger'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  glass?: boolean;
  withDot?: boolean;
  pulseDot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  glass = false,
  withDot = false,
  pulseDot = false,
  icon,
  className,
  children,
  ...props
}) => {
  const classNames = [
    styles.badge,
    styles[variant],
    glass ? styles.glass : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...props}>
      {withDot && (
        <span
          className={`${styles.dot} ${pulseDot ? styles.pulseDot : ''}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
};
