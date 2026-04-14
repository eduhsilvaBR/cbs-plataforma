const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

// Função para geocodificar endereço usando Nominatim (OpenStreetMap)
async function geocodeAddress(address) {
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
    console.error('Erro ao geocodificar:', error.message);
    return null;
  }
}

// Fórmula de Haversine para calcular distância
function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

// Rota de cálculo
app.post('/api/calculate', async (req, res) => {
  try {
    const { vehicleType, pricePerKm, originAddress, destinationAddress } = req.body;

    if (!vehicleType || !pricePerKm || !originAddress || !destinationAddress) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Geocodificar endereços
    const originCoords = await geocodeAddress(originAddress);
    const destCoords = await geocodeAddress(destinationAddress);

    if (!originCoords || !destCoords) {
      return res.status(400).json({ error: 'Não foi possível encontrar um ou ambos os endereços' });
    }

    // Calcular distância
    const distance = calculateHaversineDistance(
      originCoords.lat,
      originCoords.lng,
      destCoords.lat,
      destCoords.lng
    );

    // Calcular valores
    const basePrice = parseFloat((distance * pricePerKm).toFixed(2));
    const tolEstimate = parseFloat((distance * 0.20).toFixed(2)); // R$ 0.20 por km
    const totalPrice = parseFloat((basePrice + tolEstimate).toFixed(2));
    const duration = Math.ceil(distance / 100) + 'h';

    res.json({
      id: Math.floor(Math.random() * 100000),
      vehicleType,
      distance,
      basePrice,
      tolEstimate,
      totalPrice,
      duration,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro:', error.message);
    res.status(500).json({ error: 'Erro ao processar cálculo' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
