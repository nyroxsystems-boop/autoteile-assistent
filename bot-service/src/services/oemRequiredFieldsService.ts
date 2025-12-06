import { TecDocVehicleLookup } from "./tecdocClient";

export function determineRequiredFields(vehicle: TecDocVehicleLookup): string[] {
  const required: string[] = [];

  if (!vehicle.make) required.push("make");
  if (!vehicle.model) required.push("model");
  if (!vehicle.year) required.push("year");
  if (!vehicle.engine) required.push("engine");

  return required;
}
