import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ErrorAlert } from '../common/ErrorAlert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import styles from './RegisterForm.module.css';

interface RegisterFormData {
  username: string;
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Имя пользователя должно содержать не менее 3 символов');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Введите корректный email адрес');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/tasks');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>
          Создание <span className={styles.titleAccent}>аккаунта</span>
        </h1>
        
        <h2 className={styles.subtitle}>Зарегистрируйтесь, чтобы начать работу</h2>
        
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="Введите имя пользователя"
              disabled={isLoading}
              minLength={3}
              maxLength={50}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="full_name" className={styles.label}>
              Полное имя
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Введите полное имя"
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="Введите email"
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>
              Телефон
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className={styles.input}
              placeholder="Введите номер телефона"
              disabled={isLoading}
              maxLength={30}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${error && formData.password !== formData.confirmPassword ? styles.inputError : ''}`}
              placeholder="Создайте пароль"
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Подтверждение пароля
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`${styles.input} ${error && formData.password !== formData.confirmPassword ? styles.inputError : ''}`}
              placeholder="Подтвердите пароль"
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className={styles.terms}>
            <input
              type="checkbox"
              id="terms"
              required
              className={styles.checkbox}
            />
            <label htmlFor="terms" className={styles.termsLabel}>
              Я соглашаюсь с {' '}
              <a href="/terms" className={styles.termsLink}>Условиями пользовения</a>{' '}
              и{' '}
              <a href="/privacy" className={styles.termsLink}>Политикой конфиденциальности</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className={styles.links}>
          <p className={styles.loginText}>
            Уже есть аккаунт?{' '}
            <Link to="/login" className={styles.link}>
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};