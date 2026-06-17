// src/components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useGroups } from '../../contexts/GroupsContext';
import { Nav, Spinner } from 'react-bootstrap';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const { groups, fetchUserGroups, isLoading } = useGroups();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const handleGroupClick = (groupId: number) => {
    navigate(`/groups/${groupId}`);
    if (onMobileClose) onMobileClose();
  };

  const handleGroupsHeaderClick = () => {
    navigate('/groups');
    if (onMobileClose) onMobileClose();
  };

  const handleLinkClick = () => {
    if (onMobileClose) onMobileClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const sidebarContent = (
    <>
      <div className="flex-grow-1">
        <Nav className="flex-column">
          {/* Задачи */}
          <Nav.Link
            as={NavLink}
            to="/tasks"
            onClick={handleLinkClick}
            className={`d-flex align-items-center gap-2 py-2 px-3 ${
              isActive('/tasks') ? 'active' : ''
            }`}
          >
            <i className="bi bi-check2-square fs-5"></i>
            <span>Задачи</span>
          </Nav.Link>
          
          {/* Дашборд */}
          <Nav.Link
            as={NavLink}
            to="/dashboard"
            onClick={handleLinkClick}
            className={`d-flex align-items-center gap-2 py-2 px-3 ${
              isActive('/dashboard') ? 'active' : ''
            }`}
          >
            <i className="bi bi-speedometer2 fs-5"></i>
            <span>Дашборд</span>
          </Nav.Link>

          {/* Группы */}
          <div className="nav-item w-100">
            <div
              onClick={handleGroupsHeaderClick}
              className={`d-flex align-items-center gap-2 py-2 px-3 nav-link ${
                isActive('/groups') ? 'active' : ''
              }`}
              style={{ cursor: 'pointer', color: 'rgba(255, 255, 255, 0.8)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              <i className="bi bi-people fs-5"></i>
              <span>Группы</span>
            </div>
            
            {!isLoading && groups.length > 0 && (
              <div className="ms-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => handleGroupClick(group.id)}
                    className={`d-flex align-items-center gap-2 py-1 px-3 small nav-link ${
                      location.pathname === `/groups/${group.id}` ? 'active' : ''
                    }`}
                    style={{ 
                      fontSize: '0.875rem', 
                      cursor: 'pointer',
                      color: 'rgba(255, 255, 255, 0.8)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                    }}
                  >
                    <i className="bi bi-folder fs-6"></i>
                    <span>{group.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {isLoading && (
              <div className="text-center py-2 ms-4">
                <Spinner animation="border" size="sm" variant="light" />
              </div>
            )}
          </div>
        </Nav>
      </div>

      {/* Настройки */}
      <div className="mt-auto border-top border-secondary">
        <Nav className="flex-column">
          <Nav.Link
            as={NavLink}
            to="/settings"
            onClick={handleLinkClick}
            className={`d-flex align-items-center gap-2 py-2 px-3 ${
              isActive('/settings') ? 'active' : ''
            }`}
          >
            <i className="bi bi-gear fs-5"></i>
            <span>Настройки</span>
          </Nav.Link>
        </Nav>
      </div>
    </>
  );

  return (
    <div 
      className="sidebar-desktop bg-primary position-fixed start-0 bottom-0"
      style={{ 
        width: '260px', 
        top: '64px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {sidebarContent}
    </div>
  );
};