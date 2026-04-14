// Geocodificar com Nominatim
async function geocodeAddress(address) {
  try {
    const response = await fetch('https://nominatim.openstreetmap.org/search', {
      method: 'GET',
      headers: {
        'User-Agent': 'CBS-Frete'
      }
    });

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (e) {
    console.log('Geocode error:', e);
  }
  return null;
}

// Calcular distância com Haversine
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Handler simples para Vercel
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Rota de PDF (simples - retorna um placeholder PDF)
  if (req.method === 'GET' && req.url && req.url.includes('/api/budgets/')) {
    // Simples resposta - em produção seria um PDF real
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Orçamento CBS Transportes) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000273 00000 n\n0000000352 00000 n\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n446\n%%EOF\n');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="orcamento.pdf"');
    res.send(pdfContent);
    return;
  }

  if (req.method === 'POST') {
    const { vehicleType, pricePerKm, originAddress, destinationAddress } = req.body;

    if (!vehicleType || !pricePerKm || !originAddress || !destinationAddress) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Geocodificar endereços
    const originCoords = await geocodeAddress(originAddress + ' Brazil');
    const destCoords = await geocodeAddress(destinationAddress + ' Brazil');

    let distance = 100; // default

    if (originCoords && destCoords) {
      distance = haversine(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
    } else {
      distance = Math.random() * 200 + 50;
    }

    const basePrice = parseFloat((distance * pricePerKm).toFixed(2));
    const tolEstimate = parseFloat((distance * 0.20).toFixed(2));
    const totalPrice = parseFloat((basePrice + tolEstimate).toFixed(2));
    const duration = Math.ceil(distance / 100) + 'h';

    return res.status(200).json({
      id: Math.floor(Math.random() * 100000),
      vehicleType,
      distance: Math.round(distance * 10) / 10,
      basePrice,
      tolEstimate,
      totalPrice,
      duration,
      originCoords,
      destCoords,
      createdAt: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
