import axios from 'axios';
import { DistanceResult } from './types.js';

// Função para geocodificar endereço usando Nominatim (OpenStreetMap - GRATUITO)
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'CBS-Frete-Calculator',
      },
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat: parseFloat(lat), lng: parseFloat(lon) };
    }
    return null;
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    return null;
  }
};

// Fórmula de Haversine para calcular distância entre dois pontos (lat, lng)
const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Arredondar para 1 casa decimal
};

export const calculateDistance = async (
  origin: string,
  destination: string
): Promise<DistanceResult> => {
  try {
    // Geocodificar ambos os endereços usando Nominatim (GRATUITO)
    const originCoords = await geocodeAddress(origin);
    const destinationCoords = await geocodeAddress(destination);

    if (!originCoords || !destinationCoords) {
      console.warn('⚠️ Não foi possível geocodificar os endereços, usando estimativa');
      return estimateDistance(origin, destination);
    }

    // Calcular distância usando Haversine
    const distance = calculateHaversineDistance(
      originCoords.lat,
      originCoords.lng,
      destinationCoords.lat,
      destinationCoords.lng
    );

    // Estimar duração: 1 hora por 100km aproximadamente
    const durationHours = Math.ceil(distance / 100);
    const duration = durationHours > 1 ? `${durationHours}h` : '1h';

    return {
      distance,
      duration
    };
  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    return estimateDistance(origin, destination);
  }
};

// Estimativa simples como fallback
const estimateDistance = (origin: string, destination: string): DistanceResult => {
  return {
    distance: 50, // 50 km padrão
    duration: '1h'
  };
};

// Função para estimar pedágio (valores aproximados BR)
export const estimateToll = (distanceKm: number): number => {
  // Estimativa simples baseada em:
  // - Rodovias federais BR cobram em média R$ 0.15-0.30 por km
  // - Rodovias estaduais variam bastante
  // Vou usar uma média de R$ 0.20 por km para cálculo estimado

  const tolPerKm = 0.20;
  const estimatedToll = distanceKm * tolPerKm;

  // Arredondar para 2 casas decimais
  return Math.round(estimatedToll * 100) / 100;
};
