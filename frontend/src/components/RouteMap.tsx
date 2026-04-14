import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './RouteMap.css'

interface RouteMapProps {
  origin?:      { lat: number; lng: number }
  destination?: { lat: number; lng: number }
  originAddress?:      string
  destinationAddress?: string
  routeCoords?: [number, number][]
}

export default function RouteMap({ origin, destination, originAddress, destinationAddress, routeCoords }: RouteMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapObj      = useRef<L.Map | null>(null)
  const markersRef  = useRef<L.Marker[]>([])
  const polyRef     = useRef<L.Polyline | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    if (!mapObj.current) {
      mapObj.current = L.map(mapRef.current, { attributionControl: false, zoomControl: true })
        .setView([-15, -50], 4)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })
        .addTo(mapObj.current)
    }

    // Limpar
    markersRef.current.forEach(m => mapObj.current!.removeLayer(m))
    markersRef.current = []
    if (polyRef.current) { mapObj.current.removeLayer(polyRef.current); polyRef.current = null }

    const blueIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41]
    })
    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41]
    })

    if (origin) {
      const m = L.marker([origin.lat, origin.lng], { icon: blueIcon })
        .bindPopup(`<b>Origem</b><br>${originAddress || ''}`)
      m.addTo(mapObj.current!)
      markersRef.current.push(m)
    }

    if (destination) {
      const m = L.marker([destination.lat, destination.lng], { icon: redIcon })
        .bindPopup(`<b>Destino</b><br>${destinationAddress || ''}`)
      m.addTo(mapObj.current!)
      markersRef.current.push(m)
    }

    if (origin && destination) {
      const coords: [number,number][] = routeCoords && routeCoords.length > 2
        ? routeCoords
        : [[origin.lat, origin.lng], [destination.lat, destination.lng]]

      polyRef.current = L.polyline(coords, {
        color: '#e63946', weight: 5, opacity: 0.9
      }).addTo(mapObj.current!)

      mapObj.current!.fitBounds(polyRef.current.getBounds(), { padding: [50, 50] })
    }
  }, [origin, destination, routeCoords])

  return (
    <div className="route-map-container">
      <div className="map-header">
        <h3>Mapa da Rota</h3>
        {originAddress && (
          <div className="route-info">
            <div className="location origin-location">
              <span className="location-icon">📍</span>
              <div className="location-details">
                <span className="location-label">Origem</span>
                <span className="location-address">{originAddress}</span>
              </div>
            </div>
            {destinationAddress && (
              <>
                <div className="route-arrow">↓</div>
                <div className="location dest-location">
                  <span className="location-icon">🎯</span>
                  <div className="location-details">
                    <span className="location-label">Destino</span>
                    <span className="location-address">{destinationAddress}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div ref={mapRef} className="map-container" />
    </div>
  )
}
