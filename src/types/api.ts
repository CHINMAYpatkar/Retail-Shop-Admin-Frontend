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

export type PurchaseBillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export type PaymentMode = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CARD' | 'OTHER';

export const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
];

export interface PurchaseBillItem {
  id: string;
  rawMaterialId: string;
  /** Decimal from the API - a string, to preserve precision. */
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  notes?: string | null;
  rawMaterial?: {
    id: string;
    name: string;
    code?: string | null;
    baseUnit: MeasurementUnit;
  };
}

export interface PurchaseBill {
  id: string;
  vendorId: string;
  vendor?: { id: string; name: string };
  billNumber: string;
  billDate: string;
  dueDate?: string | null;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  attachmentMediaId?: string | null;
  notes?: string | null;
  createdByAdminId?: string | null;
  items: PurchaseBillItem[];
  /** All three are derived server-side from linked payments, never stored. */
  paidAmount: string;
  outstandingAmount: string;
  status: PurchaseBillStatus;
  payments?: { id: string; amount: string; paidOn: string; method: PaymentMode }[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorPayment {
  id: string;
  vendorId: string;
  vendor?: { id: string; name: string };
  /** Null for an on-account payment (an advance not tied to any bill). */
  purchaseBillId?: string | null;
  purchaseBill?: { id: string; billNumber: string; billDate: string; totalAmount: string } | null;
  amount: string;
  paidOn: string;
  method: PaymentMode;
  referenceNo?: string | null;
  attachmentMediaId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorLedgerEntry {
  kind: 'BILL' | 'PAYMENT';
  date: string;
  reference: string;
  billId?: string | null;
  billNumber?: string | null;
  debit: string;
  credit: string;
  /** Running balance owed to the vendor after this entry. */
  balance: string;
}

export interface VendorLedger {
  vendor: Vendor;
  summary: {
    totalBilled: string;
    totalPaid: string;
    /** Positive = owed to the vendor. Negative = they hold an advance. */
    outstanding: string;
    onAccount: string;
    billCount: number;
    unpaidBillCount: number;
    oldestUnpaidBillDate?: string | null;
  };
  bills: {
    id: string;
    billNumber: string;
    billDate: string;
    dueDate?: string | null;
    totalAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    status: PurchaseBillStatus;
  }[];
  payments: VendorPayment[];
  entries: VendorLedgerEntry[];
}

export interface ProductCostSheetItem {
  id: string;
  rawMaterialId: string;
  quantity: string;
  /** Frozen when the sheet was created - does not follow later material price changes. */
  ratePerUnit: string;
  lineCost: string;
  notes?: string | null;
  rawMaterial?: {
    id: string;
    name: string;
    code?: string | null;
    baseUnit: MeasurementUnit;
    avgCostPerUnit?: string | null;
  };
}

export interface ProductCostSheet {
  id: string;
  productId: string;
  version: number;
  effectiveFrom: string;
  isActive: boolean;
  batchYieldQuantity: number;
  /** Computed server-side from the line items. */
  materialCost: string;
  labourCost: string;
  packagingCost: string;
  overheadCost: string;
  otherCost: string;
  totalBatchCost: string;
  costPerUnit: string;
  notes?: string | null;
  items: ProductCostSheetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MarginsReport {
  costed: {
    id: string;
    name: string;
    sku?: string | null;
    isActive: boolean;
    costSheetId: string;
    costSheetVersion: number;
    sellingPrice: string;
    costPerUnit: string;
    marginAmount: string;
    /** Percentage of the selling price (gross margin). Null when price is zero. */
    marginPercent: string | null;
  }[];
  uncosted: { id: string; name: string; sku?: string | null; price: string }[];
  summary: {
    productCount: number;
    costedCount: number;
    uncostedCount: number;
    lossMakingCount: number;
  };
}

export type ExpenseCategory =
  | 'RENT'
  | 'UTILITIES'
  | 'SALARY'
  | 'PACKAGING'
  | 'TRANSPORT'
  | 'MARKETING'
  | 'EQUIPMENT'
  | 'MAINTENANCE'
  | 'MISC';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'MISC', label: 'Miscellaneous' },
];

export interface Expense {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: string;
  spentOn: string;
  method: PaymentMode;
  vendorId?: string | null;
  vendor?: { id: string; name: string } | null;
  attachmentMediaId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesResponse extends PaginatedResponse<Expense> {
  /** Covers the whole filtered set, not just the current page. */
  summary: {
    totalAmount: string;
    byCategory: { category: ExpenseCategory; amount: string }[];
  };
}

export type RefundStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export const REFUND_STATUSES: { value: RefundStatus; label: string }[] = [
  { value: 'PENDING', label: 'Agreed, not yet sent' },
  { value: 'COMPLETED', label: 'Money sent' },
  { value: 'FAILED', label: 'Failed' },
];

export interface Refund {
  id: string;
  orderId: string;
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: string;
    status: OrderStatus;
    paymentStatus: string;
    customer?: { id: string; name?: string | null; email: string };
  };
  amount: string;
  reason: string;
  method: PaymentMode;
  status: RefundStatus;
  referenceNo?: string | null;
  refundedOn?: string | null;
  notes?: string | null;
  processedByAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RefundsResponse extends PaginatedResponse<Refund> {
  summary: {
    completedAmount: string;
    /** Agreed but not yet sent - a liability worth chasing. */
    pendingAmount: string;
  };
}
