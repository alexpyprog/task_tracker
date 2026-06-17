// src/components/common/UserSearch.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usersApi } from '../../api/users';
import { UserOut } from '../../types/auth';
import { Form, Spinner, ListGroup } from 'react-bootstrap';
import styles from './UserSearch.module.css'; // Оставляем только для специфических стилей, которые нельзя заменить Bootstrap

interface UserSearchProps {
  onSelect: (user: UserOut | null) => void;
  selectedUserId?: number;
  placeholder?: string;
  excludeCurrent?: boolean;
  groupId?: number | null;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  onSelect,
  selectedUserId,
  placeholder = 'Поиск пользователей...',
  excludeCurrent = false,
  groupId = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserOut[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOut | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await usersApi.getCurrentUser();
        setCurrentUserId(user.id);
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadSelectedUser();
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch();
      }, 300);
    } else if (searchTerm.length === 0) {
      setUsers([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, groupId]);

  const loadSelectedUser = async () => {
    if (!selectedUserId) return;
    try {
      const user = await usersApi.getUser(selectedUserId);
      setSelectedUser(user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const performSearch = async () => {
    if (searchTerm.length < 2) return;
    
    setIsLoading(true);
    try {
      const results = await usersApi.searchUsers(
        searchTerm,
        groupId,
        0,
        20
      );
      
      let filteredResults = results;
      if (excludeCurrent && currentUserId) {
        filteredResults = results.filter(user => user.id !== currentUserId);
      }
      
      setUsers(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (user: UserOut) => {
    setSelectedUser(user);
    setSearchTerm('');
    setIsOpen(false);
    onSelect(user);
  };

  const handleClear = () => {
    setSelectedUser(null);
    onSelect(null);
  };

  const getPlaceholder = () => {
    if (groupId) {
      return 'Поиск по участникам группы...';
    }
    return placeholder;
  };

  return (
    <div className="position-relative w-100" ref={wrapperRef}>
      <div onClick={() => setIsOpen(true)}>
        {selectedUser ? (
          <div className="d-flex align-items-center justify-content-between p-2 border rounded bg-light">
            <div>
              <span className="fw-semibold">{selectedUser.full_name}</span>
              <span className="text-muted ms-2 small">@{selectedUser.username}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link text-danger text-decoration-none"
              onClick={handleClear}
            >
              ×
            </button>
          </div>
        ) : (
          <Form.Control
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={getPlaceholder()}
            onFocus={() => setIsOpen(true)}
          />
        )}
      </div>

      {isOpen && (
        <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
          {isLoading && (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="text-muted">Поиск...</span>
            </div>
          )}
          
          {!isLoading && searchTerm.length < 2 && (
            <div className="text-center py-3 text-muted small">
              Введите минимум 2 символа для поиска
            </div>
          )}

          {!isLoading && searchTerm.length >= 2 && users.length === 0 && (
            <div className="text-center py-3 text-muted small">
              {groupId ? 'В группе нет пользователей с таким именем' : 'Пользователи не найдены'}
            </div>
          )}

          <ListGroup variant="flush">
            {users.map(user => (
              <ListGroup.Item
                key={user.id}
                action
                onClick={() => handleSelect(user)}
                className="d-flex flex-column"
              >
                <div className="fw-semibold">{user.full_name}</div>
                <div className="small text-muted">
                  <span className="text-primary">@{user.username}</span>
                  <span className="ms-2">{user.email}</span>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}
    </div>
  );
};