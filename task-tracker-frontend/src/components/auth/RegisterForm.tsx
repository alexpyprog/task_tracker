// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="shadow-lg border-0 rounded-4">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h1 className="display-6 fw-bold">
                  Создание <span className="text-primary">аккаунта</span>
                </h1>
                <p className="text-muted mt-2">Зарегистрируйтесь, чтобы начать работу</p>
              </div>

              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Имя пользователя *</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Введите имя пользователя"
                    disabled={isLoading}
                    required
                    minLength={3}
                    maxLength={50}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Полное имя *</Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Введите полное имя"
                    disabled={isLoading}
                    required
                    maxLength={255}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Введите email"
                    disabled={isLoading}
                    required
                    maxLength={255}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Телефон *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Введите номер телефона"
                    disabled={isLoading}
                    required
                    maxLength={30}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Пароль *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Создайте пароль"
                    disabled={isLoading}
                    required
                    minLength={8}
                  />
                  <Form.Text className="text-muted">
                    Минимум 8 символов
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Подтверждение пароля *</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Подтвердите пароль"
                    disabled={isLoading}
                    required
                    minLength={8}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="terms"
                    required
                    label={
                      <>
                        Я соглашаюсь с{' '}
                        <a href="/terms" className="text-primary">Условиями пользования</a>{' '}
                        и{' '}
                        <a href="/privacy" className="text-primary">Политикой конфиденциальности</a>
                      </>
                    }
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 py-2 fw-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <span className="text-muted">Уже есть аккаунт?</span>{' '}
                <Link to="/login" className="text-decoration-none">
                  Войти
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};