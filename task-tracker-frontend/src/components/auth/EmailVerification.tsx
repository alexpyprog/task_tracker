// src/components/auth/EmailVerification.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';

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
    return (
      <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="shadow-lg border-0 rounded-4 text-center">
            <Card.Body className="p-5">
              {status === 'success' ? (
                <>
                  <div className="display-1 text-success mb-3">✓</div>
                  <h2 className="fw-bold mb-3">Email подтвержден!</h2>
                  <p className="text-muted mb-4">{message}</p>
                  <Link to="/login">
                    <Button variant="primary" size="lg">
                      Войти в аккаунт
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="display-1 text-danger mb-3">⚠</div>
                  <h2 className="fw-bold mb-3">Ошибка подтверждения</h2>
                  <p className="text-muted mb-4">{message}</p>
                  <Link to="/profile">
                    <Button variant="secondary" size="lg">
                      Перейти в профиль
                    </Button>
                  </Link>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};