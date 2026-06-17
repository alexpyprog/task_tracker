import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tasksApi } from '../../api/tasks';
import { UserOut } from '../../types/auth';
import { TaskStatus } from '../../types/task';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../contexts/GroupsContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { UserSearch } from '../common/UserSearch';
import toast from 'react-hot-toast';
import styles from './TaskCreate.module.css';

// Схема валидации
const taskSchema = z.object({
  title: z.string()
    .min(3, 'Название должно содержать не менее 3 символов')
    .max(100, 'Название не должно превышать 100 символов'),
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional()
    .nullable(),
  deadline: z.string()
    .optional()
    .nullable(),
  worker_id: z.number()
    .min(1, 'Выберите исполнителя'),
  status: z.nativeEnum(TaskStatus)
});

type TaskFormData = z.infer<typeof taskSchema>;

export const TaskCreate: React.FC = () => {
  const { id: groupIdFromUrl } = useParams<{ id: string }>();
  const location = useLocation();
  const { groups, fetchUserGroups, isLoading: groupsLoading } = useGroups();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<UserOut | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Загружаем группы при монтировании
  useEffect(() => {
    fetchUserGroups();
  }, []);

  // Автоматически определяем group_id из URL или state
  useEffect(() => {
    // Приоритет 1: ID группы из URL (если мы на странице группы)
    if (groupIdFromUrl && !isNaN(parseInt(groupIdFromUrl))) {
      const groupId = parseInt(groupIdFromUrl);
      const groupExists = groups.some(g => g.id === groupId);
      if (groupExists) {
        setSelectedGroupId(groupId);
        return;
      }
    }

    // Приоритет 2: ID группы из location state (если передали при переходе)
    const state = location.state as { groupId?: number };
    if (state?.groupId) {
      const groupExists = groups.some(g => g.id === state.groupId);
      if (groupExists) {
        setSelectedGroupId(state.groupId);
        return;
      }
    }

    // Приоритет 3: Нет группы (личная задача)
    setSelectedGroupId(null);
  }, [groupIdFromUrl, location.state, groups]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: TaskStatus.created,
      description: ''
    }
  });

  const onSubmit = async (data: TaskFormData) => {
    if (!selectedWorker) {
      setError('Выберите исполнителя');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let deadline = null;
      if (data.deadline) {
        deadline = data.deadline.includes('T') 
          ? new Date(data.deadline).toISOString()
          : new Date(data.deadline + 'T00:00:00').toISOString();
      }

      const taskData = {
        title: data.title,
        description: data.description || null,
        deadline: deadline,
        worker_id: selectedWorker.id,
        status: data.status,
        group_id: selectedGroupId || null  // Явно передаём null вместо undefined
      };

      console.log('Отправляемые данные:', taskData);  // ДЛЯ ОТЛАДКИ

      const newTask = await tasksApi.createTask(taskData);
      
      console.log('Ответ сервера:', newTask);  // ДЛЯ ОТЛАДКИ

      toast.success('Задача успешно создана!');
      
      if (selectedGroupId) {
        navigate(`/groups/${selectedGroupId}`);
      } else {
        navigate(`/tasks/${newTask.id}`);
      }
    } catch (err: any) {
      console.error('Ошибка:', err.response?.data);  // ДЛЯ ОТЛАДКИ
      setError(err.response?.data?.detail || 'Ошибка создания задачи');
      toast.error('Ошибка создания задачи');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkerSelect = (user: UserOut | null) => {
    setSelectedWorker(user);
    if (user) {
      setValue('worker_id', user.id);
      if (errors.worker_id) {
        setError('');
      }
    } else {
      setValue('worker_id', 0 as any);
    }
  };

  const selectedStatus = watch('status');

  // Показываем загрузку, если группы ещё не загружены и нужно определить group_id
  if (groupsLoading && groupIdFromUrl) {
    return <LoadingSpinner fullScreen />;
  }

  // Получаем название группы для отображения
  const currentGroup = groups.find(g => g.id === selectedGroupId);
  const isCreatingInGroup = !!selectedGroupId;

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>
            {isCreatingInGroup ? 'Создание задачи в группе' : 'Создание задачи'}
          </h1>
          <p className={styles.formSubtitle}>
            {isCreatingInGroup && currentGroup ? (
              <>Группа: <strong>{currentGroup.icon || '🚀'} {currentGroup.name}</strong></>
            ) : (
              'Заполните детали для создания задачи'
            )}
          </p>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError('')} />}

        {/* Информационный блок о группе (только для наглядности) */}
        {isCreatingInGroup && currentGroup && (
          <div className={styles.groupInfoBanner}>
            <span className={styles.groupInfoIcon}>👥</span>
            <span className={styles.groupInfoText}>
              Задача будет создана в группе <strong>{currentGroup.name}</strong>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Название <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="title"
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              placeholder="Введите название задачи"
              {...register('title')}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className={styles.errorText}>{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Описание
            </label>
            <textarea
              id="description"
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder="Введите описание задачи (необязательно)"
              rows={5}
              {...register('description')}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className={styles.errorText}>{errors.description.message}</p>
            )}
          </div>

          {/* Worker Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Назначить пользователю <span className={styles.required}>*</span>
            </label>
            <Controller
              name="worker_id"
              control={control}
              render={({ field }) => (
                <UserSearch
                  onSelect={handleWorkerSelect}
                  selectedUserId={field.value}
                  placeholder={isCreatingInGroup ? "Поиск по участникам группы..." : "Поиск пользователя..."}
                  groupId={selectedGroupId}  // Передаём ID группы или null
                  excludeCurrent={false}  // Можно включить, если нужно исключать текущего пользователя
                />
              )}
            />
            {errors.worker_id && (
              <p className={styles.errorText}>{errors.worker_id.message}</p>
            )}
          </div>

          {/* Deadline */}
          <div className={styles.formGroup}>
            <label htmlFor="deadline" className={styles.label}>
              Дедлайн
            </label>
            <div className={styles.datetimeInputs}>
              <input
                type="date"
                id="deadline-date"
                className={styles.input}
                onChange={(e) => {
                  const time = watch('deadline')?.split('T')[1] || '12:00';
                  setValue('deadline', e.target.value + 'T' + time);
                }}
                disabled={isSubmitting}
              />
              <input
                type="time"
                id="deadline-time"
                className={styles.input}
                defaultValue="12:00"
                onChange={(e) => {
                  const date = watch('deadline')?.split('T')[0] || 
                    new Date().toISOString().split('T')[0];
                  setValue('deadline', date + 'T' + e.target.value);
                }}
                disabled={isSubmitting}
              />
            </div>
            {errors.deadline && (
              <p className={styles.errorText}>{errors.deadline.message}</p>
            )}
          </div>

          {/* Status */}
          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.label}>
              Статус <span className={styles.required}>*</span>
            </label>
            <select
              id="status"
              className={`${styles.select} ${errors.status ? styles.inputError : ''}`}
              {...register('status')}
              disabled={isSubmitting}
            >
              {Object.values(TaskStatus).map(status => (
                <option key={status} value={status}>
                  {status === 'created' ? 'Создана' :
                   status === 'in_progress' ? 'В работе' :
                   status === 'completed' ? 'Выполнена' :
                   status === 'cancelled' ? 'Отменена' : status}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className={styles.errorText}>{errors.status.message}</p>
            )}
          </div>

          {/* Status Preview */}
          {selectedStatus && (
            <div className={styles.statusPreview}>
              <span className={styles.previewLabel}>Предпросмотр:</span>
              <span className={`${styles.statusBadge} ${styles[`status${selectedStatus.replace('_', '')}`]}`}>
                {selectedStatus === 'created' ? 'Создана' :
                 selectedStatus === 'in_progress' ? 'В работе' :
                 selectedStatus === 'completed' ? 'Выполнена' :
                 selectedStatus === 'cancelled' ? 'Отменена' : selectedStatus}
              </span>
            </div>
          )}

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => {
                if (selectedGroupId) {
                  navigate(`/groups/${selectedGroupId}`);
                } else {
                  navigate('/tasks');
                }
              }}
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
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Создание...
                </>
              ) : (
                'Создать задачу'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};