import React, { useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import styles from './Layout.module.css';

/**
 * Global Shell and Application Layout Frame.
 *
 * Provides the persistent page wrapper:
 * - Top navigation bar (`<Header />`) with search synchronizer and quick trip creation trigger.
 * - Central `<main>` viewport rendering child routes through React Router `<Outlet />`.
 * - Responsive mobile navigation bar (`<BottomNav />`).
 * - Universal `<Footer />`.
 */
export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchQuery = useMemo(() => {
    return new URLSearchParams(location.search).get('q') || '';
  }, [location.search]);

  const handleSearchChange = (q: string) => {
    if (q) {
      navigate(`/?q=${encodeURIComponent(q)}`, { replace: location.pathname === '/' });
    } else {
      navigate('/', { replace: location.pathname === '/' });
    }
  };

  const handlePlanNewTrip = () => {
    navigate('/?new=1');
  };

  return (
    <div className={styles.layout}>
      <Header
        onPlanNewTrip={handlePlanNewTrip}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
      <BottomNav onPlanNewTrip={handlePlanNewTrip} />
    </div>
  );
};
