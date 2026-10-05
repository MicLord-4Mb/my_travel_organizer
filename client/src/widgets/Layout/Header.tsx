import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Plus, Bell } from 'lucide-react';
import { Button } from '@shared/ui';
import styles from './Header.module.css';

export interface HeaderProps {
  onPlanNewTrip?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onPlanNewTrip,
  searchQuery = '',
  onSearchChange,
}) => {
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
              to="/itinerary"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              Itinerary
            </NavLink>
            <NavLink
              to="/budget"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              Budget
            </NavLink>
            <NavLink
              to="/checklists"
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
          >
            <Bell size={20} />
          </button>

          <img
            src="/user-avatar-planner.png"
            alt="Planner Avatar"
            className={styles.avatar}
          />
        </div>
      </div>
    </header>
  );
};
