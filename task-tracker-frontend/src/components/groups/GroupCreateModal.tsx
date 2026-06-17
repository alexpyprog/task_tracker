
import React, { useState } from 'react';
import { groupsApi } from '../../api/groups';
import { GroupCreate } from '../../types/group';
import toast from 'react-hot-toast';
import styles from './groups.module.css';

interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (groupId: number) => void;
}

export const GroupCreateModal: React.FC<GroupCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Введите название группы');
      return;
    }

    setIsSubmitting(true);
    try {
      const group = await groupsApi.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success('Группа создана!');
      onSuccess(group.id);
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка создания группы');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Создание группы</h2>
          <button className={styles.modalClose} onClick={handleClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Название группы <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.formInput}
                placeholder="Например: Backend Team"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Описание (необязательно)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.formTextarea}
                placeholder="Расскажите, чем занимается команда..."
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Создание...' : 'Создать группу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};