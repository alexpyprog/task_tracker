import React, { useState } from 'react';
import { authApi } from '../../api/auth';
import styles from './PasswordConfirmModal.module.css';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
}

export const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Подтверждение пароля',
  description = 'Введите текущий пароль для продолжения.',
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!password) {
      setError('Пароль обязателен');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await authApi.verifyPassword(password);
      await onConfirm();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Неверный пароль');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setIsVerifying(false);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleConfirm();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalDescription}>{description}</p>
        
        <div className={styles.inputGroup}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            placeholder="Введите текущий пароль"
            disabled={isVerifying}
            autoFocus
          />
          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
        
        <div className={styles.modalActions}>
          <button
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={isVerifying}
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className={styles.confirmButton}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <span className={styles.spinner}></span>
                Проверка...
              </>
            ) : (
              'Подтвердить'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};