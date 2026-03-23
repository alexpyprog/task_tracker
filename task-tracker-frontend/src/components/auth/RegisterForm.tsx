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
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
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
      setError(err.response?.data?.detail || 'Failed to register');
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
          Create <span className={styles.titleAccent}>Account</span>
        </h1>
        
        <h2 className={styles.subtitle}>Sign up to get started</h2>
        
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="Enter your username"
              disabled={isLoading}
              minLength={3}
              maxLength={50}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="full_name" className={styles.label}>
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter your full name"
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
              placeholder="Enter your email"
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter your phone number"
              disabled={isLoading}
              maxLength={30}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${error && formData.password !== formData.confirmPassword ? styles.inputError : ''}`}
              placeholder="Create a password"
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`${styles.input} ${error && formData.password !== formData.confirmPassword ? styles.inputError : ''}`}
              placeholder="Confirm your password"
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
              I agree to the{' '}
              <a href="/terms" className={styles.termsLink}>Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" className={styles.termsLink}>Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        
        <div className={styles.links}>
          <p className={styles.loginText}>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};