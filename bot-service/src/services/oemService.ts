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
  const missing = determineRequiredFields(vehicle);
  if (missing.length > 0) {
    return {
      success: false,
      requiredFields: missing,
      message: "Es fehlen Fahrzeugdaten."
    };
  }

  const v = await client.lookupVehicle(vehicle);
  if (!v.success || !v.vehicleId) {
    return {
      success: false,
      message: v.message || "Fahrzeug konnte nicht ermittelt werden."
    };
  }

  const oem = await client.lookupOem(v.vehicleId, part);
  if (!oem.success || !oem.oemNumbers?.length) {
    return {
      success: false,
      message: oem.message || "Keine OEM Nummer gefunden."
    };
  }

  return {
    success: true,
    oemNumber: oem.oemNumbers[0]
  };
}
