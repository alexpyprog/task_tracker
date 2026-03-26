import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import styles from './EmailVerification.module.css';

export const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Неверная ссылка подтверждения');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(response.message);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Ошибка подтверждения email');
      }
    };

    verifyEmail();
  }, [token]);

  if (status === 'loading') {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'success' ? (
          <>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.title}>Email подтвержден!</h1>
            <p className={styles.message}>{message}</p>
            <Link to="/login" className={styles.button}>
              Войти в аккаунт
            </Link>
          </>
        ) : (
          <>
            <div className={styles.errorIcon}>⚠</div>
            <h1 className={styles.title}>Ошибка подтверждения</h1>
            <p className={styles.message}>{message}</p>
            <Link to="/profile" className={styles.button}>
              Перейти в профиль
            </Link>
          </>
        )}
      </div>
    </div>
  );
};