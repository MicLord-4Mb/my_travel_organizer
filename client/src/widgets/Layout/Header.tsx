import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Plus, Bell } from 'lucide-react';
import { Button, useToast } from '@shared/ui';
import { UserMenu } from '@features/auth';
import styles from './Header.module.css';

/**
 * Props accepted by the `<Header />` component.
 */
export interface HeaderProps {
  /** Currently active trip ID in route params to preserve context across workspace tabs */
  activeTripId?: string;
  /** Optional callback to trigger new trip creation */
  onPlanNewTrip?: () => void;
  /** Active search query string */
  searchQuery?: string;
  /** Callback fired when the search input value changes */
  onSearchChange?: (query: string) => void;
}

/**
 * Global Top Navigation Bar.
 */
export const Header: React.FC<HeaderProps> = ({
  activeTripId,
  onPlanNewTrip,
  searchQuery = '',
  onSearchChange,
}) => {
  const { toast } = useToast();
  const itineraryPath = activeTripId ? `/trips/${activeTripId}` : '/itinerary';
  const budgetPath = activeTripId ? `/trips/${activeTripId}/budget` : '/budget';
  const checklistsPath = activeTripId ? `/trips/${activeTripId}/checklists` : '/checklists';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.leftGroup}>
          <NavLink to="/" className={styles.logoLink}>
            <img
              src="/wanderflow-logo.svg"
              alt="WanderFlow"
              className={styles.logoImage}
            />
          </NavLink>

          <nav className={styles.nav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              Trips
            </NavLink>
            <NavLink
              to={itineraryPath}
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              Itinerary
            </NavLink>
            <NavLink
              to={budgetPath}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              Budget
            </NavLink>
            <NavLink
              to={checklistsPath}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              Checklists
            </NavLink>
          </nav>
        </div>

        <div className={styles.searchGroup}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search trips, spots, bookings..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.kbd}>⌘K</span>
          </div>
        </div>

        <div className={styles.rightGroup}>
          <div className={styles.planBtnDesktop}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={18} />}
              onClick={onPlanNewTrip}
            >
              Plan New Trip
            </Button>
          </div>

          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Notifications"
            onClick={() => toast({ title: 'Not Implemented', description: 'Notifications are coming in Stage 2!' })}
          >
            <Bell size={20} />
          </button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
};
