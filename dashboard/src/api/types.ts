export type OrderStatus =
  | 'choose_language'
  | 'collect_vehicle'
  | 'collect_part'
  | 'oem_lookup'
  | 'show_offers'
  | 'done';

export type OrderLanguage = 'de' | 'en' | null;

export type Vehicle = {
  vin?: string | null;
  hsn?: string | null;
  tsn?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  engine?: string | null;
} | null;

export type OrderPart = {
  partCategory?: string | null;
  position?: string | null;
  partDetails?: Record<string, unknown> | null;
  partText?: string | null;
  oemStatus?: 'pending' | 'success' | 'not_found' | 'multiple_matches' | null;
  oemNumber?: string | null;
} | null;

export type Order = {
  id: string;
  status: OrderStatus | string;
  language: OrderLanguage;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  customerId?: string | null;
  customerPhone?: string | null;
  totalPrice?: number | null;
  total_price?: number | null;
  vehicle?: Vehicle;
  part?: OrderPart;
};

export type ShopOffer = {
  id: string;
  orderId: string;
  brand: string;
  productName: string;
  oemNumber: string | null;
  basePrice: number;
  marginPercent: number | null;
  finalPrice?: number;
  status: 'draft' | 'published';
  tier?: 'cheap' | 'medium' | 'expensive' | null;
};

export type ApiError = {
  status?: number;
  message: string;
  url?: string;
  body?: unknown;
};
