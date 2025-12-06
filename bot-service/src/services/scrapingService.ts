import { insertShopOffers } from "./supabaseService";

export interface ScrapedOffer {
  shopName: string;
  brand?: string | null;
  price: number;
  currency?: string;
  availability?: string | null;
  deliveryTimeDays?: number | null;
  productUrl?: string | null;
  rating?: number | null;
  isRecommended?: boolean | null;
}

export interface ShopAdapter {
  name: string;
  fetchOffers(oem: string): Promise<ScrapedOffer[]>;
}

/**
 * Mock-Adapter für einen Shop (z.B. Autodoc).
 * Später werden hier echte Scraper/API-Calls implementiert.
 */
class MockAutodocAdapter implements ShopAdapter {
  name = "Autodoc";

  async fetchOffers(oem: string): Promise<ScrapedOffer[]> {
    // MOCK-Daten – später durch echten Scraper ersetzt
    return [
      {
        shopName: this.name,
        brand: "ATE",
        price: 89.99,
        currency: "EUR",
        availability: "In stock",
        deliveryTimeDays: 2,
        productUrl: `https://autodoc.example.com/parts/${encodeURIComponent(oem)}`,
        rating: 4.7,
        isRecommended: true
      },
      {
        shopName: this.name,
        brand: "NoName",
        price: 59.99,
        currency: "EUR",
        availability: "In stock",
        deliveryTimeDays: 4,
        productUrl: `https://autodoc.example.com/parts/${encodeURIComponent(oem)}?cheap=1`,
        rating: 3.8,
        isRecommended: false
      }
    ];
  }
}

/**
 * Noch ein Mock-Adapter, z.B. für "KFZTeile24".
 */
class MockKfzteileAdapter implements ShopAdapter {
  name = "KFZTeile24";

  async fetchOffers(oem: string): Promise<ScrapedOffer[]> {
    return [
      {
        shopName: this.name,
        brand: "Brembo",
        price: 94.5,
        currency: "EUR",
        availability: "In stock",
        deliveryTimeDays: 1,
        productUrl: `https://kfzteile24.example.com/search?q=${encodeURIComponent(oem)}`,
        rating: 4.6,
        isRecommended: true
      }
    ];
  }
}

// Registry aller aktiven Shop-Adapter (später erweiterbar)
const adapters: ShopAdapter[] = [
  new MockAutodocAdapter(),
  new MockKfzteileAdapter()
];

/**
 * Führt Scraping/Preisabfrage für eine bestimmte Order + OEM durch
 * und speichert die Ergebnisse in der DB.
 */
export async function scrapeOffersForOrder(orderId: string, oemNumber: string) {
  const allOffers: ScrapedOffer[] = [];

  for (const adapter of adapters) {
    try {
      const offers = await adapter.fetchOffers(oemNumber);
      allOffers.push(...offers);
    } catch (err) {
      console.error(`Error scraping from adapter ${adapter.name}:`, err);
    }
  }

  if (allOffers.length === 0) {
    return [];
  }

  const inserted = await insertShopOffers(orderId, oemNumber, allOffers);
  return inserted;
}
