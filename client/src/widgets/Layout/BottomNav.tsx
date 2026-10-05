import React from 'react';
import { NavLink } from 'react-router-dom';
import { Luggage, Calendar, Plus, CreditCard, CheckSquare } from 'lucide-react';
import styles from './BottomNav.module.css';

export interface BottomNavProps {
  onPlanNewTrip?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onPlanNewTrip }) => {
  return (
    <nav className={styles.bottomNav} aria-label="Mobile Navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ''}`
        }
      >
        <Luggage size={20} />
        <span>Trips</span>
      </NavLink>

      <NavLink
        to="/itinerary"
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ''}`
        }
      >
        <Calendar size={20} />
        <span>Itinerary</span>
      </NavLink>

      <div className={styles.fabWrapper}>
        <button
          type="button"
          className={styles.fabButton}
          aria-label="Plan New Trip"
          onClick={onPlanNewTrip}
        >
          <Plus size={24} />
        </button>
      </div>

      <NavLink
        to="/budget"
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ''}`
        }
      >
        <CreditCard size={20} />
        <span>Budget</span>
      </NavLink>

      <NavLink
        to="/checklists"
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ''}`
        }
      >
        <CheckSquare size={20} />
        <span>Checklists</span>
      </NavLink>
    </nav>
  );
};
