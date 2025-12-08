import { Actor } from "apify";

type TecDocOperation =
  | "getAllLanguages"
  | "getAllCountries"
  | "listVehicleTypes"
  | "getManufacturers"
  | "getModels"
  | "getVehicleEngineTypes"
  | "getVehicleDetails"
  | "getCategoryV1"
  | "getCategoryV2"
  | "getCategoryV3"
  | "getArticlesList"
  | "getArticleDetailsById"
  | "searchArticlesByNumber"
  | "searchArticlesByNumberAndSupplier";

interface TecDocActorInput {
  operation: TecDocOperation;
  payload?: Record<string, any>;
}

const SUPPORTED_OPERATIONS: TecDocOperation[] = [
  "getAllLanguages",
  "getAllCountries",
  "listVehicleTypes",
  "getManufacturers",
  "getModels",
  "getVehicleEngineTypes",
  "getVehicleDetails",
  "getCategoryV1",
  "getCategoryV2",
  "getCategoryV3",
  "getArticlesList",
  "getArticleDetailsById",
  "searchArticlesByNumber",
  "searchArticlesByNumberAndSupplier",
];

const log = Actor.log;

function ensureOperation(op: string): TecDocOperation {
  if ((SUPPORTED_OPERATIONS as string[]).includes(op)) {
    return op as TecDocOperation;
  }

  throw new Error(`Unsupported TecDoc operation: ${op}`);
}

export async function callTecDoc(
  operation: TecDocOperation,
  payload: Record<string, any> = {}
): Promise<any> {
  const baseUrl = process.env.TECDOC_BASE_URL;
  const apiKey = process.env.TECDOC_API_KEY;

  if (!baseUrl) throw new Error("Missing TECDOC_BASE_URL environment variable");
  if (!apiKey) throw new Error("Missing TECDOC_API_KEY environment variable");

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(operation, normalizedBase);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `TecDoc API request failed (${response.status} ${response.statusText}) for ${operation}: ${errorBody}`
    );
  }

  return response.json();
}

Actor.main(async () => {
  const input = await Actor.getInput<TecDocActorInput>();
  if (!input) throw new Error("Input is required");

  const { operation, payload = {} } = input;
  const op = ensureOperation(operation);

  try {
    log.info(`Calling TecDoc API operation: ${op}`);
    const result = await callTecDoc(op, payload ?? {});
    await Actor.pushData(result);
    log.info(
      `TecDoc API operation ${op} completed, response pushed to default dataset.`
    );
  } catch (error) {
    log.error(`TecDoc Actor failed for operation ${op}`, { error });
    throw error;
  }
});
