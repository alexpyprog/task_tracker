import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.navLeft}>
          <Link to="/tasks" className={styles.logo} onClick={handleLinkClick}>
            TaskTracker
          </Link>
          {/* <Link to="/tasks" className={styles.navLink}>
            Мои задачи
          </Link>
          <Link to="/tasks/created-by-me" className={styles.navLink}>
            Созданные мной
          </Link> */}
        </div>

        <div className={styles.navRight}>
          {user && (
            <>
              <div className={styles.userInfo}>
                <Link to={`/users/${user.id}`} className={styles.userLink}>
                  <span className={styles.userName}>{user.full_name}</span>
                  <span className={styles.userStatus}>{user.user_status}</span>
                </Link>
              </div>
            </>
          )}
          
          <button 
            className={styles.menuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
        {user && (
          <>
            <div className={styles.mobileUserInfo}>
              <div className={styles.mobileUserDetails}>
                <span className={styles.mobileUserName}>{user.full_name}</span>
                <span className={styles.mobileUserStatus}>{user.user_status}</span>
              </div>
            </div>

            {/* <Link 
              to="/tasks" 
              className={styles.mobileNavLink}
              onClick={handleLinkClick}
            >
              📋 Мои задачи
            </Link>
            
            <Link 
              to="/tasks/created" 
              className={styles.mobileNavLink}
              onClick={handleLinkClick}
            >
              ✨ Созданные мной
            </Link> */}
            
            <Link 
              to={`/users/${user.id}`} 
              className={styles.mobileNavLink}
              onClick={handleLinkClick}
            >
              👤 Мой профиль
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};