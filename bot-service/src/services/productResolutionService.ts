import { getSupabaseClient, getVehicleForOrder } from "./supabaseService";

export type ProductResolutionContext = {
  orderId: string;
  orderRow: any;
  vehicleRow?: any | null;
};

export type ResolvedProductOffer = {
  brand: string;
  productName: string;
  oemNumber: string | null;
  basePrice: number;
  tier: "cheap" | "medium" | "expensive";
};

const supabase = getSupabaseClient();

export async function refreshOffersForOrder(
  orderId: string
): Promise<{ offers: ResolvedProductOffer[] }> {
  console.log("[ProductResolution] Starting refreshOffersForOrder", { orderId });

  // 1) Load order
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    console.error("[ProductResolution][Error] Failed to load order", orderError);
    throw new Error(orderError.message ?? "Failed to load order");
  }
  if (!orderRow) {
    console.warn("[ProductResolution] Order not found", { orderId });
    throw new Error("Order not found");
  }

  // 2) Load vehicle (best effort)
  let vehicleRow: any | null = null;
  try {
    vehicleRow = await getVehicleForOrder(orderId);
    console.log("[ProductResolution] Vehicle fetched for order", {
      orderId,
      hasVehicle: !!vehicleRow
    });
  } catch (vehicleErr: any) {
    console.warn("[ProductResolution] Vehicle fetch failed, continuing", vehicleErr?.message);
  }

  const ctx: ProductResolutionContext = { orderId, orderRow, vehicleRow };
  console.log("[ProductResolution] Context built for order", orderId, {
    hasVehicle: !!vehicleRow,
    status: orderRow.status
  });

  // 3) Resolve dummy offers
  const offers = resolveDummyOffers(ctx);
  console.log("[ProductResolution] Dummy offers generated for order", orderId, {
    count: offers.length
  });

  // 4) Delete existing draft offers (non-fatal)
  console.log("[ProductResolution] Deleting existing draft offers for order", orderId);
  const { error: deleteError } = await supabase
    .from("shop_offers")
    .delete()
    .eq("order_id", orderId)
    .eq("status", "draft");

  if (deleteError) {
    console.warn(
      "[ProductResolution] Failed to delete existing draft offers (continuing)",
      deleteError.message
    );
  }

  // 5) Insert new offers
  console.log("[ProductResolution] Inserting", offers.length, "offers for order", orderId);
  const insertPayload = offers.map((offer) => ({
    order_id: orderId,
    brand: offer.brand,
    product_name: offer.productName,
    oem_number: offer.oemNumber,
    base_price: offer.basePrice,
    margin_percent: null,
    status: "draft",
    tier: offer.tier
  }));

  const { error: insertError } = await supabase.from("shop_offers").insert(insertPayload);
  if (insertError) {
    console.error("[ProductResolution][Error] Failed to insert offers", insertError);
    throw new Error(insertError.message ?? "Failed to insert offers");
  }

  console.log("[ProductResolution] Offers inserted for order", orderId, {
    inserted: offers.length
  });

  return { offers };
}

function resolveDummyOffers(ctx: ProductResolutionContext): ResolvedProductOffer[] {
  const data = (ctx.orderRow?.order_data as Record<string, any>) || {};
  const partCategory = data.partCategory || "unbekanntes Teil";
  const oemNumber = data.oemNumber || null;
  const position = data.position || data.partPosition || "";

  const baseLabel = `${partCategory} ${position}`.trim() || "Teil";
  const suffix = oemNumber ? `(OEM ${oemNumber})` : "(ohne OEM)";

  const offers: ResolvedProductOffer[] = [
    {
      brand: "BudgetParts",
      productName: `${baseLabel} ${suffix}`,
      oemNumber,
      basePrice: 49.99,
      tier: "cheap"
    },
    {
      brand: "MittelQualität",
      productName: `${baseLabel} ${suffix}`,
      oemNumber,
      basePrice: 79.99,
      tier: "medium"
    },
    {
      brand: "PremiumPro",
      productName: `${baseLabel} ${suffix}`,
      oemNumber,
      basePrice: 119.99,
      tier: "expensive"
    }
  ];

  console.log("[ProductResolution] Dummy offers generated for order", ctx.orderId, {
    count: offers.length,
    partCategory,
    oemNumber
  });

  return offers;
}
