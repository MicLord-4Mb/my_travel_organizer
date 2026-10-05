import React from 'react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>© 2025 WanderFlow. Minimalist travel organizer workspace.</div>
        <div className={styles.links}>
          <a href="#privacy" className={styles.link}>
            Privacy
          </a>
          <a href="#terms" className={styles.link}>
            Terms
          </a>
          <a href="#docs" className={styles.link}>
            Documentation
          </a>
        </div>
      </div>
    </footer>
  );
};
