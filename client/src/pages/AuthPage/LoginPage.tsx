import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '@features/auth';
import { useAppSelector } from '@app/hooks';
import { selectIsAuthenticated } from '@entities/session';
import styles from './AuthLayout.module.css';

export const LoginPage: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <img
            src="/wanderflow-logo.svg"
            alt="WanderFlow"
            className={styles.logoImage}
          />
          <span className={styles.brandSlogan}>Design trips. Track budgets. Pack light.</span>
          <div className={styles.featurePills}>
            <span className={styles.pill}>✈️ Day-by-day Itinerary</span>
            <span className={styles.pill}>💱 FX Expense Tracking</span>
            <span className={styles.pill}>🎒 Smart Luggage Checklist</span>
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
