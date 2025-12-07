import { getDefaultTecDocClient, TecDocVehicleLookup } from "./tecdocClient";
import { determineRequiredFields } from "./oemRequiredFieldsService";

export interface OemResolutionResult {
  success: boolean;
  oemNumber?: string | null;
  requiredFields?: string[];
  message?: string;
}

const client = getDefaultTecDocClient();

/**
 * Vollständiger OEM-Flow:
 * 1. Fahrzeug identifizieren
 * 2. OEM-Nummern abrufen
 * 3. Ergebnis zurückgeben
 */
export async function resolveOEM(vehicle: TecDocVehicleLookup, part: string): Promise<OemResolutionResult> {
  console.log("[OEM] resolveOEM called", {
    vehicleSummary: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      engine: vehicle.engine,
      vin: vehicle.vin ? "***redacted***" : null,
      hsn: vehicle.hsn,
      tsn: vehicle.tsn
    },
    part
  });

  const missing = determineRequiredFields(vehicle);
  if (missing.length > 0) {
    console.log("[OEM] resolveOEM missing required fields", { missing });
    return {
      success: false,
      requiredFields: missing,
      message: "Es fehlen Fahrzeugdaten."
    };
  }

  const v = await client.lookupVehicle(vehicle);
  if (!v.success || !v.vehicleId) {
    console.error("[OEM] Vehicle lookup failed", { message: v.message });
    return {
      success: false,
      message: v.message || "Fahrzeug konnte nicht ermittelt werden."
    };
  }

  const oem = await client.lookupOem(v.vehicleId, part);
  if (!oem.success || !oem.oemNumbers?.length) {
    console.error("[OEM] OEM lookup found no results", { message: oem.message });
    return {
      success: false,
      message: oem.message || "Keine OEM Nummer gefunden."
    };
  }

  console.log("[OEM] resolveOEM success", { oemNumber: oem.oemNumbers[0] });
  return {
    success: true,
    oemNumber: oem.oemNumbers[0]
  };
}
