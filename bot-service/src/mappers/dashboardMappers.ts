import type {
  DashboardOrder,
  DashboardOrderPart,
  DashboardShopOffer,
  DashboardVehicle
} from "../types/dashboard";

export function mapOrderRowToDashboardOrder(row: any, vehicleRow?: any | null): DashboardOrder {
  console.log("[DashboardMapper] mapOrderRowToDashboardOrder input row:", {
    id: row?.id,
    hasVehicle: !!vehicleRow
  });

  const orderData = (row?.order_data || {}) as any;

  const part: DashboardOrderPart | null = orderData
    ? {
        partCategory: orderData.partCategory ?? null,
        position: orderData.position ?? null,
        partText: orderData.partText ?? null,
        partDetails: orderData.partDetails ?? null,
        oemStatus: orderData.oemStatus ?? null,
        oemNumber: orderData.oemNumber ?? null
      }
    : null;

  const vehicle: DashboardVehicle | null =
    vehicleRow && typeof vehicleRow === "object"
      ? {
          vin: vehicleRow.vin ?? null,
          hsn: vehicleRow.hsn ?? null,
          tsn: vehicleRow.tsn ?? null,
          make: vehicleRow.make ?? null,
          model: vehicleRow.model ?? null,
          year: vehicleRow.year != null ? Number(vehicleRow.year) : null,
          engine: vehicleRow.engine ?? vehicleRow.engine_code ?? null
        }
      : null;

  const mapped: DashboardOrder = {
    id: row.id,
    status: row.status,
    language: row.language ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerId: row.customer_id ?? null,
    customerPhone: row.customer_phone ?? row.customer_contact ?? null,
    vehicle,
    part
  };

  console.log("[DashboardMapper] mapped order", { id: mapped.id, status: mapped.status });
  return mapped;
}

export function mapOfferRowToDashboardShopOffer(row: any): DashboardShopOffer {
  const mapped: DashboardShopOffer = {
    id: row.id,
    orderId: row.order_id,
    brand: row.brand ?? row.shop_name ?? "",
    productName: row.product_name ?? row.shop_name ?? "",
    oemNumber: row.oem_number ?? null,
    basePrice: Number(row.base_price ?? row.price ?? 0),
    marginPercent:
      row.margin_percent !== null && row.margin_percent !== undefined
        ? Number(row.margin_percent)
        : null,
    status: row.status ?? "draft",
    tier: row.tier ?? null
  };

  console.log("[DashboardMapper] mapped offer", { id: mapped.id, orderId: mapped.orderId });
  return mapped;
}
