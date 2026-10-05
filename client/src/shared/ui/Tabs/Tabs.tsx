import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import styles from './Tabs.module.css';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
  dot?: boolean;
}

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  items?: TabItem[];
  variant?: 'pills' | 'solid' | 'segmented';
  className?: string;
  listClassName?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  defaultValue,
  onValueChange,
  items,
  variant = 'pills',
  className,
  listClassName,
  children,
}) => {
  return (
    <RadixTabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={`${styles.root} ${className || ''}`}
    >
      {items && (
        <RadixTabs.List className={`${styles.list} ${styles[variant]} ${listClassName || ''}`}>
          {items.map((item) => (
            <RadixTabs.Trigger key={item.value} value={item.value} className={styles.trigger}>
              {item.dot && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-status-success)',
                    display: 'inline-block',
                  }}
                />
              )}
              {item.icon}
              <span>{item.label}</span>
              {typeof item.count === 'number' && (
                <span className={styles.countBadge}>({item.count})</span>
              )}
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.List>
      )}
      {children}
    </RadixTabs.Root>
  );
};

export const TabsRoot = RadixTabs.Root;
export const TabsList = RadixTabs.List;
export const TabsTrigger = RadixTabs.Trigger;
export const TabsContent = RadixTabs.Content;
