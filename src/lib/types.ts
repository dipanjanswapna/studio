import type { PlaceHolderImages } from "./placeholder-images";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageId: (typeof PlaceHolderImages)[number]["id"];
  rating: number;
  reviews: number;
  description: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
