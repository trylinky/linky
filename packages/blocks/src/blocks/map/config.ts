import * as Yup from 'yup';

export type MapThemes = 'STREETS' | 'SATELLITE' | 'DARK';

export const mapThemes: Record<
  MapThemes,
  {
    label: string;
    value: string;
  }
> = {
  STREETS: {
    label: 'Streets',
    value: 'mapbox://styles/mapbox/streets-v12',
  },
  SATELLITE: {
    label: 'Satellite',
    value: 'mapbox://styles/mapbox/satellite-v9',
  },
  DARK: {
    label: 'Dark',
    value: 'mapbox://styles/mapbox/dark-v11',
  },
};

export interface MapBlockConfig {
  coords: {
    long: number;
    lat: number;
  };
  mapTheme: MapThemes;
}

export const mapBlockDefaults: MapBlockConfig = {
  coords: {
    long: 103.8591065,
    lat: 1.2837575,
  },
  mapTheme: 'STREETS',
};

export const MapSchema = Yup.object().shape({
  coords: Yup.object().shape({
    long: Yup.number().required('Please provide a longitude'),
    lat: Yup.number().required('Please provide a latitude'),
  }),
  mapTheme: Yup.string().oneOf(Object.keys(mapThemes)),
});
