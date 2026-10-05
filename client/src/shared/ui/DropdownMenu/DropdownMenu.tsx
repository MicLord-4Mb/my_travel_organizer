import React from 'react';
import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu';
import styles from './DropdownMenu.module.css';

export interface DropdownMenuItemConfig {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  destructive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: (DropdownMenuItemConfig | 'separator')[];
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'end',
  sideOffset = 4,
}) => {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          className={styles.content}
          align={align}
          sideOffset={sideOffset}
        >
          {items.map((item, index) => {
            if (item === 'separator') {
              return (
                <RadixDropdownMenu.Separator
                  key={`sep-${index}`}
                  className={styles.separator}
                />
              );
            }

            return (
              <RadixDropdownMenu.Item
                key={item.key}
                disabled={item.disabled}
                onSelect={item.onClick}
                className={[
                  styles.item,
                  item.destructive ? styles.destructive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.icon}
                <span>{item.label}</span>
              </RadixDropdownMenu.Item>
            );
          })}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
};

export const DropdownMenuRoot = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;
export const DropdownMenuPortal = RadixDropdownMenu.Portal;
export const DropdownMenuContent = RadixDropdownMenu.Content;
export const DropdownMenuItem = RadixDropdownMenu.Item;
export const DropdownMenuSeparator = RadixDropdownMenu.Separator;
