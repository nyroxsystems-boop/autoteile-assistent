import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import type { Order, Message, ShopOffer, Vehicle } from "../types/models";

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false
      }
    });
  }
  return supabase;
}

/**
 * Testet die Verbindung zur Datenbank, indem eine einfache Abfrage
 * auf die Orders-Tabelle ausgeführt wird.
 */
export async function testDbConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getClient();
    const { error } = await client.from("orders").select("id").limit(1);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Unknown error" };
  }
}

/**
 * Legt eine neue Order in der orders-Tabelle an.
 */
export async function insertOrder(partial: {
  customerName?: string | null;
  customerContact?: string | null;
  requestedPartName: string;
  vehicleId?: string | null;
}): Promise<Order> {
  const client = getClient();

  const { data, error } = await client
    .from("orders")
    .insert({
      customer_name: partial.customerName ?? null,
      customer_contact: partial.customerContact ?? null,
      requested_part_name: partial.requestedPartName,
      vehicle_id: partial.vehicleId ?? null,
      status: "new"
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert order: ${error.message}`);
  }

  const order: Order = {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    customerName: data.customer_name,
    customerContact: data.customer_contact,
    vehicleId: data.vehicle_id,
    requestedPartName: data.requested_part_name,
    oemNumber: data.oem_number,
    status: data.status,
    matchConfidence: data.match_confidence,
    orderData: data.order_data,
    language: data.language ?? null
  };

  return order;
}

/**
 * Holt eine Order per ID aus der Datenbank.
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const client = getClient();

  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // PGRST116 = No rows found (kann je nach Version variieren)
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch order ${id}: ${error.message}`);
  }

  const order: Order = {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    customerName: data.customer_name,
    customerContact: data.customer_contact,
    vehicleId: data.vehicle_id,
    requestedPartName: data.requested_part_name,
    oemNumber: data.oem_number,
    status: data.status,
    matchConfidence: data.match_confidence,
    orderData: data.order_data,
    language: data.language ?? null
  };

  return order;
}

/**
 * Listet die letzten Orders.
 */
export async function listOrders(limit = 50): Promise<Order[]> {
  const client = getClient();

  const { data, error } = await client
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list orders: ${error.message}`);
  }

  const mapped: Order[] =
    (data ?? []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      customerName: row.customer_name,
      customerContact: row.customer_contact,
      vehicleId: row.vehicle_id,
      requestedPartName: row.requested_part_name,
      oemNumber: row.oem_number,
      status: row.status,
      matchConfidence: row.match_confidence,
      orderData: row.order_data,
      language: row.language ?? null
    })) ?? [];

  return mapped;
}

/**
 * Legt eine neue Message in der messages-Tabelle an.
 */
export async function insertMessage(partial: {
  orderId?: string | null;
  direction: "incoming" | "outgoing";
  channel: "whatsapp";
  fromIdentifier?: string | null;
  toIdentifier?: string | null;
  content: string;
  rawPayload?: any;
}): Promise<Message> {
  const client = getClient();

  const { data, error } = await client
    .from("messages")
    .insert({
      order_id: partial.orderId ?? null,
      direction: partial.direction,
      channel: partial.channel,
      from_identifier: partial.fromIdentifier ?? null,
      to_identifier: partial.toIdentifier ?? null,
      content: partial.content,
      raw_payload: partial.rawPayload ?? null
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert message: ${error.message}`);
  }

  const message: Message = {
    id: data.id,
    createdAt: data.created_at,
    orderId: data.order_id,
    direction: data.direction,
    channel: data.channel,
    fromIdentifier: data.from_identifier,
    toIdentifier: data.to_identifier,
    content: data.content,
    rawPayload: data.raw_payload
  };

  return message;
}

/**
 * Listet Nachrichten zu einer bestimmten Order (aufsteigend nach created_at).
 */
export async function listMessagesByOrderId(orderId: string): Promise<Message[]> {
  const client = getClient();

  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list messages for order ${orderId}: ${error.message}`);
  }

  const messages: Message[] =
    (data ?? []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      orderId: row.order_id,
      direction: row.direction,
      channel: row.channel,
      fromIdentifier: row.from_identifier,
      toIdentifier: row.to_identifier,
      content: row.content,
      rawPayload: row.raw_payload
    })) ?? [];

  return messages;
}

/**
 * Fügt mehrere Shop-Angebote in die Tabelle shop_offers ein.
 */
export async function insertShopOffers(
  orderId: string,
  oemNumber: string,
  offers: Array<{
    shopName: string;
    brand?: string | null;
    price: number;
    currency?: string;
    availability?: string | null;
    deliveryTimeDays?: number | null;
    productUrl?: string | null;
    rating?: number | null;
    isRecommended?: boolean | null;
  }>
): Promise<ShopOffer[]> {
  const client = getClient();

  const payload = offers.map((o) => ({
    order_id: orderId,
    oem_number: oemNumber,
    shop_name: o.shopName,
    brand: o.brand ?? null,
    price: o.price,
    currency: o.currency ?? "EUR",
    availability: o.availability ?? null,
    delivery_time_days: o.deliveryTimeDays ?? null,
    product_url: o.productUrl ?? null,
    rating: o.rating ?? null,
    is_recommended: o.isRecommended ?? null
  }));

  const { data, error } = await client
    .from("shop_offers")
    .insert(payload)
    .select("*");

  if (error) {
    throw new Error(`Failed to insert shop offers: ${error.message}`);
  }

  const mapped: ShopOffer[] =
    (data ?? []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      orderId: row.order_id,
      oemNumber: row.oem_number,
      shopName: row.shop_name,
      brand: row.brand,
      price: Number(row.price),
      currency: row.currency,
      availability: row.availability,
      deliveryTimeDays: row.delivery_time_days,
      productUrl: row.product_url,
      rating: row.rating != null ? Number(row.rating) : null,
      isRecommended: row.is_recommended
    })) ?? [];

  return mapped;
}

/**
 * Listet alle Shop-Angebote zu einer Order.
 */
export async function listShopOffersByOrderId(orderId: string): Promise<ShopOffer[]> {
  const client = getClient();

  const { data, error } = await client
    .from("shop_offers")
    .select("*")
    .eq("order_id", orderId)
    .order("price", { ascending: true });

  if (error) {
    throw new Error(`Failed to list shop offers: ${error.message}`);
  }

  const mapped: ShopOffer[] =
    (data ?? []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      orderId: row.order_id,
      oemNumber: row.oem_number,
      shopName: row.shop_name,
      brand: row.brand,
      price: Number(row.price),
      currency: row.currency,
      availability: row.availability,
      deliveryTimeDays: row.delivery_time_days,
      productUrl: row.product_url,
      rating: row.rating != null ? Number(row.rating) : null,
      isRecommended: row.is_recommended
    })) ?? [];

  return mapped;
}

/**
 * Holt ein Vehicle per ID.
 */
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const client = getClient();

  const { data, error } = await client
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch vehicle ${id}: ${error.message}`);
  }

  const v: Vehicle = {
    id: data.id,
    createdAt: data.created_at,
    make: data.make,
    model: data.model,
    year: data.year ?? undefined,
    engineCode: data.engine_code ?? undefined,
    vin: data.vin,
    hsn: data.hsn,
    tsn: data.tsn,
    rawData: data.raw_data
  };

  return v;
}

/**
 * Holt das Vehicle zu einer Order (falls vehicle_id gesetzt ist).
 */
export async function getVehicleForOrder(orderId: string): Promise<Vehicle | null> {
  const client = getClient();

  const { data: order, error: orderError } = await client
    .from("orders")
    .select("vehicle_id")
    .eq("id", orderId)
    .single();

  if (orderError) {
    throw new Error(`Failed to fetch order for vehicle lookup: ${orderError.message}`);
  }

  if (!order.vehicle_id) {
    return null;
  }

  return await getVehicleById(order.vehicle_id);
}

/**
 * Setzt vehicle_id für eine Order.
 */
async function setOrderVehicleId(orderId: string, vehicleId: string): Promise<void> {
  const client = getClient();

  const { error } = await client
    .from("orders")
    .update({ vehicle_id: vehicleId })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to set vehicle_id on order: ${error.message}`);
  }
}

/**
 * Vereinigt vorhandene Vehicle-Daten mit neuen Daten.
 * Überschreibt nur Felder, die bisher null/undefined waren oder explizit neu geliefert werden.
 */
function mergeVehicleData(existing: any, incoming: {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  engineCode?: string | null;
  vin?: string | null;
  hsn?: string | null;
  tsn?: string | null;
}) {
  return {
    make: incoming.make ?? existing.make ?? null,
    model: incoming.model ?? existing.model ?? null,
    year: incoming.year ?? existing.year ?? null,
    engine_code: incoming.engineCode ?? existing.engine_code ?? null,
    vin: incoming.vin ?? existing.vin ?? null,
    hsn: incoming.hsn ?? existing.hsn ?? null,
    tsn: incoming.tsn ?? existing.tsn ?? null
  };
}

/**
 * Upsert Vehicle-Daten für eine Order, basierend auf (z.B.) parseUserMessage-Ergebnissen.
 *
 * - Wenn Order kein vehicle_id hat → neues Vehicle anlegen, ID auf Order speichern.
 * - Wenn bereits ein Vehicle existiert → Felder zusammenführen und updaten.
 */
export async function upsertVehicleForOrderFromPartial(
  orderId: string,
  partial: {
    make?: string | null;
    model?: string | null;
    year?: number | null;
    engineCode?: string | null;
    vin?: string | null;
    hsn?: string | null;
    tsn?: string | null;
  }
): Promise<Vehicle> {
  const client = getClient();

  // Hole Order + vehicle_id
  const { data: orderRow, error: orderError } = await client
    .from("orders")
    .select("vehicle_id")
    .eq("id", orderId)
    .single();

  if (orderError) {
    throw new Error(`Failed to fetch order for vehicle upsert: ${orderError.message}`);
  }

  if (!orderRow.vehicle_id) {
    // Neues Vehicle anlegen
    const { data, error } = await client
      .from("vehicles")
      .insert({
        make: partial.make ?? null,
        model: partial.model ?? null,
        year: partial.year ?? null,
        engine_code: partial.engineCode ?? null,
        vin: partial.vin ?? null,
        hsn: partial.hsn ?? null,
        tsn: partial.tsn ?? null,
        raw_data: null
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to insert vehicle: ${error.message}`);
    }

    await setOrderVehicleId(orderId, data.id);

    const v: Vehicle = {
      id: data.id,
      createdAt: data.created_at,
      make: data.make,
      model: data.model,
      year: data.year ?? undefined,
      engineCode: data.engine_code ?? undefined,
      vin: data.vin,
      hsn: data.hsn,
      tsn: data.tsn,
      rawData: data.raw_data
    };

    return v;
  }

  // Vehicle existiert → zusammenführen und updaten
  const { data: existingVehicle, error: vehicleError } = await client
    .from("vehicles")
    .select("*")
    .eq("id", orderRow.vehicle_id)
    .single();

  if (vehicleError) {
    throw new Error(`Failed to fetch existing vehicle: ${vehicleError.message}`);
  }

  const merged = mergeVehicleData(existingVehicle, partial);

  const { data: updated, error: updateError } = await client
    .from("vehicles")
    .update(merged)
    .eq("id", orderRow.vehicle_id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(`Failed to update vehicle: ${updateError.message}`);
  }

  const v: Vehicle = {
    id: updated.id,
    createdAt: updated.created_at,
    make: updated.make,
    model: updated.model,
    year: updated.year ?? undefined,
    engineCode: updated.engine_code ?? undefined,
    vin: updated.vin,
    hsn: updated.hsn,
    tsn: updated.tsn,
    rawData: updated.raw_data
  };

  return v;
}

/**
 * Führt ein partielles Update des JSON-Feldes order_data für eine Order durch.
 * Bestehende Keys bleiben erhalten, neue werden hinzugefügt/überschrieben.
 */
export async function updateOrderData(
  orderId: string,
  patch: Record<string, any>
): Promise<void> {
  const client = getClient();

  const { data, error } = await client
    .from("orders")
    .select("order_data")
    .eq("id", orderId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch existing order_data: ${error.message}`);
  }

  const current = data?.order_data || {};
  const merged = { ...current, ...patch };

  const { error: updateError } = await client
    .from("orders")
    .update({ order_data: merged })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(`Failed to update order_data: ${updateError.message}`);
  }
}

/**
 * Setzt die Sprache einer Order, z.B. "de" oder "en".
 */
export async function updateOrderLanguage(orderId: string, language: string): Promise<void> {
  const client = getClient();

  const { error } = await client
    .from("orders")
    .update({ language })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to update order language: ${error.message}`);
  }
}

/**
 * Aktualisiert OEM-bezogene Felder in einer Order.
 */
export async function updateOrderOEM(
  orderId: string,
  update: {
    oemStatus?: string | null;
    oemError?: string | null;
    oemData?: any | null;
  }
) {
  const client = getClient();

  const { data, error } = await client
    .from("orders")
    .update({
      oem_status: update.oemStatus ?? null,
      oem_error: update.oemError ?? null,
      oem_data: update.oemData ?? null
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update OEM fields: ${error.message}`);
  }

  return data;
}

/**
 * Aktualisiert den Status einer Order (z.B. new → processing → ready → ordered).
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
) {
  const client = getClient();

  const { data, error } = await client
    .from("orders")
    .update({
      status
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  return data;
}
