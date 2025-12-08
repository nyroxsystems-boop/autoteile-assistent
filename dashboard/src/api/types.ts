export type OrderStatus =
  | 'choose_language'
  | 'collect_vehicle'
  | 'collect_part'
  | 'oem_lookup'
  | 'show_offers'
  | 'done';

export type OrderLanguage = 'de' | 'en' | null;

export type SelectedOfferSummary = {
  shopName?: string | null;
  brand?: string | null;
  price?: number | null;
  currency?: string | null;
  deliveryTimeDays?: number | null;
};

export type OrderData = {
  conversationStatus?: OrderStatus | string | null;
  vehicleDescription?: string | null;
  partDescription?: string | null;
  offerChoiceIds?: string[] | null;
  selectedOfferId?: string | null;
  selectedOfferSummary?: SelectedOfferSummary | null;
};

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
  order_data?: OrderData | null;
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
  shopName?: string | null;
  brand: string | null;
  productName?: string | null;
  productUrl?: string | null;
  oemNumber: string | null;
  basePrice: number;
  currency?: string | null;
  marginPercent: number | null;
  finalPrice?: number;
  status: 'draft' | 'published';
  tier?: 'cheap' | 'medium' | 'expensive' | null;
  availability?: string | null;
  deliveryTimeDays?: number | null;
  rating?: number | null;
  isRecommended?: boolean | null;
};

export type ApiError = {
  status?: number;
  message: string;
  url?: string;
  body?: unknown;
};
