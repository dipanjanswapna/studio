'use client';
import { createContext, useState, useContext, ReactNode } from 'react';
import type { Product } from '@/data/types';

interface ProductActionContextType {
  product: Product | null;
  isModalOpen: boolean;
  openModal: (product: Product) => void;
  closeModal: () => void;
}

const ProductActionContext = createContext<ProductActionContextType | undefined>(undefined);

export function ProductActionProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const openModal = (product: Product) => {
    setProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Delay setting product to null to allow for exit animation
    setTimeout(() => setProduct(null), 300);
  };

  return (
    <ProductActionContext.Provider value={{ product, isModalOpen, openModal, closeModal }}>
      {children}
    </ProductActionContext.Provider>
  );
}

export function useProductAction() {
  const context = useContext(ProductActionContext);
  if (!context) {
    throw new Error('useProductAction must be used within a ProductActionProvider');
  }
  return context;
}
