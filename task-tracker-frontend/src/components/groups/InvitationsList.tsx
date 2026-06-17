import React, { useState, useEffect } from 'react';
import { invitationsApi } from '../../api/invitations';
import { Invitation, InvitationStatus } from '../../types/invitation';
import { LoadingSpinner } from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import styles from './groups.module.css';

interface InvitationsListProps {
  onInvitationAction?: () => void;
}

export const InvitationsList: React.FC<InvitationsListProps> = ({ onInvitationAction }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const data = await invitationsApi.getIncomingInvitations();
      setInvitations(data.filter(inv => inv.status === InvitationStatus.PENDING));
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await invitationsApi.acceptInvitation(invitationId);
      toast.success('Приглашение принято!');
      await loadInvitations();
      onInvitationAction?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при принятии приглашения');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await invitationsApi.declineInvitation(invitationId);
      toast.success('Приглашение отклонено');
      await loadInvitations();
      onInvitationAction?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при отклонении приглашения');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="sm" />;
  }

  if (invitations.length === 0) {
    return (
      <div className={styles.emptyInvitations}>
        <span className={styles.emptyIcon}>📭</span>
        <p>Нет новых приглашений</p>
      </div>
    );
  }

  return (
    <div className={styles.invitationsList}>
      {invitations.map((inv) => (
        <div key={inv.id} className={styles.invitationItem}>
          <div className={styles.invitationInfo}>
            <div className={styles.invitationGroup}>
              <span className={styles.invitationIcon}>🏢</span>
              <span className={styles.invitationGroupName}>{inv.group_name || `Группа #${inv.group_id}`}</span>
            </div>
            <div className={styles.invitationFrom}>
              от {inv.from_user_name || `Пользователь #${inv.from_user}`}
            </div>
            <div className={styles.invitationDate}>
              {new Date(inv.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className={styles.invitationActions}>
            <button
              onClick={() => handleAccept(inv.id)}
              disabled={processingId === inv.id}
              className={styles.acceptButton}
            >
              Принять
            </button>
            <button
              onClick={() => handleDecline(inv.id)}
              disabled={processingId === inv.id}
              className={styles.declineButton}
            >
              Отклонить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};