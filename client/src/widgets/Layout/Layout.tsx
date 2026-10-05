import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import type { LayoutContextType } from './LayoutContext';
import styles from './Layout.module.css';

export interface LayoutProps {
  onPlanNewTrip?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  onPlanNewTrip,
  searchQuery,
  onSearchChange,
  children,
}) => {
  const [newTripHandler, setNewTripHandler] = React.useState<(() => void) | undefined>(
    () => onPlanNewTrip
  );

  const handlePlanNewTrip = () => {
    if (onPlanNewTrip) {
      onPlanNewTrip();
    } else if (newTripHandler) {
      newTripHandler();
    } else {
      window.dispatchEvent(new CustomEvent('wanderflow:open-new-trip'));
    }
  };

  const contextValue: LayoutContextType = {
    openNewTripModal: handlePlanNewTrip,
    setOpenNewTripModalHandler: (handler: () => void) => setNewTripHandler(() => handler),
  };

  return (
    <div className={styles.layout}>
      <Header
        onPlanNewTrip={handlePlanNewTrip}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      <main className={styles.main}>
        {children || <Outlet context={contextValue} />}
      </main>

      <Footer />
      <BottomNav onPlanNewTrip={handlePlanNewTrip} />
    </div>
  );
};
