export type EoLayerId = "eo-aerosol" | "eo-precipitation" | "eo-vegetation";

export interface EoTileConfig {
  id: EoLayerId;
  url: string;
  opacity: number;
  maxNativeZoom: number;
  attribution: string;
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
  const ndviDate = isoDateOffset(-10);

  return {
    "eo-aerosol": {
      id: "eo-aerosol",
      url: gibsTileUrl("MODIS_Combined_Value_Added_AOD", yesterday, "GoogleMapsCompatible_Level6"),
      opacity: 0.54,
      maxNativeZoom: 6,
      attribution: "NASA GIBS / MODIS"
    },
    "eo-precipitation": {
      id: "eo-precipitation",
      url: gibsTileUrl("IMERG_Precipitation_Rate", yesterday, "GoogleMapsCompatible_Level6"),
      opacity: 0.58,
      maxNativeZoom: 6,
      attribution: "NASA GIBS / GPM IMERG"
    },
    "eo-vegetation": {
      id: "eo-vegetation",
      url: gibsTileUrl("MODIS_Terra_NDVI_8Day", ndviDate),
      opacity: 0.6,
      maxNativeZoom: 9,
      attribution: "NASA GIBS / MODIS Terra"
    }
  };
}
