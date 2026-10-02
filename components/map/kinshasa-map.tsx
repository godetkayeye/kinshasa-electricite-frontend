'use client'

import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapLevel } from '@/lib/api/types'
import { KINSHASA, mapLevels, markerRadius, TILES } from '@/lib/map-config'

export type MapMarker = {
  key: string
  kind: 'commune' | 'quartier'
  name: string
  latitude: number
  longitude: number
  level: MapLevel
  outageReportsCount: number
}

export type MapFocus = { latitude: number; longitude: number; zoom: number }

/** Moves the map to the place selected in the search or in a list. */
function Focus({ focus }: { focus: MapFocus | null }) {
  const map = useMap()

  useEffect(() => {
    if (focus) map.flyTo([focus.latitude, focus.longitude], focus.zoom, { duration: 0.6 })
  }, [map, focus])

  return null
}

/**
 * Interactive map limited to Kinshasa. Each marker is an aggregated place
 * (a commune or a quartier), never a single report.
 *
 * This file imports Leaflet, which needs the browser: it is only loaded on
 * the client (see map-view.tsx).
 */
export default function KinshasaMap({ markers, selectedKey, focus, onSelect }: { markers: MapMarker[]; selectedKey: string | null; focus: MapFocus | null; onSelect: (key: string) => void }) {
  return (
    <MapContainer
      center={KINSHASA.center}
      zoom={KINSHASA.zoom}
      minZoom={KINSHASA.minZoom}
      maxZoom={KINSHASA.maxZoom}
      maxBounds={KINSHASA.bounds}
      maxBoundsViscosity={1}
      scrollWheelZoom
      className="z-0 h-full w-full"
    >
      <TileLayer url={TILES.url} attribution={TILES.attribution} bounds={KINSHASA.bounds} />
      <Focus focus={focus} />
      {/* Quartiers are drawn above the commune they belong to. */}
      {[...markers].sort((a, b) => (a.kind === b.kind ? b.outageReportsCount - a.outageReportsCount : a.kind === 'commune' ? -1 : 1)).map((marker) => {
        const level = mapLevels[marker.level]
        const selected = marker.key === selectedKey

        return (
          <CircleMarker
            key={marker.key}
            center={[marker.latitude, marker.longitude]}
            radius={markerRadius(marker.outageReportsCount, marker.kind)}
            pathOptions={{ color: selected ? '#0f172a' : level.stroke, weight: selected ? 4 : 2, fillColor: level.fill, fillOpacity: marker.level === 'none' ? 0.45 : 0.85 }}
            eventHandlers={{ click: () => onSelect(marker.key) }}
          >
            {/* A marker has a single tooltip: the number of reports when there are some (the level
                never depends on colour alone), otherwise the name of the place on hover. */}
            {marker.outageReportsCount > 0 ? (
              <Tooltip key="count" permanent interactive={false} direction="center" className="map-count" opacity={1}>
                <span style={{ color: level.text }}>{marker.outageReportsCount}</span>
              </Tooltip>
            ) : (
              <Tooltip key="name" direction="top" offset={[0, -8]}>{marker.name}</Tooltip>
            )}
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
