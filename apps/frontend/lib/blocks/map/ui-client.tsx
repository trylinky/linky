'use client';

import { MapBlockConfig, mapThemes } from '@trylinky/blocks';
import mapboxgl, { Map } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  throw Error('Mapbox access token not found in environment variables');
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export type Props = {
  className?: string;
} & MapBlockConfig;

export function MapboxMap({ className, mapTheme, coords }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapBoxRef = useRef<Map | null>(null);

  const mapBoxMapTheme = mapThemes[mapTheme] ?? mapThemes.STREETS.value;

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || !coords) return;

    const map = new mapboxgl.Map({
      container,
      style: mapBoxMapTheme.value,
      center: [coords.long, coords.lat],
      zoom: 12,
      interactive: false,
    });
    mapBoxRef.current = map;

    let timeoutId: number | undefined;
    const resizer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => map.resize(), 10);
    });
    resizer.observe(container);

    return () => {
      clearTimeout(timeoutId);
      resizer.disconnect();
      map.remove();
      mapBoxRef.current = null;
    };
  }, [coords, mapBoxMapTheme]);

  return (
    <div
      ref={mapContainerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
