/**
 * TecDoc API Client über RapidAPI.
 *
 * WICHTIG:
 * - Host: https://tecdoc-catalog.p.rapidapi.com
 * - Header: X-RapidAPI-Key, X-RapidAPI-Host
 *
 * Die hier gezeigten Endpoints sind Beispiele und müssen ggf. anhand der
 * RapidAPI-Playground-Doku etwas angepasst werden.
 *
 * Siehe RapidAPI-Doku:
 * https://rapidapi.com/ronhartman/api/tecdoc-catalog
 */

import fetch from "node-fetch";

export interface TecDocVehicleLookup {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  engine?: string | null;
  vin?: string | null;
  hsn?: string | null;
  tsn?: string | null;
}

export interface TecDocVehicleResult {
  success: boolean;
  vehicleId?: string | null;
  message?: string;
}

export interface TecDocOemResult {
  success: boolean;
  oemNumbers?: string[];
  message?: string;
}

export interface TecDocPartResult {
  success: boolean;
  parts?: any[];
  message?: string;
}

export class TecDocClient {
  private apiKey: string;
  private baseUrl: string;
  private host: string;

  constructor(apiKey: string, baseUrl: string, host: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.host = host;
  }

  private ensureConfigured() {
    if (!this.apiKey) {
      throw new Error("RAPIDAPI_KEY (TecDoc) is not set");
    }
    if (!this.baseUrl) {
      throw new Error("TECDOC_BASE_URL is not set");
    }
    if (!this.host) {
      throw new Error("TECDOC_RAPIDAPI_HOST is not set");
    }
  }

  /**
   * Zentrale Request-Methode gegen die RapidAPI-TecDoc-API.
   *
   * @param method HTTP-Methode (GET/POST)
   * @param path   z.B. "/artlookup/search-articles-by-article-no/lang-id/4/article-type/ArticleNumber/article-no/..."
   * @param query  optionale Query-Parameter (werden an die URL gehängt)
   * @param body   optionaler Body (für POST)
   */
  private async request(
    method: "GET" | "POST",
    path: string,
    query?: Record<string, string | number | undefined>,
    body?: any
  ): Promise<any> {
    this.ensureConfigured();

    const url = new URL(this.baseUrl + path);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      "X-RapidAPI-Key": this.apiKey,
      "X-RapidAPI-Host": this.host
    };

    let fetchOptions: any = {
      method,
      headers
    };

    if (method === "POST" && body) {
      headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(body);
    }

    const resp = await fetch(url.toString(), fetchOptions);

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(
        `TecDoc API error: ${resp.status} ${resp.statusText} - ${text}`
      );
    }

    const data = await resp.json();
    return data;
  }

  /**
   * Beispielhafte Fahrzeug-Suche.
   *
   * TODO:
   * - In der RapidAPI-Doku/Playground nachsehen, welcher Endpoint für
   *   "Vehicle search" oder "Get vehicle types by make/model/year" geeignet ist.
   * - Den Pfad und das Mapping unten entsprechend anpassen.
   *
   * Aktuell:
   * - Dummy-Endpunkt "/vehicle-types" als Platzhalter
   */
  async lookupVehicle(query: TecDocVehicleLookup): Promise<TecDocVehicleResult> {
    // Wenn eine VIN vorhanden ist, würdest du einen VIN-Endpoint bevorzugt nutzen.
    // Falls dein RapidAPI-Plan einen solchen Endpoint bereitstellt, passe den Pfad hier an.

    // Platzhalter – bitte anpassen:
    const path = "/vehicle-types"; // TODO: richtigen Endpoint aus RapidAPI auswählen

    try {
      const result = await this.request("GET", path, {
        // TODO: Query-Parameter auf Basis der RapidAPI-Doku anpassen
        make: query.make ?? "",
        model: query.model ?? "",
        year: query.year ?? "",
        engine: query.engine ?? ""
      });

      // TODO: Das Mapping von "result" → vehicleId musst du anhand der tatsächlichen
      // JSON-Struktur aus dem RapidAPI-Playground anpassen.
      // Beispiel:
      // const first = result.data?.[0];
      // const vehicleId = first?.vehicleId || first?.kType;

      const first = (result && (result.data || result.vehicles || result.items))?.[0];
      const vehicleId =
        first?.vehicleId || first?.kType || first?.carId || null;

      if (!vehicleId) {
        return {
          success: false,
          message: "No matching vehicle found"
        };
      }

      return {
        success: true,
        vehicleId: String(vehicleId)
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message ?? "Vehicle lookup failed"
      };
    }
  }

  /**
   * OEM-Nummern für ein bestimmtes Fahrzeug + Artikel bestimmen.
   *
   * WICHTIG:
   * - RapidAPI-TecDoc bietet u.a. Endpoints wie:
   *   GET /artlookup/search-articles-by-article-no/lang-id/4/article-type/ArticleNumber/article-no/{value}
   *   (laut Playground-Beispiel)
   * - Je nachdem, ob du über "generic article" / Produktgruppe oder direkt über
   *   Artikel-/OE-Nummer gehst, musst du den Pfad unten anpassen.
   *
   * Aktuell nutzen wir ein Beispiel mit "search-articles-by-article-no", wobei
   * "requestedPart" als Artikelnummer/OEM verstanden wird.
   */
  async lookupOem(
    vehicleId: string,
    requestedPart: string
  ): Promise<TecDocOemResult> {
    if (!vehicleId || !requestedPart) {
      return {
        success: false,
        message: "vehicleId and requestedPart are required"
      };
    }

    try {
      // Beispiel-Endpunkt aus RapidAPI-Playground:
      // GET /artlookup/search-articles-by-article-no/lang-id/4/article-type/ArticleNumber/article-no/{requestedPart}
      // Quelle: Playground-Doku "Search Articles by Article no V2"
      const encoded = encodeURIComponent(requestedPart);
      const path = `/artlookup/search-articles-by-article-no/lang-id/4/article-type/ArticleNumber/article-no/${encoded}`;

      const result = await this.request("GET", path);

      // TODO: Mapping an die reale JSON-Struktur anpassen.
      // Suche im Result nach OE-/OEM-Referenzen, z.B.:
      //
      // result.data[].searchResult[].articleNo
      // result.data[].searchResult[].oeNumbers[]
      //
      // Hier ein generisches Beispiel:

      const oemNumbers: string[] = [];

      const dataArray: any[] =
        result?.data ||
        result?.results ||
        result?.articles ||
        [];

      for (const item of dataArray) {
        if (item?.articleNo) {
          oemNumbers.push(String(item.articleNo));
        }
        if (Array.isArray(item?.oeNumbers)) {
          for (const oe of item.oeNumbers) {
            if (oe?.oeNumber) {
              oemNumbers.push(String(oe.oeNumber));
            }
          }
        }
      }

      const uniqueOem = Array.from(new Set(oemNumbers));

      if (!uniqueOem.length) {
        return {
          success: false,
          message: "No OEM numbers found in TecDoc response"
        };
      }

      return {
        success: true,
        oemNumbers: uniqueOem
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message ?? "OEM lookup failed"
      };
    }
  }

  /**
   * Aftermarket-Teile für eine OEM-Nummer finden.
   *
   * TODO:
   * - In der RapidAPI-Doku nach dem passenden Artikel-/Parts-Endpoint suchen
   *   (z.B. "Search articles by OE", "Get articles by number" etc.)
   * - Pfad + Mapping unten anpassen.
   */
  async lookupParts(oem: string): Promise<TecDocPartResult> {
    if (!oem) {
      return {
        success: false,
        message: "OEM is required"
      };
    }

    try {
      // Platzhalter: Beispiel-Endpunkt; bitte anhand RapidAPI-Doku anpassen.
      const encoded = encodeURIComponent(oem);
      const path = `/artlookup/search-articles-by-article-no/lang-id/4/article-type/OENumber/article-no/${encoded}`;

      const result = await this.request("GET", path);

      // TODO: das genaue Mapping von result → parts anpassen
      const parts =
        result?.data ||
        result?.results ||
        result?.articles ||
        [];

      return {
        success: true,
        parts
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message ?? "Parts lookup failed"
      };
    }
  }
}

// Helper-Funktion, um eine Singleton-Instanz auf Basis der ENV zu erzeugen.
// Diese kannst du im oemService verwenden.
let defaultClient: TecDocClient | null = null;

export function getDefaultTecDocClient(): TecDocClient {
  if (!defaultClient) {
    const apiKey = process.env.RAPIDAPI_KEY || "";
    const baseUrl =
      process.env.TECDOC_BASE_URL || "https://tecdoc-catalog.p.rapidapi.com";
    const host =
      process.env.TECDOC_RAPIDAPI_HOST || "tecdoc-catalog.p.rapidapi.com";

    defaultClient = new TecDocClient(apiKey, baseUrl, host);
  }
  return defaultClient;
}
