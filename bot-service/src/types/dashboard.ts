export type DashboardOrderPart = {
  partCategory?: string | null;
  position?: string | null;
  partText?: string | null;
  partDetails?: Record<string, any> | null;
  oemStatus?: "pending" | "success" | "not_found" | "multiple_matches" | null;
  oemNumber?: string | null;
};

export type DashboardVehicle = {
  vin?: string | null;
  hsn?: string | null;
  tsn?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  engine?: string | null;
};

export type DashboardOrder = {
  id: string;
  status: string;
  language: string | null;
  createdAt: string;
  updatedAt: string;
  customerId?: string | null;
  customerPhone?: string | null;
  vehicle: DashboardVehicle | null;
  part: DashboardOrderPart | null;
};

export type DashboardShopOffer = {
  id: string;
  orderId: string;
  brand: string;
  productName: string;
  oemNumber: string | null;
  basePrice: number;
  marginPercent: number | null;
  status: "draft" | "published";
  tier: "cheap" | "medium" | "expensive" | null;
};

export type DashboardStatsRange = "today" | "week" | "month";

export type DashboardStats = {
  range: DashboardStatsRange;
  totalOrders: number;
  openOemIssues: number;
  inboundMessages: number;
  abortedOrders: number;
  completedOrders: number;
};
