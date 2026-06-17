import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupsApi } from '../../api/groups';
import { invitationsApi } from '../../api/invitations';
import { tasksApi } from '../../api/tasks';
import { usersApi } from '../../api/users';
import { Group, GroupMember } from '../../types/group';
import { TaskListOut, TaskStatus } from '../../types/task';
import { InvitationCreate } from '../../types/invitation';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../contexts/GroupsContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { UserSearch } from '../common/UserSearch';
import { UserOut } from '../../types/auth';
import toast from 'react-hot-toast';
import styles from './groups.module.css';

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { fetchUserGroups } = useGroups();
  
  const groupId = parseInt(id || '0');
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [tasks, setTasks] = useState<TaskListOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'my' | 'completed'>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<GroupMember | null>(null);
  
  const [inviteUserId, setInviteUserId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  
  const [userNames, setUserNames] = useState<Map<number, string>>(new Map());

  const isManager = group?.manager_id === currentUser?.id;
  const isMember = members.some(m => m.id === currentUser?.id);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Загружаем группу и участников
      const [groupData, membersData] = await Promise.all([
        groupsApi.getGroup(groupId),
        groupsApi.getGroupMembers(groupId),
      ]);
      
      setGroup(groupData);
      setMembers(membersData);
      
      // ========== ГЛАВНОЕ ИСПРАВЛЕНИЕ ==========
      // Загружаем ВСЕ задачи группы через специальный эндпоинт
      // Этот эндпоинт должен возвращать все задачи, где group_id = groupId
      let groupTasks: TaskListOut[] = [];
      
      try {
        // Используем специальный эндпоинт для задач группы
        groupTasks = await tasksApi.getTasksByGroup(groupId);
        console.log(`Loaded ${groupTasks.length} tasks for group ${groupId}:`, groupTasks);
      } catch (err) {
        console.error('Failed to load group tasks via API, using fallback:', err);
        
        // Fallback: загружаем все задачи из всех источников
        // Получаем задачи, где пользователь исполнитель
        const myTasks = await tasksApi.getMyTasks(0, 500);
        // Получаем задачи, созданные пользователем
        const createdByMe = await tasksApi.getCreatedByMe(0, 500);
        
        // Объединяем все задачи
        const allTasksMap = new Map<string, TaskListOut>();
        [...myTasks, ...createdByMe].forEach(task => {
          if (!allTasksMap.has(task.id)) {
            allTasksMap.set(task.id, task);
          }
        });
        
        // Фильтруем по group_id
        groupTasks = Array.from(allTasksMap.values()).filter(
          task => task.group_id === groupId
        );
        
        console.log(`Fallback: found ${groupTasks.length} tasks for group ${groupId}`);
      }
      
      setTasks(groupTasks);
      
      // Загружаем имена пользователей для задач (включая создателей и исполнителей)
      const userIds = new Set<number>();
      groupTasks.forEach(task => {
        userIds.add(task.created_by);
        userIds.add(task.worker_id);
      });
      
      // Также добавляем всех участников группы, чтобы имена были доступны
      membersData.forEach(member => {
        userIds.add(member.user_id);
      });
      
      const nameMap = new Map<number, string>();
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const userData = await usersApi.getUser(userId);
            nameMap.set(userId, userData.full_name);
          } catch {
            nameMap.set(userId, `User #${userId}`);
          }
        })
      );
      setUserNames(nameMap);
      
    } catch (err: any) {
      console.error('Failed to load group data:', err);
      setError(err.response?.data?.detail || 'Не удалось загрузить информацию о группе');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для обновления задач (вызывается после создания новой задачи)
  const refreshTasks = async () => {
    try {
      const groupTasks = await tasksApi.getTasksByGroup(groupId);
      setTasks(groupTasks);
      
      // Обновляем имена пользователей
      const userIds = new Set<number>();
      groupTasks.forEach(task => {
        userIds.add(task.created_by);
        userIds.add(task.worker_id);
      });
      
      const nameMap = new Map(userNames);
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          if (!nameMap.has(userId)) {
            try {
              const userData = await usersApi.getUser(userId);
              nameMap.set(userId, userData.full_name);
            } catch {
              nameMap.set(userId, `User #${userId}`);
            }
          }
        })
      );
      setUserNames(nameMap);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    }
  };

  // Слушаем событие обновления задач (можно использовать EventEmitter или контекст)
  useEffect(() => {
    // Обновляем задачи при фокусе на окне (пользователь вернулся со страницы создания)
    const handleFocus = () => {
      refreshTasks();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [groupId]);

  const handleSendInvitation = async () => {
    if (!inviteUserId && !inviteEmail) {
      toast.error('Выберите пользователя или введите email');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const data: InvitationCreate = {};
      if (inviteUserId) {
        data.to_user_id = inviteUserId;
      } else if (inviteEmail) {
        data.email = inviteEmail;
      }
      data.group_id = groupId;
      if (inviteMessage) data.message = inviteMessage;
      
      await invitationsApi.sendInvitation(groupId, data);
      toast.success('Приглашение отправлено!');
      setIsInviteModalOpen(false);
      setInviteUserId(null);
      setInviteEmail('');
      setInviteMessage('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка отправки приглашения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!isManager) {
      toast.error('Только менеджер может удалять участников');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await groupsApi.removeMember(groupId, member.user_id);
      toast.success(`Пользователь ${member.full_name} удалён из группы`);
      await loadGroupData();
      setSelectedMemberToRemove(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка удаления участника');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveGroup = async () => {
    setIsSubmitting(true);
    try {
      await groupsApi.leaveGroup(groupId);
      toast.success('Вы вышли из группы');
      await fetchUserGroups();
      navigate('/groups');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка выхода из группы');
    } finally {
      setIsSubmitting(false);
      setIsLeaveModalOpen(false);
    }
  };

  const handleDeleteGroup = async () => {
    setIsSubmitting(true);
    try {
      await groupsApi.deleteGroup(groupId);
      toast.success('Группа удалена');
      await fetchUserGroups();
      navigate('/groups');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка удаления группы');
    } finally {
      setIsSubmitting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleTransferManagement = async (member: GroupMember) => {
    console.log('handleTransferManagement called with:', member.id);
    if (!isManager) return;
    setIsSubmitting(true);
    try {
      await groupsApi.transferManagement(groupId, member.id);
      toast.success('Управление передано');
      await loadGroupData();
      await fetchUserGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка передачи управления');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'my') {
      return task.worker_id === currentUser?.id;
    }
    if (taskFilter === 'completed') {
      return task.status === TaskStatus.completed;
    }
    return true;
  });

  const getStatusClass = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.completed: return styles.statusCompleted;
      case TaskStatus.in_progress: return styles.statusInProgress;
      case TaskStatus.created: return styles.statusCreated;
      case TaskStatus.cancelled: return styles.statusCancelled;
      default: return '';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.completed: return 'Выполнена';
      case TaskStatus.in_progress: return 'В работе';
      case TaskStatus.created: return 'Создана';
      case TaskStatus.cancelled: return 'Отменена';
      default: return status;
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!group) {
    return (
      <div className={styles.groupDetail}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>🔍</div>
          <h2>Группа не найдена</h2>
          <p>Группа не существует или у вас нет доступа к ней.</p>
          <Link to="/groups" className={styles.backButton}>Вернуться к группам</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.groupDetail}>
      <div className={styles.groupHeader}>
        <div className={styles.groupHeaderLeft}>
          <Link to="/groups" className={styles.backLink}>← Все группы</Link>
          <div className={styles.groupTitleRow}>
            <span className={styles.groupIcon}>{group.icon || '🚀'}</span>
            <h1 className={styles.groupTitle}>{group.name}</h1>
            {isManager && (
              <span className={styles.managerBadge}>Менеджер</span>
            )}
          </div>
          {group.description && (
            <p className={styles.groupDescription}>{group.description}</p>
          )}
        </div>
        
        <div className={styles.groupHeaderRight}>
          {isManager ? (
            <>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className={styles.inviteButton}
              >
                + Пригласить
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className={styles.deleteGroupButton}
              >
                Удалить группу
              </button>
            </>
          ) : isMember && (
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className={styles.leaveButton}
            >
              Выйти из группы
            </button>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📋 Задачи ({tasks.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'members' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 Участники ({members.length})
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div className={styles.tasksTab}>
          <div className={styles.tasksHeader}>
            <div className={styles.taskFilters}>
              <button
                className={`${styles.filterChip} ${taskFilter === 'all' ? styles.filterChipActive : ''}`}
                onClick={() => setTaskFilter('all')}
              >
                Все ({tasks.length})
              </button>
              <button
                className={`${styles.filterChip} ${taskFilter === 'my' ? styles.filterChipActive : ''}`}
                onClick={() => setTaskFilter('my')}
              >
                Мои задачи ({tasks.filter(t => t.worker_id === currentUser?.id).length})
              </button>
              <button
                className={`${styles.filterChip} ${taskFilter === 'completed' ? styles.filterChipActive : ''}`}
                onClick={() => setTaskFilter('completed')}
              >
                Выполненные ({tasks.filter(t => t.status === TaskStatus.completed).length})
              </button>
            </div>
            <Link 
              to={`/groups/${groupId}/tasks/create`} 
              className={styles.createTaskLink}
            >
              + Новая задача
            </Link>
          </div>

          {filteredTasks.length === 0 ? (
            <div className={styles.emptyTasks}>
              <div className={styles.emptyIcon}>📭</div>
              <p>
                {taskFilter === 'my' 
                  ? 'У вас нет задач в этой группе' 
                  : taskFilter === 'completed'
                  ? 'В этой группе нет выполненных задач'
                  : 'В этой группе пока нет задач'}
              </p>
              <Link 
                to={`/groups/${groupId}/tasks/create`} 
                className={styles.emptyCreateLink}
              >
                Создать первую задачу
              </Link>
            </div>
          ) : (
            <div className={styles.tasksList}>
              {filteredTasks.map((task) => (
                <Link to={`/tasks/${task.id}`} key={task.id} className={styles.taskItem}>
                  <div className={styles.taskInfo}>
                    <span className={`${styles.taskStatusBadge} ${getStatusClass(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                    <span className={styles.taskTitle}>{task.title}</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <span className={styles.taskWorker}>
                      👤 {userNames.get(task.worker_id) || `User #${task.worker_id}`}
                    </span>
                    {task.deadline && (
                      <span className={styles.taskDeadline}>
                        📅 {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className={styles.membersTab}>
          <div className={styles.membersList}>
            {members.map((member) => (
              <div key={member.user_id} className={styles.memberItem}>
                <div className={styles.memberInfo}>
                  <div className={styles.memberAvatar}>
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.memberDetails}>
                    <span className={styles.memberName}>{member.full_name}</span>
                    <span className={styles.memberUsername}>@{member.username}</span>
                    <span className={styles.memberEmail}>{member.email}</span>
                  </div>
                  {member.role === 'manager' && (
                    <span className={styles.memberRoleBadge}>Менеджер</span>
                  )}
                </div>
                
                {isManager && member.id !== currentUser?.id && (
                  <div className={styles.memberActions}>
                    <button
                      onClick={() => {
                        setSelectedMemberToRemove(member);
                        setIsLeaveModalOpen(true);
                      }}
                      className={styles.removeMemberButton}
                    >
                      Удалить
                    </button>
                    <button
                      onClick={() => handleTransferManagement(member)}
                      className={styles.transferButton}
                      disabled={isSubmitting}
                    >
                      Назначить менеджером
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модальные окна (без изменений) */}
      {isInviteModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsInviteModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Пригласить в группу</h2>
              <button className={styles.modalClose} onClick={() => setIsInviteModalOpen(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Выбрать пользователя</label>
                <UserSearch
                  onSelect={(user: UserOut | null) => setInviteUserId(user?.id || null)}
                  placeholder="Поиск по имени или email..."
                />
              </div>
              
              <div className={styles.formDivider}>или</div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Пригласить по email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className={styles.formInput}
                  placeholder="user@example.com"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Сообщение (необязательно)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className={styles.formTextarea}
                  placeholder="Напишите приглашение..."
                  rows={3}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className={styles.cancelButton}
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                onClick={handleSendInvitation}
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить приглашение'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(isLeaveModalOpen || selectedMemberToRemove) && (
        <div className={styles.modalOverlay} onClick={() => {
          setIsLeaveModalOpen(false);
          setSelectedMemberToRemove(null);
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedMemberToRemove ? 'Удалить участника' : 'Выйти из группы'}
              </h2>
              <button className={styles.modalClose} onClick={() => {
                setIsLeaveModalOpen(false);
                setSelectedMemberToRemove(null);
              }}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p>
                {selectedMemberToRemove
                  ? `Вы уверены, что хотите удалить ${selectedMemberToRemove.full_name} из группы "${group.name}"?`
                  : `Вы уверены, что хотите выйти из группы "${group.name}"?`}
              </p>
              {!selectedMemberToRemove && isManager && (
                <p className={styles.warningText}>
                  ⚠️ Вы — менеджер группы. После выхода вам нужно будет передать управление другому участнику.
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  setIsLeaveModalOpen(false);
                  setSelectedMemberToRemove(null);
                }}
                className={styles.cancelButton}
              >
                Отмена
              </button>
              <button
                onClick={selectedMemberToRemove ? () => handleRemoveMember(selectedMemberToRemove) : handleLeaveGroup}
                className={styles.dangerButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? '...' : (selectedMemberToRemove ? 'Удалить' : 'Выйти')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Удалить группу</h2>
              <button className={styles.modalClose} onClick={() => setIsDeleteModalOpen(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Вы уверены, что хотите удалить группу <strong>"{group.name}"</strong>?
              </p>
              <p className={styles.warningText}>
                ⚠️ Это действие нельзя отменить. Все данные группы будут удалены безвозвратно.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className={styles.cancelButton}
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteGroup}
                className={styles.dangerButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Удаление...' : 'Удалить группу'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};