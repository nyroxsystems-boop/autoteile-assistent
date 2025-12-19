# Dashboard API Contract

Zusammenfassung aller API-Aufrufe aus `dashboard/src` (Stand: current code). Pfade sind relativ zu `VITE_API_BASE_URL`.

## Auth / Session
- **POST `/api/auth/login`**
  - Body: `{ email: string, password: string, tenant?: string }`
  - Response: `{ access: string, refresh: string, user: {id, username, email}, tenant: {id, slug, name, role} }`
  - Verwendet in: `src/auth/AuthContext.tsx` (Login-Flow in `AuthPage`).
- Authorization Header: `Bearer <access_token>` wird im apiClient automatisch gesetzt. 401 → Logout.

## Orders & Offers
- **GET `/dashboard/orders`**
  - Query: none (filter optional clientseitig)
  - Response: `Order[]` (`src/api/types`: `id`, `status`, `language`, `order_data`, `vehicle`, `part`, `created_at|createdAt`, `updated_at|updatedAt`, `customerId?`, `customerPhone?`, `totalPrice?`)
  - Verwendet in: `src/api/orders.ts` → `OverviewPage`, `OrdersListPage`.
- **GET `/dashboard/orders/:id`**
  - Response: `Order`
  - Verwendet in: `src/api/orders.ts` → `OrderDetailPage`.
- **GET `/dashboard/orders/:id/offers`**
  - Response: `ShopOffer[]` (`src/api/types`: `id`, `orderId`, `shopName`, `brand`, `productName`, `productUrl`, `oemNumber`, `basePrice`, `currency`, `marginPercent`, `finalPrice`, `status`, `tier`, `availability`, `deliveryTimeDays`, `rating`, `isRecommended`)
  - Verwendet in: `src/api/orders.ts` → `OrderDetailPage`.
- **POST `/dashboard/orders/:id/offers/publish`**
  - Body: `{ offerIds: string[] }`
  - Response: `{ success: boolean }`
  - Verwendet in: `src/api/orders.ts` → `OrderDetailPage`.
- **GET `/api/orders/:id/offers`**
  - Response: `Offer[]` or `{order_id, offers[]}` (used leniently).
  - Verwendet in: `src/ShopOffersTable.tsx` (list view inside detail).

## Dealer Supplier Mapping
- **GET `/api/dealers/:dealerId/suppliers`**
  - Response: `DealerSupplierItem[]` where each item: `{ supplier: {id, name, country, actor_variant?}, enabled: boolean, priority: number, is_default: boolean }`
  - Verwendet in: `src/pages/DealerSuppliersPage.tsx`.
- **PUT `/api/dealers/:dealerId/suppliers`**
  - Body: `{ items: [{ supplier_id: string, enabled: boolean, priority: number, is_default: boolean }] }`
  - Response: updated `DealerSupplierItem[]`
  - Verwendet in: `src/pages/DealerSuppliersPage.tsx`.

## Merchant Settings
- **GET `/dashboard/merchant/settings/:merchantId`**
  - Response: `MerchantSettings` (`merchantId`, `selectedShops: string[]`, `marginPercent: number`, `priceProfiles?: PriceProfile[]`)
  - Verwendet in: `src/pages/PricingPage.tsx`.
- **POST `/dashboard/merchant/settings/:merchantId`**
  - Body: `{ selectedShops?: string[], marginPercent?: number, priceProfiles?: PriceProfile[] }`
  - Response: `{ ok: boolean }`
  - Verwendet in: `src/pages/PricingPage.tsx`.

## WWS / Inventory
- **GET `/api/wws-connections`**
  - Response: `WwsConnection[]` (`id`, `name`, `type: demo_wws|http_api|scraper`, `baseUrl`, `isActive`, `authConfig`, `config`)
  - Verwendet in: `src/features/wws/WwsPage.tsx`.
- **POST `/api/wws-connections`**
  - Body: `{ name, type, baseUrl, isActive?, authConfig?, config? }`
  - Response: `WwsConnection`
  - Verwendet in: `WwsPage` (create).
- **PUT `/api/wws-connections/:id`**
  - Body: same Felder wie create (partial)
  - Response: `WwsConnection`
  - Verwendet in: `WwsPage` (update).
- **DELETE `/api/wws-connections/:id`**
  - Response: empty
  - Verwendet in: `WwsPage` (delete).
- **POST `/api/wws-connections/:id/test`**
  - Body: `{ oemNumber: string }`
  - Response: `{ ok: boolean, error?: string, sampleResultsCount?: number }`
  - Verwendet in: `WwsPage` (Verbindung testen).
- **GET `/api/bot/inventory/by-oem/:oem`**
  - Response: `{ oem, oemNumber, offers: any[], generated_at, errors: [] }`
  - Verwendet in: `WwsPage` (Inventar-Test).

## Orders (legacy / direct)
- **GET `/api/orders/:orderId/offers`** (siehe oben)
- **GET `/api/orders`** not directly used in Dashboard; calls are via `/dashboard/...`.

## Dashboard UI Feldanforderungen
- Orders Listen/Details: `id`, `status`, `createdAt/created_at`, `updatedAt/updated_at`, `order_data`, `vehicle`, `part`, optional `totalPrice/total_price`, `oemNumber` (in part).
- Offers Listen: `id`, `orderId`, `shopName|supplierName`, `brand`, `productName`, `productUrl`, `oemNumber`, `basePrice`, `finalPrice`, `currency`, `status`, `tier`, `availability`, `deliveryTimeDays`, `rating`.
- Dealer Suppliers: `supplier.name`, `enabled`, `priority`, `is_default`.
- WWS Connections Tabelle: `id`, `name`, `type`, `baseUrl`, `isActive`.

## Komponenten ↔ Endpoints Mapping
- `pages/OverviewPage.tsx`, `pages/OrdersListPage.tsx` → `/dashboard/orders`
- `pages/OrderDetailPage.tsx` → `/dashboard/orders/:id`, `/dashboard/orders/:id/offers`, `/dashboard/orders/:id/offers/publish`
- `ShopOffersTable.tsx` → `/api/orders/:id/offers`
- `pages/DealerSuppliersPage.tsx` → `/api/dealers/:dealerId/suppliers` (GET/PUT)
- `pages/PricingPage.tsx` → `/dashboard/merchant/settings/:merchantId` (GET/POST)
- `features/wws/WwsPage.tsx` → `/api/wws-connections` (CRUD/Test), `/api/bot/inventory/by-oem/:oem`
