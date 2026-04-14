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

// Fix para markers do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function RouteMap({ origin, destination, originAddress, destinationAddress }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // Inicializar mapa
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([-10, -51], 4)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current)
    }

    // Limpar markers anteriores
    map.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.current!.removeLayer(layer)
      }
      if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
        map.current!.removeLayer(layer)
      }
    })

    if (origin) {
      const marker1 = L.marker([origin.lat, origin.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup('📍 Origem')
        .addTo(map.current!)
    }

    if (destination) {
      const marker2 = L.marker([destination.lat, destination.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup('🎯 Destino')
        .addTo(map.current!)
    }

    if (origin && destination) {
      // Desenhar linha entre pontos
      const polyline = L.polyline([[origin.lat, origin.lng], [destination.lat, destination.lng]], {
        color: '#ff9800',
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 5',
      }).addTo(map.current!)

      // Ajustar zoom para mostrar ambos os pontos
      const bounds = L.latLngBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]])
      map.current!.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [origin, destination])

  return (
    <div className="route-map-container">
      <div className="map-header">
        <h3>Mapa da Rota 🗺️</h3>
        {originAddress && destinationAddress && (
          <div className="route-info">
            <div className="location">
              <span className="dot origin">📍</span>
              <span className="address">{originAddress}</span>
            </div>
            <div className="arrow">→</div>
            <div className="location">
              <span className="dot destination">🎯</span>
              <span className="address">{destinationAddress}</span>
            </div>
          </div>
        )}
      </div>

      <div ref={mapContainer} className="map-container" />
    </div>
  )
}
