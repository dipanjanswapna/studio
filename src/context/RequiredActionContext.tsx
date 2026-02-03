'use client';

import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './authContext';

interface RequiredActionContextType {
  isPhoneNumberModalOpen: boolean;
  openPhoneNumberModal: () => void;
  closePhoneNumberModal: () => void;
  checkPhoneNumber: (callback: () => void) => void;
}

const RequiredActionContext = createContext<RequiredActionContextType | undefined>(undefined);

export function RequiredActionProvider({ children }: { children: ReactNode }) {
  const [isPhoneNumberModalOpen, setIsPhoneNumberModalOpen] = useState(false);
  const { user } = useAuth();

  const openPhoneNumberModal = () => setIsPhoneNumberModalOpen(true);
  const closePhoneNumberModal = () => setIsPhoneNumberModalOpen(false);

  const checkPhoneNumber = useCallback((callback: () => void) => {
    if (user && !user.phone) {
      openPhoneNumberModal();
    } else {
      callback();
    }
  }, [user]);

  const value = {
    isPhoneNumberModalOpen,
    openPhoneNumberModal,
    closePhoneNumberModal,
    checkPhoneNumber,
  };

  return (
    <RequiredActionContext.Provider value={value}>
      {children}
    </RequiredActionContext.Provider>
  );
}

export function useRequiredAction() {
  const context = useContext(RequiredActionContext);
  if (!context) {
    throw new Error('useRequiredAction must be used within a RequiredActionProvider');
  }
  return context;
}
