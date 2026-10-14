import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '@features/auth';
import { useAppSelector } from '@app/hooks';
import { selectIsAuthenticated } from '@entities/session';
import styles from './AuthLayout.module.css';

export const RegisterPage: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <img
            src="/wanderflow-logo.svg"
            alt="WanderFlow"
            className={styles.logoImage}
          />
          <span className={styles.brandSlogan}>Your all-in-one smart travel companion</span>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
