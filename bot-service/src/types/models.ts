export type OrderStatus =
  | "new" // frisch von WhatsApp angelegt
  | "processing" // OEM/Angebote werden ermittelt
  | "ready" // Angebote verfügbar, wartet auf Entscheidung
  | "ordered" // Teil wurde bestellt
  | "failed"; // Fehler im Prozess

export interface Vehicle {
  id: string;
  createdAt: string;

  make: string; // z.B. BMW
  model: string; // z.B. 316Ti
  year?: number;
  engineCode?: string;
  vin?: string | null;
  hsn?: string | null;
  tsn?: string | null;
  rawData?: any;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;

  customerName?: string | null;
  customerContact?: string | null; // z.B. WhatsApp-Nummer

  vehicleId?: string | null;
  requestedPartName: string; // z.B. "Bremssattel vorne links"

  oemNumber?: string | null;
  status: OrderStatus;

  matchConfidence?: number | null; // 0–1; wie sicher ist das Matching

  orderData?: any | null; // JSON-Feld für zusätzlichen Dialog-/Order-Status

  language?: string | null; // z.B. "de" oder "en"
}

export interface OemPart {
  id: string;
  createdAt: string;

  oemNumber: string;
  brand?: string | null; // z.B. BMW, VAG etc.
  description?: string | null;
  vehicleId?: string | null;
  rawTecDocData?: any; // optional: komplette TecDoc-Antwort
}

export interface ShopOffer {
  id: string;
  createdAt: string;

  orderId: string;
  oemNumber: string;
  shopName: string; // z.B. "Autodoc"
  brand?: string | null; // z.B. ATE, Brembo
  price: number;
  currency: string; // z.B. "EUR"
  availability?: string | null; // z.B. "In stock"
  deliveryTimeDays?: number | null;
  productUrl?: string | null;
  rating?: number | null; // z.B. 4.7
  isRecommended?: boolean | null; // vom System gesetzt
}

export interface Message {
  id: string;
  createdAt: string;

  orderId?: string | null;
  direction: "incoming" | "outgoing";
  channel: "whatsapp";
  fromIdentifier?: string | null; // z.B. Kunden-Nummer
  toIdentifier?: string | null; // z.B. unsere Nummer

  content: string; // Textnachricht
  rawPayload?: any; // originaler WA-Payload (optional)
}
