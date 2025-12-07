import {
  TecDocVehicleLookup,
  tecdocApi,
  TecDocManufacturer,
  TecDocModel,
  TecDocEngineType,
  TecDocCategory,
  TecDocArticle,
  findBestManufacturer,
  findBestModel,
  findBestEngine,
  findCategoryByName
} from "./tecdocClient";
import { determineRequiredFields } from "./oemRequiredFieldsService";

export interface OemResolutionResult {
  success: boolean;
  oemNumber?: string | null;
  requiredFields?: string[];
  message?: string;
  oemData?: Record<string, any>;
}

const DEFAULT_TYPE_ID = 1; // Automobile
const DEFAULT_LANG_FALLBACK = 4; // Example: English
const DEFAULT_COUNTRY_FALLBACK = 62; // Germany

/**
 * Vollständiger OEM-Flow:
 * 1. Fahrzeug identifizieren
 * 2. OEM-Nummern abrufen
 * 3. Ergebnis zurückgeben
 */
export async function resolveOEM(vehicle: TecDocVehicleLookup, part: string): Promise<OemResolutionResult> {
  console.log("[OEM] resolveOEM start", { vehicle, part });
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
    console.log("[OEM] Missing required fields", { missing });
    console.log("[OEM] resolveOEM missing required fields", { missing });
    return {
      success: false,
      requiredFields: missing,
      message: "Es fehlen Fahrzeugdaten."
    };
  }

  try {
    const langId = await pickLangId();
    const countryFilterId = await pickCountryId();
    const typeId = DEFAULT_TYPE_ID;

    const manufacturersResp = await tecdocApi.getManufacturers({ typeId, langId, countryFilterId });
    const manufacturers: TecDocManufacturer[] = manufacturersResp?.data || manufacturersResp?.manufacturers || [];
    const manufacturer = findBestManufacturer(vehicle.make || "", manufacturers);
    if (!manufacturer || !(manufacturer.manuId || manufacturer.manufacturerId)) {
      throw new Error(`Manufacturer not found for ${vehicle.make}`);
    }
    const manufacturerId = manufacturer.manuId ?? manufacturer.manufacturerId;

    const modelsResp = await tecdocApi.getModels({ typeId, langId, countryFilterId, manufacturerId });
    const models: TecDocModel[] = modelsResp?.data || modelsResp?.modelSeries || modelsResp?.models || [];
    const model = findBestModel(vehicle.model || "", vehicle.year ?? undefined, models);
    if (!model || !(model.modelId || model.modelSeriesId)) {
      throw new Error(`Model not found for ${vehicle.model}`);
    }
    const modelId = model.modelSeriesId ?? model.modelId;

    const engineResp = await tecdocApi.getVehicleEngineTypes({
      typeId,
      langId,
      countryFilterId,
      manufacturerId,
      modelSeriesId: modelId
    });
    const engines: TecDocEngineType[] = engineResp?.data || engineResp?.vehicles || engineResp?.engineTypes || [];
    const engineMatch = findBestEngine(vehicle.engine || "", vehicle.year ?? undefined, engines);
    if (!engineMatch || !engineMatch.vehicleId) {
      throw new Error("Vehicle engine/type not found");
    }
    const vehicleId = engineMatch.vehicleId;

    // Optional detail fetch; ignore errors
    try {
      await tecdocApi.getVehicleDetails({
        typeId,
        langId,
        countryFilterId,
        manufacturerId,
        vehicleId
      });
    } catch (err: any) {
      console.error("[OEM] Vehicle details fetch failed (continuing)", { message: err?.message });
    }

    const catResp = await tecdocApi.getCategoryV3({
      typeId,
      langId,
      countryFilterId,
      manufacturerId,
      vehicleId
    });
    const categories: TecDocCategory[] = catResp?.data || catResp?.genericArticles || catResp?.assemblyGroups || [];
    const category = findCategoryByName(part, categories);
    if (!category) {
      throw new Error(`Category not found for part ${part}`);
    }
    const productGroupId =
      category.categoryId ??
      category.genericArticleId ??
      category.levelId_3 ??
      category.levelId_2 ??
      category.levelId_1;

    const artResp = await tecdocApi.getArticlesList({
      typeId,
      langId,
      countryFilterId,
      manufacturerId,
      vehicleId,
      productGroupId
    });
    const articles: TecDocArticle[] = artResp?.data || artResp?.articles || [];
    if (!articles.length) {
      throw new Error("No articles found for selected category");
    }
    const topArticle = articles[0];
    let articleDetails: any = null;
    try {
      if (topArticle.articleId) {
        articleDetails = await tecdocApi.getArticleDetailsById({
          langId,
          countryFilterId,
          articleId: topArticle.articleId
        });
      }
    } catch (err: any) {
      console.error("[OEM] Article details fetch failed (continuing)", { message: err?.message });
    }

    const oemNumber =
      topArticle.articleNo ||
      topArticle?.oeNumbers?.[0]?.oeNumber ||
      (Array.isArray(articleDetails?.data) ? articleDetails?.data?.[0]?.articleNo : null) ||
      null;

    console.log("[OEM] resolveOEM success", {
      oemNumber,
      vehicleId,
      manufacturerId,
      modelId,
      productGroupId
    });

    return {
      success: !!oemNumber,
      oemNumber,
      oemData: {
        langId,
        countryFilterId,
        typeId,
        manufacturer,
        model,
        engine: engineMatch,
        category,
        vehicleId,
        productGroupId,
        articles,
        articleDetails
      },
      message: oemNumber ? undefined : "Keine OEM Nummer gefunden."
    };
  } catch (err: any) {
    console.error("[OEM] resolveOEM failed", { message: err?.message });
    return {
      success: false,
      message: err?.message ?? "OEM konnte nicht ermittelt werden."
    };
  }
}

async function pickLangId(): Promise<number> {
  try {
    const resp = await tecdocApi.getAllLanguages({});
    const langs: any[] = resp?.data || resp?.languages || [];
    const german = langs.find((l) => normalize(l.name || l.languageName) === "german");
    const english = langs.find((l) => normalize(l.name || l.languageName) === "english");
    if (german?.langId || german?.lngId) return german.langId ?? german.lngId;
    if (english?.langId || english?.lngId) return english.langId ?? english.lngId;
    const first = langs[0];
    return first?.langId ?? first?.lngId ?? DEFAULT_LANG_FALLBACK;
  } catch {
    return DEFAULT_LANG_FALLBACK;
  }
}

async function pickCountryId(): Promise<number> {
  try {
    const resp = await tecdocApi.getAllCountries({});
    const countries: any[] = resp?.data || resp?.countries || [];
    const germany = countries.find(
      (c) => normalize(c.countryName || c.name) === "germany" || normalize(c.countryCode) === "de"
    );
    if (germany?.countryFilterId || germany?.countryId) {
      return germany.countryFilterId ?? germany.countryId;
    }
    const first = countries[0];
    return first?.countryFilterId ?? first?.countryId ?? DEFAULT_COUNTRY_FALLBACK;
  } catch {
    return DEFAULT_COUNTRY_FALLBACK;
  }
}

function normalize(str: string | null | undefined): string {
  return (str || "").toString().toLowerCase().trim();
}
