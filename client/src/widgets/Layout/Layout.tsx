import React, { useMemo, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import styles from './Layout.module.css';

/**
 * Global Shell and Application Layout Frame.
 *
 * Provides the persistent page wrapper:
 * - Top navigation bar (`<Header />`) with 300ms debounced search synchronizer, active trip context preservation, and quick trip creation trigger.
 * - Central `<main>` viewport rendering child routes through React Router `<Outlet />`.
 * - Responsive mobile navigation bar (`<BottomNav />`).
 * - Universal `<Footer />`.
 */
export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeTripId } = useParams<{ id: string }>();
  const debounceTimerRef = useRef<number | null>(null);

  const urlSearchQuery = useMemo(() => {
    return new URLSearchParams(location.search).get('q') || '';
  }, [location.search]);

  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  const effectiveSearchQuery = draftQuery !== null ? draftQuery : urlSearchQuery;

  const handleSearchChange = (q: string) => {
    setDraftQuery(q);
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      setDraftQuery(null);
      if (q) {
        navigate(`/?q=${encodeURIComponent(q)}`, { replace: location.pathname === '/' });
      } else {
        navigate('/', { replace: location.pathname === '/' });
      }
    }, 300);
  };

  const handlePlanNewTrip = () => {
    navigate('/?new=1');
  };

  return (
    <div className={styles.layout}>
      <Header
        activeTripId={routeTripId}
        onPlanNewTrip={handlePlanNewTrip}
        searchQuery={effectiveSearchQuery}
        onSearchChange={handleSearchChange}
      />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
      <BottomNav activeTripId={routeTripId} onPlanNewTrip={handlePlanNewTrip} />
    </div>
  );
};
