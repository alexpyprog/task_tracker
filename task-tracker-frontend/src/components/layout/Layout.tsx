// src/components/layout/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Button } from 'react-bootstrap';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <Navbar />
      
      <div className="position-relative">
        {/* Desktop Sidebar */}
        <div className="d-none d-lg-block">
          <Sidebar />
        </div>
        
        {/* Контент для десктопа с отступом */}
        <div className="d-none d-lg-block" style={{ marginLeft: '260px' }}>
          <main className="p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
            <Outlet />
          </main>
        </div>
        
        {/* Контент для мобильных устройств без отступа */}
        <div className="d-lg-none">
          <main className="p-3" style={{ minHeight: 'calc(100vh - 56px)' }}>
            <Outlet />
          </main>
        </div>

        {/* Мобильное меню с плавной анимацией */}
        <div className="d-lg-none">
          {/* Затемнение фона с плавным появлением */}
          <div 
            className={`position-fixed top-0 start-0 w-100 h-100 bg-dark transition-opacity ${
              isMobileMenuOpen ? 'opacity-50 visible' : 'opacity-0 invisible'
            }`}
            style={{ 
              zIndex: 998,
              transition: 'opacity 0.3s ease, visibility 0.3s ease'
            }}
            onClick={toggleMobileMenu}
          />
          
          {/* Сайдбар с плавным выезжанием */}
          <div 
            className={`position-fixed top-0 start-0 h-100 bg-primary shadow-lg transition-transform ${
              isMobileMenuOpen ? 'translate-x-0' : 'translate-x-n100'
            }`}
            style={{ 
              width: '280px', 
              zIndex: 999,
              top: '56px',
              overflowY: 'auto',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>

        {/* Кнопка меню для мобильных с плавным появлением/скрытием */}
        <Button
          variant="primary"
          className={`d-lg-none position-fixed rounded-circle shadow transition-transform ${
            !isMobileMenuOpen ? 'scale-100' : 'scale-0'
          }`}
          onClick={toggleMobileMenu}
          style={{
            bottom: '1rem',
            right: '1rem',
            width: '48px',
            height: '48px',
            zIndex: 997,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease'
          }}
        >
          ☰
        </Button>
      </div>
    </>
  );
};