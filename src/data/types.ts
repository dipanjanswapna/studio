export type ProductVariant = {
  id: string; // SKU
  name: string; // e.g., "Small, Red"
  price: number;
  stock: number;
  attributes: { [key: string]: string }; // e.g., { "size": "S", "color": "Red" }
  imageIds?: string[];
};

export type FlashSaleDetails = {
  price: number;
  endTime: string; // ISO string
  initialStock: number;
  sold: number; // For simulation
};

export type DealInfo = {
    name: string;
    slug: string;
    discountPercentage: number;
    endTime: string;
};

export type Product = {
  id: string;
  name:string;
  brand?: string;
  category: string;
  imageIds: string[];
  vendorId?: string;
  rating: number;
  reviews: number;
  description: string;
  variants: ProductVariant[];
  variantAttributes?: string[];
  flashSale?: FlashSaleDetails;
  deal?: DealInfo;
  discountPercentage?: number;
  isFeatured?: boolean;
  preOrder?: boolean;
  createdAt?: string;
}

export type MegaMenuSubCategory = {
  name: string;
  href: string;
};

export type MegaMenuGroup = {
  name: string;
  subcategories: MegaMenuSubCategory[];
};

export type Category = {
  id: string;
  name: string;
  href: string;
  order: number;
  iconName?: string;
  groups?: MegaMenuGroup[];
};

export type Brand = {
  id: string;
  name: string;
  logoImageId: string;
  isFeatured?: boolean;
  order?: number;
};

export type CartItem = {
  id?: string; // Firestore document ID for logged-in users
  product: Product;
  variant: ProductVariant;
  quantity: number;
};

export type FirestoreCartItem = {
  id: string; // Firestore document ID
  productId: string;
  variantId: string;
  quantity: number;
  addedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export type Deal = {
    id: string;
    name: string;
    slug: string;
    description: string;
    endTime: string;
    productIds: string[];
    bannerImageUrl?: string;
    discountPercentage?: number;
};

export type OrderItem = {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  imageUrl: string;
  productImageId?: string;
};

export type Order = {
  id: string;
  shortId?: string;
  userId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export type ReturnItem = {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  imageUrl: string;
};

export type ReturnRequest = {
  id: string;
  userId: string;
  orderId: string;
  items: ReturnItem[];
  reason: string;
  status: 'Pending Approval' | 'Approved' | 'Shipped by you' | 'Received' | 'Completed' | 'Rejected';
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export type Review = {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  orderId: string;
  productName: string;
  productImageId: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export type LoyaltyPointEntry = {
    id: string;
    date: {
      seconds: number;
      nanoseconds: number;
    };
    description: string;
    points: number;
    type: 'earn' | 'redeem';
};

export type Reward = {
    id: string;
    points: number;
    reward: string;
    iconName: string;
};

export type Voucher = {
  id: string;
  userId: string;
  rewardId: string;
  rewardDescription: string;
  code: string;
  createdAt: { seconds: number; nanoseconds: number; };
  expiresAt?: { seconds: number; nanoseconds: number; };
  isUsed: boolean;
};

export type PaymentMethod = {
    id: string;
    type: 'Visa' | 'Mastercard' | 'Card';
    last4: string;
    expiry: string;
    cardHolderName: string;
    isDefault: boolean;
};
