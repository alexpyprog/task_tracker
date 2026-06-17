// contexts/GroupsContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { groupsApi } from '../api/groups';
import { Group } from '../types/group';

interface GroupsContextType {
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  fetchUserGroups: () => Promise<void>;
  isLoading: boolean;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export const useGroups = (): GroupsContextType => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupsProvider');
  }
  return context;
};

interface GroupsProviderProps {
  children: ReactNode;
}

export const GroupsProvider = ({ children }: GroupsProviderProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserGroups = async () => {
    setIsLoading(true);
    try {
      const data = await groupsApi.getUserGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GroupsContext.Provider value={{ groups, setGroups, fetchUserGroups, isLoading }}>
      {children}
    </GroupsContext.Provider>
  );
};