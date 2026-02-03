'use client';
import { createContext, useState, useContext, ReactNode } from 'react';

// Simplified product info needed for the modal
export interface ProductToReview {
  productId: string;
  productName: string;
  productImageId: string;
}

interface ReviewContextType {
  productToReview: ProductToReview | null;
  isReviewModalOpen: boolean;
  openReviewModal: (product: ProductToReview) => void;
  closeReviewModal: () => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [productToReview, setProductToReview] = useState<ProductToReview | null>(null);

  const openReviewModal = (product: ProductToReview) => {
    setProductToReview(product);
    setIsReviewModalOpen(true);
  };

  const closeModal = () => {
    setIsReviewModalOpen(false);
    // Delay setting product to null to allow for exit animation
    setTimeout(() => setProductToReview(null), 300);
  };

  return (
    <ReviewContext.Provider value={{ productToReview, isReviewModalOpen, openReviewModal, closeReviewModal: closeModal }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviewModal() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviewModal must be used within a ReviewProvider');
  }
  return context;
}
