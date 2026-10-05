import React, { forwardRef } from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  withPadding?: boolean;
  hoverable?: boolean;
  interactive?: boolean;
  accentCategory?: 'transport' | 'lodging' | 'activities' | 'dining';
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      withPadding = true,
      hoverable = false,
      interactive = false,
      accentCategory,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.card,
      withPadding ? styles.withPadding : '',
      hoverable ? styles.hoverable : '',
      interactive ? styles.interactive : '',
      accentCategory === 'transport' ? styles.accentTransport : '',
      accentCategory === 'lodging' ? styles.accentLodging : '',
      accentCategory === 'activities' ? styles.accentActivities : '',
      accentCategory === 'dining' ? styles.accentDining : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
