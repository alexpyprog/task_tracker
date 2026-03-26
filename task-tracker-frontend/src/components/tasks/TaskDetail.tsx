import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tasksApi } from '../../api/tasks';
import { usersApi } from '../../api/users';
import { TaskOut, TaskStatus } from '../../types/task';
import { UserOut } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import toast from 'react-hot-toast';
import styles from './TaskDetail.module.css';

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [task, setTask] = useState<TaskOut | null>(null);
  const [creator, setCreator] = useState<UserOut | null>(null);
  const [worker, setWorker] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    deadline: '',
    status: TaskStatus.created,
    worker_id: 0
  });

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError('');

    try {
      const taskData = await tasksApi.getTask(id);
      setTask(taskData);
      
      // Загружаем информацию о создателе и исполнителе
      const [creatorData, workerData] = await Promise.all([
        usersApi.getUser(taskData.created_by),
        usersApi.getUser(taskData.worker_id)
      ]);
      
      setCreator(creatorData);
      setWorker(workerData);
      
      setEditForm({
        title: taskData.title,
        description: taskData.description || '',
        deadline: taskData.deadline ? new Date(taskData.deadline).toISOString().slice(0, 16) : '',
        status: taskData.status,
        worker_id: taskData.worker_id
      });
    } catch (err: any) {
      setError('Ошибка при загрузке задачи');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!task) return;

    setIsDeleting(true);
    setError('');

    try {
      const updatedTask = await tasksApi.updateTask(task.id, {
        title: editForm.title,
        description: editForm.description || null,
        deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : null,
        status: editForm.status,
        worker_id: editForm.worker_id
      });
      
      setTask(updatedTask);
      setIsEditing(false);
      toast.success('Задача успешно обновлена');
      
      // Перезагружаем информацию о пользователях
      if (updatedTask.created_by !== creator?.id) {
        const newCreator = await usersApi.getUser(updatedTask.created_by);
        setCreator(newCreator);
      }
      if (updatedTask.worker_id !== worker?.id) {
        const newWorker = await usersApi.getUser(updatedTask.worker_id);
        setWorker(newWorker);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка обновления задачи');
      toast.error('Ошибка обновления задачи');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await tasksApi.deleteTask(task.id);
      toast.success('Задача успешно удалена');
      navigate('/tasks');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка удаления задачи');
      toast.error('Ошибка удаления задачи');
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;

    try {
      const updatedTask = await tasksApi.updateTask(task.id, {
        status: newStatus
      });
      setTask(updatedTask);
      toast.success(`Статус задачи изменён на  ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error('Ошибка изменения статуса');
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.completed:
        return styles.statusCompleted;
      case TaskStatus.in_progress:
        return styles.statusInProgress;
      case TaskStatus.created:
        return styles.statusCreated;
      case TaskStatus.cancelled:
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.completed:
        return 'Завершена';
      case TaskStatus.in_progress:
        return 'В работе';
      case TaskStatus.created:
        return 'Создана';
      case TaskStatus.cancelled:
        return 'Отменена';
      default:
        return status;
    }
  };

  const canEdit = currentUser?.id === task?.created_by;
  const canChangeStatus = currentUser?.id === task?.created_by || currentUser?.id === task?.worker_id;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!task) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>🔍</div>
          <h2 className={styles.errorTitle}>Задача не найдена</h2>
          <p className={styles.errorText}>Задача не существует или у вас нет доступа к ней.</p>
          <Link to="/tasks" className={styles.backButton}>
            Назад к задачам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.taskCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link to="/tasks" className={styles.backLink}>
              ← Назад к задачам
            </Link>
            <h1 className={styles.title}>
              {isEditing ? 'Редактировать задачу' : task.title}
            </h1>
          </div>
          
          {!isEditing && (
            <div className={styles.headerActions}>
              {canEdit && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className={styles.editButton}
                    disabled={isDeleting}
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    onClick={handleDelete}
                    className={styles.deleteButton}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '...' : '🗑️ Удалить'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError('')} />}

        {/* Content */}
        {isEditing ? (
          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Название</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className={styles.input}
                disabled={isDeleting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Описание</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={5}
                className={styles.textarea}
                disabled={isDeleting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Статус</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
                className={styles.select}
                disabled={isDeleting}
              >
                {Object.values(TaskStatus).map((status) => (
                  <option key={status} value={status}>
                    {getStatusText(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Дедлайн</label>
              <input
                type="datetime-local"
                value={editForm.deadline}
                onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                className={styles.input}
                disabled={isDeleting}
              />
            </div>

            <div className={styles.formActions}>
              <button
                onClick={() => setIsEditing(false)}
                className={styles.cancelButton}
                disabled={isDeleting}
              >
                Отмена
              </button>
              <button
                onClick={handleUpdate}
                className={styles.saveButton}
                disabled={isDeleting}
              >
                {isDeleting ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Status Bar */}
            <div className={styles.statusBar}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Текущий статус:</span>
                <span className={`${styles.statusBadge} ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
              </div>
              
              {canChangeStatus && (
                <div className={styles.statusActions}>
                  <span className={styles.changeStatusLabel}>Изменить статус:</span>
                  <div className={styles.statusButtons}>
                    {Object.values(TaskStatus).map((status) => (
                      status !== task.status && (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`${styles.statusButton} ${styles[`statusButton${status.replace('_', '')}`]}`}
                          disabled={isDeleting}
                        >
                          {getStatusText(status)}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Описание</h3>
              <p className={styles.description}>
                {task.description || 'Описание отсутствует.'}
              </p>
            </div>

            {/* Details Grid */}
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Создатель</span>
                <span className={styles.detailValue}>
                  {creator ? (
                    <Link to={`/users/${creator.id}`} className={styles.userLink}>
                      {creator.full_name} (@{creator.username})
                    </Link>
                  ) : (
                    `Пользователь #${task.created_by}`
                  )}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Исполнитель</span>
                <span className={styles.detailValue}>
                  {worker ? (
                    <Link to={`/users/${worker.id}`} className={styles.userLink}>
                      {worker.full_name} (@{worker.username})
                    </Link>
                  ) : (
                    `Пользователь #${task.worker_id}`
                  )}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Создана</span>
                <span className={styles.detailValue}>
                  {new Date(task.created_at).toLocaleString()}
                </span>
              </div>

              {task.deadline && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Дедлайн</span>
                  <span className={`${styles.detailValue} ${
                    new Date(task.deadline) < new Date() ? styles.deadlinePassed : ''
                  }`}>
                    {new Date(task.deadline).toLocaleString()}
                  </span>
                </div>
              )}

              {task.updated_at && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Последнее обновление</span>
                  <span className={styles.detailValue}>
                    {new Date(task.updated_at).toLocaleString()}
                    {task.updated_by && ` Пользователем #${task.updated_by}`}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};