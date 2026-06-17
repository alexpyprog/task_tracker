// src/components/dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksApi } from '../../api/tasks';
import { usersApi } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../contexts/GroupsContext';
import { TaskListOut, TaskStatus } from '../../types/task';
import { Container, Row, Col, Card, ProgressBar, Badge, Spinner } from 'react-bootstrap';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
}

interface GroupStats {
  id: number;
  name: string;
  icon: string;
  tasksCount: number;
  overdueCount: number;
  myTasksCount: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { groups, fetchUserGroups, isLoading: groupsLoading } = useGroups();
  
  const [myTasks, setMyTasks] = useState<TaskListOut[]>([]);
  const [recentTasks, setRecentTasks] = useState<TaskListOut[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  });
  const [groupStats, setGroupStats] = useState<GroupStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [myTasksData, createdByMeData] = await Promise.all([
        tasksApi.getMyTasks(0, 100),
        tasksApi.getCreatedByMe(0, 100),
      ]);

      const allTasksMap = new Map<string, TaskListOut>();
      [...myTasksData, ...createdByMeData].forEach(task => {
        if (!allTasksMap.has(task.id)) {
          allTasksMap.set(task.id, task);
        }
      });
      const allTasks = Array.from(allTasksMap.values());
      setMyTasks(allTasks);

      const userIds = new Set<number>();
      allTasks.forEach(task => {
        userIds.add(task.created_by);
        userIds.add(task.worker_id);
      });
      
      const nameMap = new Map<number, string>();
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const userData = await usersApi.getUser(userId);
            nameMap.set(userId, userData.full_name);
          } catch (error) {
            nameMap.set(userId, `User #${userId}`);
          }
        })
      );
      setUserNames(nameMap);

      const now = new Date();
      const completed = allTasks.filter(t => t.status === TaskStatus.completed).length;
      const inProgress = allTasks.filter(t => t.status === TaskStatus.in_progress).length;
      const overdue = allTasks.filter(t => 
        t.deadline && 
        new Date(t.deadline) < now && 
        t.status !== TaskStatus.completed &&
        t.status !== TaskStatus.cancelled
      ).length;
      
      const completionRate = allTasks.length > 0 
        ? Math.round((completed / allTasks.length) * 100) 
        : 0;

      setStats({
        totalTasks: allTasks.length,
        completedTasks: completed,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        completionRate,
      });

      const sorted = [...allTasks].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentTasks(sorted.slice(0, 5));

      await fetchUserGroups();
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groups.length > 0 && myTasks.length > 0) {
      const statsMap = new Map<number, { tasksCount: number; overdueCount: number; myTasksCount: number }>();
      
      groups.forEach(group => {
        statsMap.set(group.id, { tasksCount: 0, overdueCount: 0, myTasksCount: 0 });
      });
      
      const now = new Date();
      
      myTasks.forEach(task => {
        const groupId = (task as any).group_id;
        if (groupId && statsMap.has(groupId)) {
          const stats = statsMap.get(groupId)!;
          stats.tasksCount++;
          
          if (task.deadline && new Date(task.deadline) < now && 
              task.status !== TaskStatus.completed && 
              task.status !== TaskStatus.cancelled) {
            stats.overdueCount++;
          }
          
          if (task.worker_id === user?.id) {
            stats.myTasksCount++;
          }
          
          statsMap.set(groupId, stats);
        }
      });
      
      const realGroupStats: GroupStats[] = groups.map(group => ({
        id: group.id,
        name: group.name,
        icon: group.icon || 'bi bi-people',
        tasksCount: statsMap.get(group.id)?.tasksCount || 0,
        overdueCount: statsMap.get(group.id)?.overdueCount || 0,
        myTasksCount: statsMap.get(group.id)?.myTasksCount || 0,
      }));
      
      setGroupStats(realGroupStats);
    }
  }, [groups, myTasks, user?.id]);

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.completed: return 'Выполнена';
      case TaskStatus.in_progress: return 'В работе';
      case TaskStatus.created: return 'Создана';
      case TaskStatus.cancelled: return 'Отменена';
      default: return status;
    }
  };

  const getStatusVariant = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.completed: return 'success';
      case TaskStatus.in_progress: return 'secondary';
      case TaskStatus.created: return 'warning';
      case TaskStatus.cancelled: return 'danger';
      default: return 'secondary';
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

  if (isLoading || groupsLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="secondary" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Приветствие */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold" color="secondary-text">
          Привет, {user?.full_name?.split(' ')[0] || user?.username}! 
        </h1>
        <p className="text-secondary" color="secondary-text">
          Вот что происходит в ваших задачах сегодня
        </p>
      </div>

      {/* Статистика */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center gap-3">
              <i className="bi bi-clipboard-list fs-1 text-secondary"></i>
              <div>
                <h2 className="display-6 fw-bold mb-0">{stats.totalTasks}</h2>
                <span className="text-secondary small">Всего задач</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center gap-3">
              <i className="bi bi-check2-circle fs-1 text-success"></i>
              <div>
                <h2 className="display-6 fw-bold mb-0">{stats.completedTasks}</h2>
                <span className="text-secondary small">Выполнено</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center gap-3">
              <i className="bi bi-arrow-repeat fs-1 text-secondary"></i>
              <div>
                <h2 className="display-6 fw-bold mb-0">{stats.inProgressTasks}</h2>
                <span className="text-secondary small">В работе</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center gap-3">
              <i className="bi bi-exclamation-triangle fs-1 text-danger"></i>
              <div>
                <h2 className="display-6 fw-bold mb-0 text-danger">{stats.overdueTasks}</h2>
                <span className="text-secondary small">Просрочено</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Прогресс-бар */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold text-secondary">Общий прогресс</span>
            <span className="fw-bold text-secondary">{stats.completionRate}%</span>
          </div>
          <ProgressBar 
            now={stats.completionRate} 
            variant="secondary" 
            className="rounded-pill"
            style={{ height: '8px' }}
          />
        </Card.Body>
      </Card>

      {/* Группы */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold mb-0 text-secondary">Мои группы</h3>
          <Link to="/groups" className="text-secondary text-decoration-none">
            Все группы →
          </Link>
        </div>
        
        <Row className="g-3">
          {groupStats.map((group) => (
            <Col xs={12} md={6} lg={4} key={group.id}>
              <Link to={`/groups/${group.id}`} className="text-decoration-none">
                <Card className="h-100 shadow-sm border-0 card-hover">
                  <Card.Body className="d-flex align-items-start gap-3">
                    <i className="bi bi-people fs-1 text-secondary"></i>
                    <div className="flex-grow-1">
                      <h5 className="fw-bold mb-1 text-secondary">{group.name}</h5>
                      <div className="d-flex gap-3 small text-secondary mb-2">
                        <span><i className="bi bi-card-list me-1"></i> {group.tasksCount} задач</span>
                        {group.overdueCount > 0 && (
                          <span className="text-danger"><i className="bi bi-exclamation-triangle me-1"></i> {group.overdueCount} просрочено</span>
                        )}
                      </div>
                      <small className="text-secondary">
                        <i className="bi bi-person-check me-1"></i> Ваших задач: {group.myTasksCount}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
          
          <Col xs={12} md={6} lg={4}>
            <Link to="/groups" className="text-decoration-none">
              <Card className="h-100 shadow-sm border-dashed text-center card-hover">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                  <i className="bi bi-plus-circle fs-1 text-secondary mb-2"></i>
                  <span className="text-secondary">Создать группу</span>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        </Row>
      </div>

      {/* Последние задачи */}
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold mb-0 text-secondary">Последние задачи</h3>
          <Link to="/tasks" className="text-secondary text-decoration-none">
            Все задачи →
          </Link>
        </div>
        
        <Card className="shadow-sm border-0">
          {recentTasks.length === 0 ? (
            <Card.Body className="text-center py-5">
              <i className="bi bi-inbox display-1 text-secondary mb-3"></i>
              <p className="text-secondary mb-3">У вас пока нет задач</p>
              <Link to="/tasks/create" className="btn btn-secondary">
                <i className="bi bi-plus-lg me-2"></i> Создать первую задачу
              </Link>
            </Card.Body>
          ) : (
            <div className="list-group list-group-flush">
              {recentTasks.map((task) => (
                <Link 
                  to={`/tasks/${task.id}`} 
                  key={task.id} 
                  className="list-group-item list-group-item-action p-3"
                >
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div className="d-flex align-items-center gap-3">
                      <Badge bg={getStatusVariant(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                      <span className="fw-semibold text-secondary">{task.title}</span>
                    </div>
                    <div className="d-flex gap-3 small text-secondary">
                      <span>
                        <i className="bi bi-person me-1"></i> {userNames.get(task.created_by) || `User #${task.created_by}`}
                      </span>
                      {task.deadline && (
                        <span className={isDeadlinePassed(task.deadline) ? 'text-danger' : 
                                       isDeadlineNear(task.deadline) ? 'text-warning' : 'text-secondary'}>
                          <i className="bi bi-calendar me-1"></i> {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                      <span>
                        <i className="bi bi-calendar-plus me-1"></i> {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
};