import React from 'react';
import { Link } from 'react-router-dom';
import { Group } from '../../types/group';
import styles from './groups.module.css';

interface GroupCardProps {
  group: Group;
  isManager?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, isManager }) => {
  return (
    <Link to={`/groups/${group.id}`} className={styles.groupCard}>
      <div className={styles.groupCardIcon}>
        {group.icon || '🚀'}
      </div>
      <div className={styles.groupCardContent}>
        <h3 className={styles.groupCardName}>{group.name}</h3>
        {group.description && (
          <p className={styles.groupCardDescription}>{group.description}</p>
        )}
        <div className={styles.groupCardStats}>
          <span className={styles.groupCardStat}>
            👥 {group.members_count || 0} участников
          </span>
          <span className={styles.groupCardStat}>
            📋 {group.tasks_count || 0} задач
          </span>
          {isManager && (
            <span className={styles.groupCardBadge}>Менеджер</span>
          )}
        </div>
      </div>
    </Link>
  );
};