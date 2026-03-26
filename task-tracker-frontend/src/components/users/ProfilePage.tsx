import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersApi } from '../../api/users';
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
      setError('Failed to load user profile');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (skipPasswordCheck: boolean = false) => {
    if (!user) return;

    // Проверка на новый пароль
    const hasPasswordChange = editForm.password && editForm.password.length >= 8;
    
    if (hasPasswordChange && !skipPasswordCheck) {
      // Проверяем совпадение паролей
      if (editForm.password !== editForm.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      
      // Сохраняем новый пароль и показываем модальное окно
      setPendingPasswordUpdate(editForm.password);
      setIsPasswordModalOpen(true);
      return;
    }

    // Если пароль не меняется, обновляем без подтверждения
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
      
      // Обновляем контекст если это текущий пользователь
      if (isOwnProfile) {
        await updateUser(updateData);
      }
      
      setIsEditing(false);
      setPendingPasswordUpdate(null);
      setEditForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
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
    toast.success('Logged out successfully');
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
          <h2 className={styles.errorTitle}>User Not Found</h2>
          <p className={styles.errorText}>The user you're looking for doesn't exist.</p>
          <Link to="/tasks" className={styles.backButton}>
            Back to Tasks
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
        title="Change Password"
        description="For security, please enter your current password to confirm the password change."
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
                    {user.user_status.replace('_', ' ')}
                  </span>
                  {user.verified && (
                    <span className={styles.verifiedBadge} title="Verified">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {isOwnProfile && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={styles.editButton}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {error && <ErrorAlert message={error} onClose={() => setError('')} />}

          {/* Информация о пользователе */}
          <div className={styles.content}>
            {isEditing ? (
              <div className={styles.editForm}>
                <h2 className={styles.sectionTitle}>Edit Profile</h2>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
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
                  <label className={styles.label}>Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className={styles.input}
                  />
                </div>

                {/* Секция смены пароля */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>New Password (optional)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className={styles.input}
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                {editForm.password && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Confirm New Password</label>
                    <input
                      type="password"
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                      className={styles.input}
                      placeholder="Confirm your new password"
                    />
                    {editForm.password !== editForm.confirmPassword && editForm.confirmPassword && (
                      <div className={styles.errorText}>Passwords do not match</div>
                    )}
                    {editForm.password.length < 8 && editForm.password.length > 0 && (
                      <div className={styles.errorText}>Password must be at least 8 characters</div>
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
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateProfile()}
                    className={styles.saveButton}
                    disabled={editForm.password !== editForm.confirmPassword}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.infoSection}>
                <h2 className={styles.sectionTitle}>Profile Information</h2>
                
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email</span>
                    <a href={`mailto:${user.email}`} className={styles.infoValue}>
                      {user.email}
                    </a>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Phone</span>
                    <a href={`tel:${user.phone}`} className={styles.infoValue}>
                      {user.phone}
                    </a>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Member since</span>
                    <span className={styles.infoValue}>
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Last updated</span>
                    <span className={styles.infoValue}>
                      {new Date(user.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  {user.organization_id && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Organization ID</span>
                      <span className={styles.infoValue}>{user.organization_id}</span>
                    </div>
                  )}

                  {user.group_id && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Group ID</span>
                      <span className={styles.infoValue}>{user.group_id}</span>
                    </div>
                  )}
                </div>

                {/* Кнопка выхода для своего профиля */}
                {!isEditing && isOwnProfile && (
                  <div className={styles.logoutSection}>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                      <span className={styles.logoutIcon}>🚪</span>
                      Sign Out
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