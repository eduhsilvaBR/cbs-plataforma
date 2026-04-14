import axios from 'axios';
import { DistanceResult } from './types.js';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export const calculateDistance = async (
  origin: string,
  destination: string
): Promise<DistanceResult> => {
  // Se não tiver API key, fazer uma estimativa simples baseada no padrão
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ GOOGLE_MAPS_API_KEY não configurada, usando estimativa');
    return estimateDistance(origin, destination);
  }

  try {
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    const params = {
      origins: origin,
      destinations: destination,
      key: GOOGLE_MAPS_API_KEY,
      language: 'pt-BR'
    };

    const response = await axios.get(url, { params });

    if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
      const element = response.data.rows[0].elements[0];
      const distanceInMeters = element.distance.value;
      const distanceInKm = distanceInMeters / 1000;
      const duration = element.duration.text;

      return {
        distance: Math.round(distanceInKm * 10) / 10, // Arredondar para 1 casa decimal
        duration
      };
    } else {
      console.error('Erro na resposta do Google Maps:', response.data.status);
      return estimateDistance(origin, destination);
    }
  } catch (error) {
    console.error('Erro ao chamar Google Maps:', error);
    return estimateDistance(origin, destination);
  }
};

// Estimativa simples se Google Maps falhar
const estimateDistance = (origin: string, destination: string): DistanceResult => {
  // Estimativa bem básica - na prática você usaria a API real
  // Apenas para demonstração quando não houver API key
  return {
    distance: 50, // 50 km padrão
    duration: 'Estimado'
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
