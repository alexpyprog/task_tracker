import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi } from '../../api/groups';
import { Group } from '../../types/group';
import { GroupCard } from './GroupCard';
import { InvitationsList } from './InvitationsList';
import { GroupCreateModal } from './GroupCreateModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../contexts/GroupsContext';
import toast from 'react-hot-toast';
import styles from './groups.module.css';

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const { fetchUserGroups } = useGroups();
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const data = await groupsApi.getUserGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast.error('Не удалось загрузить группы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupCreated = (groupId: number) => {
    fetchUserGroups(); // Обновляем контекст
    loadGroups(); // Обновляем страницу
    navigate(`/groups/${groupId}`);
  };

  const handleInvitationAction = () => {
    loadGroups(); // Перезагружаем группы (пользователь мог присоединиться к новой)
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className={styles.groupsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Группы</h1>
          <p className={styles.pageSubtitle}>
            Управление командами и участниками
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className={styles.createButton}
        >
          + Создать группу
        </button>
      </div>

      {/* Приглашения */}
      <div className={styles.invitationsSection}>
        <h2 className={styles.sectionTitle}>Приглашения</h2>
        <InvitationsList onInvitationAction={handleInvitationAction} />
      </div>

      {/* Мои группы */}
      <div className={styles.groupsSection}>
        <h2 className={styles.sectionTitle}>Мои группы</h2>
        {groups.length === 0 ? (
          <div className={styles.emptyGroups}>
            <div className={styles.emptyIcon}>👥</div>
            <h3>У вас пока нет групп</h3>
            <p>Создайте группу или примите приглашение, чтобы начать работу</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={styles.emptyCreateButton}
            >
              Создать первую группу
            </button>
          </div>
        ) : (
          <div className={styles.groupsGrid}>
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isManager={group.manager_id === user?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модалка создания группы */}
      <GroupCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleGroupCreated}
      />
    </div>
  );
};