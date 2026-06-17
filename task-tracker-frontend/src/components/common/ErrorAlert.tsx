// src/components/common/ErrorAlert.tsx
import React from 'react';
import { Alert } from 'react-bootstrap';

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  return (
    <Alert 
      variant="danger" 
      onClose={onClose} 
      dismissible={!!onClose}
      className="mb-3"
    >
      <div className="d-flex align-items-center gap-2">
        <span>⚠️</span>
        <span>{message}</span>
      </div>
    </Alert>
  );
};