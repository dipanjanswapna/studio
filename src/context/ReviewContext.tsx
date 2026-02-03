'use client';
import { createContext, useState, useContext, ReactNode } from 'react';
import type { OrderItem, Order } from '@/data/types';

interface ReviewContextType {
  isModalOpen: boolean;
  productToReview: (OrderItem & { orderId: string }) | null;
  openReviewModal: (product: OrderItem, orderId: string) => void;
  closeReviewModal: () => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToReview, setProductToReview] = useState<(OrderItem & { orderId: string }) | null>(null);

  const openReviewModal = (product: OrderItem, orderId: string) => {
    setProductToReview({ ...product, orderId });
    setIsModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsModalOpen(false);
    // Delay setting product to null to allow for exit animation
    setTimeout(() => setProductToReview(null), 300);
  };

  return (
    <ReviewContext.Provider value={{ productToReview, isModalOpen, openReviewModal, closeReviewModal }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
}
