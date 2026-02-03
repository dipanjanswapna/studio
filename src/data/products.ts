import type { Product, DealInfo } from "@/data/types";
import { deals } from '@/data/deals';

export const flashSaleEndTime = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(); // 3 hours from now

// This file previously contained hardcoded product data.
// The application has been updated to fetch product data dynamically from the Firestore database.
//
// To populate your database, you can use the previous content of this file as a
// reference for the data structure. You would typically add products to your
// 'products' collection in Firestore.
//
// Example Product Structure:
// {
//   id: "p1",
//   name: "Graphic T-Shirt",
//   brand: "Averzo",
//   category: "Fashion",
//   imageIds: ["product-1"],
//   rating: 4.5,
//   reviews: 112,
//   description: "A stylish and comfortable men's graphic t-shirt...",
//   variantAttributes: ["size", "color", "fabric"],
//   discountPercentage: 15,
//   isFeatured: true,
//   variants: [ { id: "AV-FASH-TSH-RED-S-COT", name: "Small, Red, Cotton", price: 24.99, stock: 20, attributes: { size: "S", color: "Red", fabric: "Cotton" } } ],
//   createdAt: "ISO_DATE_STRING"
// }

const rawProducts: Product[] = [];

// The enrichment logic is now handled client-side where data is consumed.
export const products: Product[] = rawProducts;
