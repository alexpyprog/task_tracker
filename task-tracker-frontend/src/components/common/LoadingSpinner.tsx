// src/components/common/LoadingSpinner.tsx
import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  fullScreen = false 
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm': return '1.5rem';
      case 'md': return '3rem';
      case 'lg': return '4rem';
      default: return '3rem';
    }
  };

  const spinner = (
    <Spinner 
      animation="border" 
      variant="primary" 
      style={{ width: getSpinnerSize(), height: getSpinnerSize() }}
    />
  );

  if (fullScreen) {
    return (
      <Container 
        fluid 
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
      >
        {spinner}
      </Container>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center p-4">
      {spinner}
    </div>
  );
};