import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './RouteMap.css'

interface RouteMapProps {
  origin?: { lat: number; lng: number }
  destination?: { lat: number; lng: number }
  originAddress?: string
  destinationAddress?: string
}

export default function RouteMap({ origin, destination, originAddress, destinationAddress }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // Inicializar mapa uma vez
    if (!map.current) {
      map.current = L.map(mapContainer.current, {
        attributionControl: false,
      }).setView([-10, -51], 4)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map.current)
    }

    // Limpar markers anteriores
    markersRef.current.forEach((marker) => map.current!.removeLayer(marker))
    markersRef.current = []

    if (polylineRef.current) {
      map.current.removeLayer(polylineRef.current)
      polylineRef.current = null
    }

    // Adicionar marker de origem
    if (origin && map.current) {
      const marker = L.marker([origin.lat, origin.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      }).bindPopup('📍 Origem')

      map.current.addLayer(marker)
      markersRef.current.push(marker)
    }

    // Adicionar marker de destino
    if (destination && map.current) {
      const marker = L.marker([destination.lat, destination.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      }).bindPopup('🎯 Destino')

      map.current.addLayer(marker)
      markersRef.current.push(marker)
    }

    // Desenhar linha e ajustar zoom
    if (origin && destination && map.current) {
      polylineRef.current = L.polyline(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        {
          color: '#e63946',
          weight: 5,
          opacity: 0.95,
          dashArray: '0',
        }
      ).addTo(map.current)

      const bounds = L.latLngBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]])
      map.current.fitBounds(bounds, { padding: [80, 80] })
    }
  }, [origin, destination])

  return (
    <div className="route-map-container">
      <div className="map-header">
        <h3>Mapa da Rota</h3>
        {originAddress && destinationAddress && (
          <div className="route-info">
            <div className="location origin-location">
              <span className="location-icon">📍</span>
              <div className="location-details">
                <span className="location-label">Origem</span>
                <span className="location-address">{originAddress}</span>
              </div>
            </div>
            <div className="route-arrow">↓</div>
            <div className="location dest-location">
              <span className="location-icon">🎯</span>
              <div className="location-details">
                <span className="location-label">Destino</span>
                <span className="location-address">{destinationAddress}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={mapContainer} className="map-container" />
    </div>
  )
}
