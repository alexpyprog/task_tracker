// task-tracker-frontend/src/components/users/ProfilePage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { authApi } from '../../api/auth';
import { UserOut } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { PasswordConfirmModal } from '../common/PasswordConfirmModal';
import toast from 'react-hot-toast';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, logout, updateUser } = useAuth();
  
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [pendingPasswordUpdate, setPendingPasswordUpdate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const userId = id ? parseInt(id) : null;
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError('');

    try {
      const userData = await usersApi.getUser(userId);
      setUser(userData);
      
      setEditForm({
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        password: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError('Не удалось загрузить профиль пользователя');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!user) return;
    
    setIsSendingVerification(true);
    try {
      await authApi.sendVerification(user.email);
      toast.success('Письмо для подтверждения отправлено! Проверьте почту.');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Не удалось отправить письмо подтверждения');
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleUpdateProfile = async (skipPasswordCheck: boolean = false) => {
    if (!user) return;

    const hasPasswordChange = editForm.password && editForm.password.length >= 8;
    
    if (hasPasswordChange && !skipPasswordCheck) {
      if (editForm.password !== editForm.confirmPassword) {
        toast.error('Пароли не совпадают');
        return;
      }
      
      setPendingPasswordUpdate(editForm.password);
      setIsPasswordModalOpen(true);
      return;
    }

    await performUpdate();
  };

  const performUpdate = async () => {
    if (!user) return;

    const updateData: any = {
      full_name: editForm.full_name,
      email: editForm.email,
      phone: editForm.phone,
    };

    if (pendingPasswordUpdate) {
      updateData.password = pendingPasswordUpdate;
    }

    try {
      const updatedUser = await usersApi.updateUser(user.id, updateData);
      setUser(updatedUser);
      
      if (isOwnProfile) {
        await updateUser(updateData);
      }
      
      setIsEditing(false);
      setPendingPasswordUpdate(null);
      setEditForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      toast.success('Профиль успешно обновлен');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Не удалось обновить профиль');
      throw err;
    }
  };

  const handlePasswordConfirm = async () => {
    try {
      await performUpdate();
    } catch (error) {
      // Ошибка уже обработана в performUpdate
    } finally {
      setIsPasswordModalOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admin':
        return styles.statusAdmin;
      case 'manager':
        return styles.statusManager;
      case 'director':
        return styles.statusDirector;
      default:
        return styles.statusUser;
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Выход выполнен успешно');
    navigate('/login');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>👤</div>
          <h2 className={styles.errorTitle}>Пользователь не найден</h2>
          <p className={styles.errorText}>Пользователь не существует.</p>
          <Link to="/tasks" className={styles.backButton}>
            Назад к задачам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PasswordConfirmModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingPasswordUpdate(null);
        }}
        onConfirm={handlePasswordConfirm}
        title="Смена пароля"
        description="Для безопасности введите текущий пароль для подтверждения смены пароля."
      />

      <div className={styles.container}>
        <div className={styles.profileCard}>
          {/* Header с аватаром */}
          <div className={styles.profileHeader}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                {user.profile_photo_path ? (
                  <img src={user.profile_photo_path} alt={user.full_name} />
                ) : (
                  <span className={styles.avatarPlaceholder}>
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className={styles.userInfo}>
                <h1 className={styles.userName}>{user.full_name}</h1>
                <div className={styles.userMeta}>
                  <span className={styles.username}>@{user.username}</span>
                  <span className={`${styles.userStatus} ${getStatusColor(user.user_status)}`}>
                    {user.user_status === 'base_user' ? 'Пользователь' : user.user_status}
                  </span>
                </div>
              </div>
            </div>
            
            {isOwnProfile && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={styles.editButton}
              >
                ✏️ Редактировать
              </button>
            )}
          </div>

          {error && <ErrorAlert message={error} onClose={() => setError('')} />}

          {/* Информация о пользователе */}
          <div className={styles.content}>
            {isEditing ? (
              <div className={styles.editForm}>
                <h2 className={styles.sectionTitle}>Редактировать профиль</h2>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Полное имя</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Телефон</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className={styles.input}
                  />
                </div>

                {/* Секция смены пароля */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Новый пароль (необязательно)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className={styles.input}
                    placeholder="Оставьте пустым, чтобы оставить текущий пароль"
                  />
                </div>

                {editForm.password && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Подтвердите новый пароль</label>
                    <input
                      type="password"
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                      className={styles.input}
                      placeholder="Подтвердите новый пароль"
                    />
                    {editForm.password !== editForm.confirmPassword && editForm.confirmPassword && (
                      <div className={styles.errorText}>Пароли не совпадают</div>
                    )}
                    {editForm.password.length < 8 && editForm.password.length > 0 && (
                      <div className={styles.errorText}>Пароль должен содержать не менее 8 символов</div>
                    )}
                  </div>
                )}

                <div className={styles.formActions}>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        password: '',
                        confirmPassword: '',
                      });
                      setPendingPasswordUpdate(null);
                    }}
                    className={styles.cancelButton}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleUpdateProfile()}
                    className={styles.saveButton}
                    disabled={editForm.password !== editForm.confirmPassword}
                  >
                    Сохранить изменения
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.infoSection}>
                <h2 className={styles.sectionTitle}>Информация профиля</h2>
                
                <div className={styles.infoGrid}>
                  <div className={styles.emailSection}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Email</span>
                      <div className={styles.infoValue}>
                        <a href={`mailto:${user.email}`} className={styles.emailLink}>
                          {user.email}
                        </a>
                      </div>
                    </div>
                    
                    {isOwnProfile && (
                      <div className={styles.verificationWrapper}>
                        {user.verified ? (
                          <span className={styles.verifiedBadge}>
                            ✓ Подтвержден
                          </span>
                        ) : (
                          <>
                            <span className={styles.unverifiedBadge}>
                              ⚠ Не подтвержден
                            </span>
                            <button
                              onClick={handleSendVerification}
                              disabled={isSendingVerification}
                              className={styles.verifyButton}
                            >
                              {isSendingVerification ? 'Отправка...' : 'Подтвердить'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Телефон</span>
                    <a href={`tel:${user.phone}`} className={styles.infoValue}>
                      {user.phone}
                    </a>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Участник с</span>
                    <span className={styles.infoValue}>
                      {new Date(user.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Последнее обновление</span>
                    <span className={styles.infoValue}>
                      {new Date(user.updated_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {user.organization_id && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>ID организации</span>
                      <span className={styles.infoValue}>{user.organization_id}</span>
                    </div>
                  )}

                  {user.group_id && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>ID группы</span>
                      <span className={styles.infoValue}>{user.group_id}</span>
                    </div>
                  )}
                </div>

                {/* Кнопка выхода для своего профиля */}
                {!isEditing && isOwnProfile && (
                  <div className={styles.logoutSection}>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                      <span className={styles.logoutIcon}>🚪</span>
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};