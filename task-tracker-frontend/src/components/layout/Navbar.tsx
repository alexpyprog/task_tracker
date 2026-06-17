// src/components/layout/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar as BSNavbar, Container, Nav, NavDropdown } from 'react-bootstrap';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <BSNavbar bg="secondary" variant="dark" expand="lg" sticky="top" className="shadow-sm">
      <Container fluid>
        <BSNavbar.Brand as={Link} to="/dashboard" className="fw-bold fs-4">
          ТаскЛаб
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="navbar-nav" />
        
        <BSNavbar.Collapse id="navbar-nav">
          <Nav className="ms-auto">
            {user && (
              <NavDropdown
                title={
                  <div className="d-inline-flex align-items-center gap-2">
                    <div 
                      className="rounded-circle bg-white d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <span className="text-primary fw-semibold small">
                        {getInitials(user.full_name)}
                      </span>
                    </div>
                    <span className="d-none d-md-inline">
                      {user.full_name?.split(' ')[0] || user.username}
                    </span>
                  </div>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to={`/users/${user.id}`}>
                  <span className="me-2">👤</span> Профиль
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <span className="me-2">🚪</span> Выйти
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};