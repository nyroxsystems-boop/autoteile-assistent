import { listShopOffersByOrderId, updateOrderStatus } from "./supabaseService";
import type { ShopOffer } from "../types/models";

/**
 * Regel-Engine: Bestes Angebot auswählen.
 *
 * Logik:
 * - niedrigster Preis gewinnt
 * - wenn Lieferzeit bekannt:
 *    bevorzugt Lieferzeit ≤ 2 Tage
 */
export function selectBestOffer(offers: ShopOffer[]): ShopOffer | null {
  if (!offers || offers.length === 0) return null;

  // 1. Filter bevorzugt schnelle Lieferung
  const fast = offers.filter(o => o.deliveryTimeDays != null && o.deliveryTimeDays <= 2);

  const candidates = fast.length > 0 ? fast : offers;

  // 2. Sortiere nach Preis
  candidates.sort((a, b) => a.price - b.price);

  return candidates[0] ?? null;
}

/**
 * Markiert eine Order als "ready" und setzt bestOffer.
 */
export async function autoSelectOffer(orderId: string) {
  const offers = await listShopOffersByOrderId(orderId);
  if (offers.length === 0) {
    throw new Error("No shop offers available for this order.");
  }

  const best = selectBestOffer(offers);
  if (!best) {
    throw new Error("No suitable offer found.");
  }

  // Status aktualisieren
  await updateOrderStatus(orderId, "ready");

  return best;
}

/**
 * Auto-Bestellung (Mock).
 *
 * Später wird hier:
 * - Login beim Händler
 * - In den Warenkorb legen
 * - Bestellung abschließen
 * - Rechnung/Tracking speichern
 *
 * Jetzt nur Mock.
 */
export async function autoOrder(orderId: string, offer: ShopOffer) {
  // Fake-Verzögerung
  await new Promise(res => setTimeout(res, 300));

  // In Realität würdest du hier eine externe Bestellung ausführen.
  const confirmation = `MOCK-ORDER-${orderId}-${offer.shopName}-${Date.now()}`;

  await updateOrderStatus(orderId, "ordered");

  return {
    success: true,
    confirmation,
    orderedFrom: offer.shopName,
    price: offer.price
  };
}
