// src/components/common/PasswordConfirmModal.tsx
import React, { useState } from 'react';
import { authApi } from '../../api/auth';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

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
    <Modal show={isOpen} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-3">{description}</p>
        
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        <Form.Group>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите текущий пароль"
            disabled={isVerifying}
            autoFocus
            isInvalid={!!error}
          />
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isVerifying}>
          Отмена
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={isVerifying}>
          {isVerifying ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Проверка...
            </>
          ) : (
            'Подтвердить'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};