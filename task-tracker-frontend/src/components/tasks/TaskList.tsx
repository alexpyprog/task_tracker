import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tasksApi } from '../../api/tasks';
import { usersApi } from '../../api/users';
import { TaskListOut, TaskStatus } from '../../types/task';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import styles from './TaskList.module.css';

interface TaskWithUsers extends TaskListOut {
  creatorName?: string;
  workerName?: string;
}

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<TaskWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [view, setView] = useState<'my-tasks' | 'created-by-me'>('my-tasks');
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    loadTasks();
  }, [view]);

  const loadTasks = async () => {
    setIsLoading(true);
    setError('');

    try {
      let fetchedTasks: TaskListOut[];
      if (view === 'my-tasks') {
        fetchedTasks = await tasksApi.getMyTasks(0, 50);
      } else {
        fetchedTasks = await tasksApi.getCreatedByMe(0, 50);
      }

      // Загружаем имена пользователей для каждой задачи
      const tasksWithUsers = await Promise.all(
        fetchedTasks.map(async (task) => {
          try {
            const [creator, worker] = await Promise.all([
              usersApi.getUser(task.created_by),
              usersApi.getUser(task.worker_id)
            ]);
            return {
              ...task,
              creatorName: creator.full_name,
              workerName: worker.full_name
            };
          } catch (error) {
            return task;
          }
        })
      );

      setTasks(tasksWithUsers);
    } catch (err: any) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => 
    filter === 'all' ? true : task.status === filter
  );

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
        return 'Completed';
      case TaskStatus.in_progress:
        return 'In Progress';
      case TaskStatus.created:
        return 'Created';
      case TaskStatus.cancelled:
        return 'Cancelled';
      default:
        return status;
    }
  };

  const isDeadlineNear = (deadline: string | null) => {
    if (!deadline) return false;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 24;
  };

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Tasks</h1>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.full_name}</span>
            {/* <button onClick={handleLogout} className={styles.logoutButton}>
              <span className={styles.logoutIcon}>🚪</span>
              Logout
            </button> */}
          </div>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${view === 'my-tasks' ? styles.viewButtonActive : ''}`}
              onClick={() => setView('my-tasks')}
            >
              My Tasks
            </button>
            <button
              className={`${styles.viewButton} ${view === 'created-by-me' ? styles.viewButtonActive : ''}`}
              onClick={() => setView('created-by-me')}
            >
              Created by Me
            </button>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TaskStatus | 'all')}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            {Object.values(TaskStatus).map((status) => (
              <option key={status} value={status}>
                {getStatusText(status)}
              </option>
            ))}
          </select>
          
          <Link to="/tasks/create" className={styles.createButton}>
            + New Task
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {filteredTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📋</div>
          <h3 className={styles.emptyStateTitle}>No tasks found</h3>
          <p className={styles.emptyStateText}>
            {view === 'my-tasks' 
              ? "You don't have any tasks assigned to you yet."
              : "You haven't created any tasks yet."}
          </p>
          <Link to="/tasks/create" className={styles.emptyStateButton}>
            Create your first task
          </Link>
        </div>
      ) : (
        <div className={styles.taskGrid}>
          {filteredTasks.map((task) => (
            <Link to={`/tasks/${task.id}`} key={task.id} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <span className={`${styles.statusBadge} ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
                {task.deadline && (
                  <span className={`${styles.deadline} ${
                    isDeadlinePassed(task.deadline) ? styles.deadlinePassed :
                    isDeadlineNear(task.deadline) ? styles.deadlineNear : ''
                  }`}>
                    📅 {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <h3 className={styles.taskTitle}>{task.title}</h3>
              
              <div className={styles.taskFooter}>
                <div className={styles.taskUsers}>
                  {view === 'created-by-me' ? (
                    <div className={styles.userInfo}>
                      <span className={styles.userLabel}>Assigned to:</span>
                      <span className={styles.userName}>{task.workerName || `User #${task.worker_id}`}</span>
                    </div>
                  ) : (
                    <div className={styles.userInfo}>
                      <span className={styles.userLabel}>Created by:</span>
                      <span className={styles.userName}>{task.creatorName || `User #${task.created_by}`}</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.taskDate}>
                  {new Date(task.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};