import React, { useState, useEffect, useRef } from 'react';
import { usersApi } from '../../api/users';
import { UserOut } from '../../types/auth';
import styles from './UserSearch.module.css';

interface UserSearchProps {
  onSelect: (user: UserOut | null) => void;  // Изменяем тип, может быть null
  selectedUserId?: number;
  placeholder?: string;
  excludeCurrent?: boolean;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  onSelect,
  selectedUserId,
  placeholder = 'Search users...',
  excludeCurrent = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserOut[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOut | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const loadSelectedUser = async () => {
    if (!selectedUserId) return;
    try {
      const user = await usersApi.getUser(selectedUserId);
      setSelectedUser(user);
    } catch (error) {
      console.error('Failed to load selected user:', error);
    }
  };

  const searchUsers = async () => {
    setIsLoading(true);
    try {
      const user = await usersApi.getUserByUsername(searchTerm);
      setUsers(user ? [user] : []);
    } catch (error) {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (user: UserOut) => {
    setSelectedUser(user);
    setSearchTerm('');
    setIsOpen(false);
    onSelect(user);  // Передаем выбранного пользователя
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(null);
    onSelect(null);  // Передаем null при очистке
  };

  return (
    <div className={styles.container} ref={wrapperRef}>
      <div 
        className={styles.inputWrapper}
        onClick={() => setIsOpen(true)}
      >
        {selectedUser ? (
          <div className={styles.selectedUser}>
            <span className={styles.selectedUserName}>
              {selectedUser.full_name}
            </span>
            <span className={styles.selectedUserUsername}>
              @{selectedUser.username}
            </span>
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
            >
              ×
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className={styles.input}
            onFocus={() => setIsOpen(true)}
          />
        )}
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {isLoading && (
            <div className={styles.loading}>Searching...</div>
          )}
          
          {!isLoading && searchTerm.length < 2 && (
            <div className={styles.hint}>
              Type at least 2 characters to search
            </div>
          )}

          {!isLoading && searchTerm.length >= 2 && users.length === 0 && (
            <div className={styles.noResults}>
              No users found
            </div>
          )}

          {users.map(user => (
            <div
              key={user.id}
              className={styles.userItem}
              onClick={() => handleSelect(user)}
            >
              <div className={styles.userItemName}>{user.full_name}</div>
              <div className={styles.userItemDetails}>
                <span className={styles.userItemUsername}>@{user.username}</span>
                <span className={styles.userItemEmail}>{user.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};