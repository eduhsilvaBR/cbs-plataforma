import { useMemo } from 'react'
import { GoogleMap, useLoadScript, Marker, Polyline } from '@react-google-maps/api'
import './RouteMap.css'

interface RouteMapProps {
  origin?: { lat: number; lng: number }
  destination?: { lat: number; lng: number }
  originAddress?: string
  destinationAddress?: string
}

export default function RouteMap({ origin, destination, originAddress, destinationAddress }: RouteMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  const center = useMemo(() => {
    if (origin && destination) {
      return {
        lat: (origin.lat + destination.lat) / 2,
        lng: (origin.lng + destination.lng) / 2,
      }
    }
    // Default to Brazil center
    return { lat: -10, lng: -51 }
  }, [origin, destination])

  if (!isLoaded) {
    return (
      <div className="route-map-container">
        <div className="map-placeholder">
          <p>📍 Carregando mapa...</p>
        </div>
      </div>
    )
  }

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

      <GoogleMap
        center={center}
        zoom={6}
        mapContainerClassName="map-container"
        options={{
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9ecef' }],
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f8f9fa' }],
            },
          ],
        }}
      >
        {origin && (
          <Marker
            position={origin}
            title="Origem"
            icon={{
              path: 'M-20,0a20,20 0 1,0 40,0a20,20 0 1,0 -40,0',
              fillColor: '#1565c0',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
              scale: 0.7,
            }}
          />
        )}

        {destination && (
          <Marker
            position={destination}
            title="Destino"
            icon={{
              path: 'M-20,0a20,20 0 1,0 40,0a20,20 0 1,0 -40,0',
              fillColor: '#4caf50',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
              scale: 0.7,
            }}
          />
        )}

        {origin && destination && (
          <Polyline
            path={[origin, destination]}
            options={{
              strokeColor: '#ff9800',
              strokeOpacity: 0.8,
              strokeWeight: 4,
              geodesic: true,
            }}
          />
        )}
      </GoogleMap>
    </div>
  )
}
