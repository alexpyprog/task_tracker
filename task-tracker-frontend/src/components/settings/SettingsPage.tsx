import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users';
import { PasswordConfirmModal } from '../common/PasswordConfirmModal';
import toast from 'react-hot-toast';
import styles from './Settings.module.css';

export const SettingsPage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingPasswordUpdate, setPendingPasswordUpdate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (skipPasswordCheck = false) => {
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
      await updateUser(updateData);
      setIsEditing(false);
      setPendingPasswordUpdate(null);
      setEditForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      toast.success('Профиль успешно обновлен');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Не удалось обновить профиль');
    }
  };

  const handlePasswordConfirm = async () => {
    await performUpdate();
    setIsPasswordModalOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await usersApi.deleteUser(user.id);
      toast.success('Аккаунт удален');
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка удаления аккаунта');
    }
  };

  return (
    <div className={styles.container}>
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

      <div className={styles.settingsCard}>
        <h1 className={styles.title}>Настройки</h1>

        {/* Профиль */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>👤 Профиль</h2>
          {isEditing ? (
            <div className={styles.editForm}>
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
              <div className={styles.formGroup}>
                <label className={styles.label}>Новый пароль</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className={styles.input}
                  placeholder="Оставьте пустым, чтобы не менять"
                />
              </div>
              {editForm.password && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Подтвердите пароль</label>
                  <input
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    className={styles.input}
                  />
                </div>
              )}
              <div className={styles.formActions}>
                <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>
                  Отмена
                </button>
                <button onClick={() => handleUpdateProfile()} className={styles.saveButton}>
                  Сохранить
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Имя</span>
                <span className={styles.infoValue}>{user?.full_name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{user?.email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Телефон</span>
                <span className={styles.infoValue}>{user?.phone}</span>
              </div>
              <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                Редактировать профиль
              </button>
            </div>
          )}
        </section>

        {/* Внешний вид */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎨 Внешний вид</h2>
          <div className={styles.themeSelector}>
            <button className={styles.themeButton}>🌞 Светлая</button>
            <button className={`${styles.themeButton} ${styles.themeActive}`}>🌙 Темная</button>
          </div>
        </section>

        {/* Опасная зона */}
        <section className={`${styles.section} ${styles.dangerSection}`}>
          <h2 className={styles.sectionTitle}>⚠️ Управление аккаунтом</h2>
          <button onClick={handleDeleteAccount} className={styles.deleteButton}>
            Удалить аккаунт
          </button>
          <p className={styles.dangerText}>
            Это действие нельзя отменить. Все данные будут удалены безвозвратно.
          </p>
        </section>
      </div>
    </div>
  );
};