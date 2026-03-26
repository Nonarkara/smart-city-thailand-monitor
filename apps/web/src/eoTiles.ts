export type EoLayerId =
  | "eo-aerosol"
  | "eo-precipitation"
  | "eo-vegetation"
  | "eo-soil-moisture"
  | "eo-cloud-phase"
  | "eo-snow-cover"
  | "eo-fire-thermal"
  | "eo-chlorophyll";

export interface EoTileConfig {
  id: EoLayerId;
  url: string;
  /** Fallback URL using an older date if the primary date has no tiles yet */
  fallbackUrl?: string;
  opacity: number;
  maxNativeZoom: number;
  attribution: string;
  /** Source agency / program for display in legend */
  source?: string;
  /** GIBS WMTS product name for STAC discovery */
  gibsProductId?: string;
  /** NASA CMR STAC collection concept ID */
  stacCollectionId?: string;
}

/**
 * STAC-first tile discovery. Queries the backend proxy which checks NASA CMR-STAC
 * for the latest available date of a GIBS product. Returns a config with verified
 * tile URLs, or null if STAC is unavailable (caller should fall back to static config).
 *
 * Best practice per STAC spec: discovery first, then partial COG reads.
 * See: stacspec.org, cmr.earthdata.nasa.gov/stac
 */
export async function fetchStacVerifiedTileUrl(
  layerId: EoLayerId,
  apiBase: string
): Promise<{ url: string; fallbackUrl: string } | null> {
  try {
    const response = await fetch(`${apiBase}/api/satellite/stac-tiles?layer=${layerId}`, {
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { url?: string; fallbackUrl?: string; source?: string };
    if (data.url) {
      return { url: data.url, fallbackUrl: data.fallbackUrl ?? data.url };
    }
  } catch {
    // STAC proxy unreachable — caller uses static fallback
  }
  return null;
}

const gibsTileUrl = (
  layer: string,
  date: string,
  tileMatrix = "GoogleMapsCompatible_Level9",
  format = "png"
) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/${tileMatrix}/{z}/{y}/{x}.${format}`;

function isoDateOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getEoTileConfigs(): Record<EoLayerId, EoTileConfig> {
  const yesterday = isoDateOffset(-1);
  const twoDaysAgo = isoDateOffset(-2);
  const ndviDate = isoDateOffset(-10);

  return {
    /* ── Core EO layers ── */
    "eo-aerosol": {
      id: "eo-aerosol",
      url: gibsTileUrl("MODIS_Combined_Value_Added_AOD", yesterday, "GoogleMapsCompatible_Level6"),
      fallbackUrl: gibsTileUrl("MODIS_Combined_Value_Added_AOD", twoDaysAgo, "GoogleMapsCompatible_Level6"),
      opacity: 0.54,
      maxNativeZoom: 6,
      attribution: "NASA GIBS / MODIS",
      source: "NASA MODIS (USA)",
      gibsProductId: "MODIS_Combined_Value_Added_AOD",
      stacCollectionId: "C1443528505-LAADS"
    },
    "eo-precipitation": {
      id: "eo-precipitation",
      url: gibsTileUrl("IMERG_Precipitation_Rate", yesterday, "GoogleMapsCompatible_Level6"),
      fallbackUrl: gibsTileUrl("IMERG_Precipitation_Rate", twoDaysAgo, "GoogleMapsCompatible_Level6"),
      opacity: 0.58,
      maxNativeZoom: 6,
      attribution: "NASA GIBS / GPM IMERG",
      source: "NASA-JAXA GPM (USA/Japan)",
      gibsProductId: "IMERG_Precipitation_Rate",
      stacCollectionId: "C1598621093-GES_DISC"
    },
    "eo-vegetation": {
      id: "eo-vegetation",
      url: gibsTileUrl("MODIS_Terra_NDVI_8Day", ndviDate),
      fallbackUrl: gibsTileUrl("MODIS_Terra_NDVI_8Day", isoDateOffset(-18)),
      opacity: 0.6,
      maxNativeZoom: 9,
      attribution: "NASA GIBS / MODIS Terra",
      source: "NASA MODIS Terra (USA)"
    },

    /* ── Extended international EO layers ── */

    /* Soil moisture - SMAP */
    "eo-soil-moisture": {
      id: "eo-soil-moisture",
      url: gibsTileUrl("SMAP_L3_Active_Passive_Soil_Moisture", twoDaysAgo, "GoogleMapsCompatible_Level6"),
      fallbackUrl: gibsTileUrl("SMAP_L3_Active_Passive_Soil_Moisture", isoDateOffset(-4), "GoogleMapsCompatible_Level6"),
      opacity: 0.5,
      maxNativeZoom: 6,
      attribution: "NASA GIBS / SMAP",
      source: "NASA SMAP (USA)"
    },

    /* Cloud phase infrared - MODIS Aqua */
    "eo-cloud-phase": {
      id: "eo-cloud-phase",
      url: gibsTileUrl("MODIS_Aqua_Cloud_Phase_Infrared_Day", yesterday, "GoogleMapsCompatible_Level6"),
      fallbackUrl: gibsTileUrl("MODIS_Aqua_Cloud_Phase_Infrared_Day", twoDaysAgo, "GoogleMapsCompatible_Level6"),
      opacity: 0.42,
      maxNativeZoom: 6,
      attribution: "NASA GIBS / MODIS Aqua",
      source: "NASA MODIS Aqua (USA)"
    },

    /* Snow/ice cover - MODIS Terra */
    "eo-snow-cover": {
      id: "eo-snow-cover",
      url: gibsTileUrl("MODIS_Terra_NDSI_Snow_Cover", yesterday, "GoogleMapsCompatible_Level8"),
      fallbackUrl: gibsTileUrl("MODIS_Terra_NDSI_Snow_Cover", twoDaysAgo, "GoogleMapsCompatible_Level8"),
      opacity: 0.55,
      maxNativeZoom: 8,
      attribution: "NASA GIBS / MODIS Terra",
      source: "NASA MODIS Terra (USA)"
    },

    /* Thermal watch - MODIS Aqua brightness temperature */
    "eo-fire-thermal": {
      id: "eo-fire-thermal",
      url: gibsTileUrl("MODIS_Aqua_Brightness_Temp_Band31_Day", yesterday, "GoogleMapsCompatible_Level7"),
      fallbackUrl: gibsTileUrl("MODIS_Aqua_Brightness_Temp_Band31_Day", twoDaysAgo, "GoogleMapsCompatible_Level7"),
      opacity: 0.62,
      maxNativeZoom: 7,
      attribution: "NASA GIBS / MODIS Aqua",
      source: "NASA MODIS Aqua (USA)"
    },

    /* Ocean chlorophyll concentration - MODIS Aqua */
    "eo-chlorophyll": {
      id: "eo-chlorophyll",
      url: gibsTileUrl("MODIS_Aqua_L2_Chlorophyll_A", yesterday, "GoogleMapsCompatible_Level7"),
      fallbackUrl: gibsTileUrl("MODIS_Aqua_L2_Chlorophyll_A", twoDaysAgo, "GoogleMapsCompatible_Level7"),
      opacity: 0.48,
      maxNativeZoom: 7,
      attribution: "NASA GIBS / MODIS Aqua",
      source: "NASA MODIS Aqua (USA)"
    }
  };
}

/**
 * International EO data source registry.
 * These are publicly accessible satellite data programs from agencies worldwide.
 * Tile endpoints listed here are either free/open or require registration.
 *
 * ── Russia (Roscosmos / Roshydromet) ──
 * - Electro-L geostationary: Full-disk Earth imagery every 30 min
 * - Meteor-M: Polar-orbiting weather satellite (LRPT data freely receivable)
 * - ScanEx: Commercial EO data aggregator with some public previews
 *   FIRMS integration: Uses NASA VIIRS data for fire monitoring in Siberia
 *
 * ── China (CMA / CNSA) ──
 * - FengYun-4A/B: Geostationary meteorological, 1-min rapid scan
 *   Tiles available via CMA Satellite Data Service (registration required)
 * - GaoFen: High-resolution (sub-meter) optical series
 * - HuanJing (HJ-1A/1B): Environment/disaster monitoring constellation
 *
 * ── India (ISRO / IMD) ──
 * - INSAT-3D/3DR: Geostationary meteorological (Indian Ocean coverage)
 * - Resourcesat-2: Medium-resolution land observation
 * - Bhuvan portal: ISRO's public geoportal with tile services
 *   URL pattern: https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms
 * - MOSDAC: Meteorological data archive with API access
 *
 * ── Japan (JAXA) ── [Already integrated via JAXA Earth API]
 * - Himawari-8/9: Geostationary (JMA), rapid scan every 2.5 min
 * - ALOS-2 PALSAR: L-band SAR for ground deformation/forest
 * - GSMaP: Global rainfall map (integrated as jaxa-rainfall layer)
 *
 * ── South Korea (KMA / KARI) ──
 * - GK-2A: Geostationary meteorological (East Asia rapid scan)
 * - Arirang/KOMPSAT: High-resolution optical + SAR
 *
 * ── Europe (ESA / EUMETSAT) ── [Copernicus already integrated]
 * - Sentinel-1/2/3/5P via Copernicus Data Space
 * - Meteosat Third Generation: European geostationary weather
 *
 * Integration strategy: NASA GIBS provides standardized tile access to data
 * from many international instruments (including MODIS, VIIRS, GPM, SMAP).
 * The GPM IMERG precipitation product, for instance, incorporates data from
 * JAXA, CMA FengYun, ISRO INSAT, EUMETSAT, and KARI instruments.
 * This means many "NASA GIBS" layers already represent multi-agency
 * international data fusion.
 */
export const internationalEoRegistry = {
  russia: {
    agency: "Roscosmos / Roshydromet",
    instruments: ["Electro-L", "Meteor-M", "Kanopus-V"],
    publicAccess: "Limited - FIRMS fire data via NASA VIIRS integration",
    tileReady: false
  },
  china: {
    agency: "CMA / CNSA",
    instruments: ["FengYun-4A", "FengYun-4B", "GaoFen", "HuanJing"],
    publicAccess: "Registration required at satellite.nsmc.org.cn",
    tileReady: false
  },
  india: {
    agency: "ISRO / IMD",
    instruments: ["INSAT-3D", "INSAT-3DR", "Resourcesat-2", "Cartosat"],
    publicAccess: "Bhuvan portal: bhuvan.nrsc.gov.in (free registration)",
    tileReady: false
  },
  japan: {
    agency: "JAXA / JMA",
    instruments: ["Himawari-8/9", "ALOS-2", "GCOM-W"],
    publicAccess: "Integrated via JAXA Earth API (jaxa-rainfall layer)",
    tileReady: true
  },
  korea: {
    agency: "KMA / KARI",
    instruments: ["GK-2A", "KOMPSAT-5/6/7"],
    publicAccess: "nmsc.kma.go.kr (registration required for API)",
    tileReady: false
  },
  europe: {
    agency: "ESA / EUMETSAT",
    instruments: ["Sentinel-1/2/3/5P", "Meteosat-12", "Aeolus"],
    publicAccess: "Integrated via Copernicus Data Space + NASA GIBS",
    tileReady: true
  }
} as const;
