export interface Address {
  id: string;
  label?: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AdminRoleName = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF';

export interface Permission {
  id: string;
  key: string;
  module: string;
  description?: string | null;
}

export interface Role {
  id: string;
  name: AdminRoleName;
  description?: string | null;
  permissions: { permission: Permission }[];
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: string; name: AdminRoleName };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number; children: number };
}

export interface Ingredient {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  benefits?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface ProductImage {
  id?: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
  isVideo?: boolean;
}

export interface ProductVariant {
  id?: string;
  name: string;
  sku?: string | null;
  priceOverride?: number | null;
  stockQuantity: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  price: string | number;
  compareAtPrice?: string | number | null;
  weightGrams?: number | null;
  shelfLifeDays?: number | null;
  storageInstructions?: string | null;
  preparationProcess?: string | null;
  stockQuantity: number;
  sku?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  deletedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  categoryId: string;
  category?: { id: string; name: string };
  images: ProductImage[];
  variants: ProductVariant[];
  ingredients?: { ingredient: Ingredient }[];
  createdAt: string;
  _count?: { orderItems: number; reviews: number };
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED';

export interface OrderItemRecord {
  id: string;
  productId: string;
  productName: string;
  unitPrice: string | number;
  quantity: number;
  totalPrice: string | number;
  product?: { id: string; name: string; slug: string };
}

export interface OrderStatusHistoryRecord {
  id: string;
  status: OrderStatus;
  note?: string | null;
  changedBy?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  subtotal: string | number;
  taxAmount: string | number;
  shippingAmount: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  customer: { id: string; name?: string | null; email: string };
  address?: Address;
  items: OrderItemRecord[];
  statusHistory: OrderStatusHistoryRecord[];
  _count?: { items: number };
}

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  adminReply?: string | null;
  createdAt: string;
  images: { id: string; url: string }[];
  customer: { id: string; name?: string | null; email: string };
  product: { id: string; name: string; slug: string };
}

export interface Customer {
  id: string;
  name?: string | null;
  email: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  _count?: { orders: number; wishlist: number; addresses: number };
  addresses?: Address[];
  orders?: Order[];
  reviews?: Review[];
}

// =========================================================
// PHASE 2 — Content, Media, Support, Settings
// =========================================================

export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface MediaAsset {
  id: string;
  fileName: string;
  /** Resolved by the backend from storageKey. Null for private assets. */
  url: string | null;
  type: MediaType;
  folder?: string | null;
  sizeBytes?: number | null;
  uploadedBy?: string | null;
  createdAt: string;
  /** Driver-relative key. Null for assets added by external URL. */
  storageKey?: string | null;
  driver?: 'LOCAL' | 'S3' | null;
  mimeType?: string | null;
  /** True when we own the bytes (uploaded), false for an external link. */
  isUploaded?: boolean;
  /** True for assets with no public URL - they stream through /admin/documents/:id. */
  isPrivate?: boolean;
}

/** Response from POST /admin/uploads - the raw stored file, before it is recorded. */
export interface UploadResult {
  storageKey: string;
  url: string | null;
  mimeType: string;
  sizeBytes: number;
  category: 'image' | 'video' | 'document';
  mediaType: MediaType;
  fileName: string;
}

/** Folders the backend accepts. Mirrors UPLOAD_FOLDERS in the API. */
export const UPLOAD_FOLDERS = [
  'products',
  'categories',
  'ingredients',
  'recipes',
  'banners',
  'blogs',
  'reviews',
  'bills',
  'misc',
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export type BannerPlacement = 'HOME_HERO' | 'HOME_OFFER' | 'CATEGORY' | 'SLIDER';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  videoUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  placement: BannerPlacement;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

export interface RecipeStep {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface RecipeIngredientLink {
  ingredientId: string;
  quantity?: string | null;
  ingredient: Ingredient;
}

export interface RecipeProductLink {
  productId: string;
  product: { id: string; name: string; slug: string; price?: string | number };
}

export interface Recipe {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  steps: RecipeStep[];
  cookingTimeMins?: number | null;
  difficulty?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  ingredients?: RecipeIngredientLink[];
  products?: RecipeProductLink[];
  createdAt: string;
  _count?: { products: number };
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: string;
  senderName?: string | null;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId?: string | null;
  name: string;
  email: string;
  subject: string;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInfoSettings {
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SocialLinksSettings {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
}

export interface SeoDefaultsSettings {
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  ogImageUrl?: string;
}

export interface InvoiceSettings {
  invoicePrefix: string;
  gstNumber?: string;
  footerNote?: string;
}

export interface DashboardSummary {
  revenueLast30Days: number;
  ordersLast30Days: number;
  ordersByStatus: Record<string, number>;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: { id: string; name: string; stockQuantity: number; sku?: string | null }[];
  latestOrders: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: string | number;
    createdAt: string;
    customer: { name?: string | null; email: string };
  }[];
  topProducts: { productId: string; productName: string; _sum: { quantity: number; totalPrice: number } }[];
  recentReviews: Review[];
  pendingReviewCount: number;
  openTicketCount: number;
}

// =========================================================
// PROCUREMENT (back office) - SUPER_ADMIN / ADMIN only
// =========================================================

export interface Vendor {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  gstin?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * One fixed unit per material - purchases, stock and consumption all use it.
 * There is no conversion: a 5kg sack of a GRAM material is quantity 5000.
 */
export type MeasurementUnit = 'GRAM' | 'KILOGRAM' | 'MILLILITRE' | 'LITRE' | 'PIECE' | 'PACKET';

export const MEASUREMENT_UNITS: { value: MeasurementUnit; label: string; short: string }[] = [
  { value: 'GRAM', label: 'Grams (g)', short: 'g' },
  { value: 'KILOGRAM', label: 'Kilograms (kg)', short: 'kg' },
  { value: 'MILLILITRE', label: 'Millilitres (ml)', short: 'ml' },
  { value: 'LITRE', label: 'Litres (L)', short: 'L' },
  { value: 'PIECE', label: 'Pieces', short: 'pc' },
  { value: 'PACKET', label: 'Packets', short: 'pkt' },
];

export function unitShortLabel(unit: MeasurementUnit): string {
  return MEASUREMENT_UNITS.find((u) => u.value === unit)?.short ?? unit;
}

export interface RawMaterial {
  id: string;
  name: string;
  code?: string | null;
  baseUnit: MeasurementUnit;
  /** Decimal from the API - arrives as a string to preserve precision. */
  stockQuantity: string;
  reorderLevel?: string | null;
  avgCostPerUnit?: string | null;
  lastPurchasePrice?: string | null;
  ingredientId?: string | null;
  ingredient?: { id: string; name: string; slug: string } | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
