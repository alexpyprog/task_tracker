import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { UserOut } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import toast from 'react-hot-toast';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

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
      });
    } catch (err: any) {
      setError('Failed to load user profile');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const updatedUser = await usersApi.updateUser(user.id, editForm);
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error('Failed to update profile');
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

              <div className={styles.formActions}>
                <button
                  onClick={() => setIsEditing(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  className={styles.saveButton}
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
  );
};