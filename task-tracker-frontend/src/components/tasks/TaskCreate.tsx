import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tasksApi } from '../../api/tasks';
import { UserOut } from '../../types/auth';
import { TaskStatus } from '../../types/task';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { UserSearch } from '../common/UserSearch';
import toast from 'react-hot-toast';
import styles from './TaskCreate.module.css';

// Схема валидации
const taskSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  deadline: z.string()
    .optional()
    .nullable(),
  worker_id: z.number()
    .min(1, 'Please select a worker'),
  status: z.nativeEnum(TaskStatus)
});

type TaskFormData = z.infer<typeof taskSchema>;

export const TaskCreate: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<UserOut | null>(null);
  
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

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
      setError('Please select a worker');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Форматируем дату правильно
      let deadline = null;
      if (data.deadline) {
        // Добавляем временную зону, если её нет
        deadline = data.deadline.includes('T') 
          ? new Date(data.deadline).toISOString()
          : new Date(data.deadline + 'T00:00:00').toISOString();
      }

      const newTask = await tasksApi.createTask({
        title: data.title,
        description: data.description || null,
        deadline: deadline,
        worker_id: selectedWorker.id,
        status: data.status
      });

      toast.success('Task created successfully!');
      navigate(`/tasks/${newTask.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create task');
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkerSelect = (user: UserOut | null) => {
    setSelectedWorker(user);
    if (user) {
        setValue('worker_id', user.id);
        // Очищаем ошибку, если она была
        if (errors.worker_id) {
        setError('');
        }
    } else {
        // Если пользователь сброшен, устанавливаем пустое значение
        setValue('worker_id', 0 as any); // Используем 0 как "не выбрано"
    }
    };

  const selectedStatus = watch('status');

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Create New Task</h1>
          <p className={styles.formSubtitle}>Fill in the details to create a new task</p>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="title"
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              placeholder="Enter task title"
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
              Description
            </label>
            <textarea
              id="description"
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder="Enter task description (optional)"
              rows={5}
              {...register('description')}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className={styles.errorText}>{errors.description.message}</p>
            )}
          </div>

          {/* Worker Selection - теперь с поиском */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Assign to <span className={styles.required}>*</span>
            </label>
            <Controller
              name="worker_id"
              control={control}
              render={({ field }) => (
                <UserSearch
                  onSelect={handleWorkerSelect}
                  selectedUserId={field.value}
                  placeholder="Search for a user..."
                />
              )}
            />
            {errors.worker_id && (
              <p className={styles.errorText}>{errors.worker_id.message}</p>
            )}
          </div>

          {/* Deadline - с отдельным выбором даты и времени */}
          <div className={styles.formGroup}>
            <label htmlFor="deadline" className={styles.label}>
              Deadline
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
              Status <span className={styles.required}>*</span>
            </label>
            <select
              id="status"
              className={`${styles.select} ${errors.status ? styles.inputError : ''}`}
              {...register('status')}
              disabled={isSubmitting}
            >
              {Object.values(TaskStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
              <span className={styles.previewLabel}>Preview:</span>
              <span className={`${styles.statusBadge} ${styles[`status${selectedStatus.replace('_', '')}`]}`}>
                {selectedStatus.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};