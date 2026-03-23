import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  fullScreen = false 
}) => {
  const spinnerClass = `${styles.spinner} ${styles[`spinner-${size}`]}`;
  
  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        <div className={spinnerClass}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={spinnerClass}></div>
    </div>
  );
};