export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { vehicleType, pricePerKm, originAddress, destinationAddress } = req.body;

  if (!vehicleType || !pricePerKm || !originAddress || !destinationAddress) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  try {
    // 1. Geocodificar com Nominatim (URL correta com parâmetro q=)
    const geocode = async (address) => {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=br`;
      const r = await fetch(url, { headers: { 'User-Agent': 'CBS-Frete-Calculator/1.0' } });
      const data = await r.json();
      if (!data || data.length === 0) return null;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
    };

    const [origin, dest] = await Promise.all([
      geocode(originAddress),
      geocode(destinationAddress)
    ]);

    if (!origin || !dest) {
      return res.status(400).json({ error: 'Endereço não encontrado. Tente com cidade e estado. Ex: "Guarujá, SP"' });
    }

    // 2. Calcular rota real via OSRM (gratuito, usa OpenStreetMap)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
    const osrmRes = await fetch(osrmUrl);
    const osrmData = await osrmRes.json();

    let distance, duration, routeCoords;
    if (osrmData.code === 'Ok' && osrmData.routes.length > 0) {
      const route = osrmData.routes[0];
      distance = Math.round(route.distance / 1000 * 10) / 10; // metros → km
      const secs = route.duration;
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      duration = h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
      routeCoords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    } else {
      // Fallback Haversine
      const R = 6371;
      const dLat = (dest.lat - origin.lat) * Math.PI / 180;
      const dLng = (dest.lng - origin.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(origin.lat*Math.PI/180)*Math.cos(dest.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
      duration = Math.ceil(distance / 80) + 'h';
      routeCoords = [[origin.lat, origin.lng], [dest.lat, dest.lng]];
    }

    const basePrice   = parseFloat((distance * pricePerKm).toFixed(2));
    const tolEstimate = parseFloat((distance * 0.20).toFixed(2));
    const totalPrice  = parseFloat((basePrice + tolEstimate).toFixed(2));

    return res.status(200).json({
      id: Math.floor(Math.random() * 100000),
      vehicleType,
      distance,
      duration,
      basePrice,
      tolEstimate,
      totalPrice,
      originCoords:  { lat: origin.lat, lng: origin.lng },
      destCoords:    { lat: dest.lat,   lng: dest.lng },
      routeCoords,   // array de [lat,lng] da rota real
      createdAt: new Date().toISOString()
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno ao calcular rota' });
  }
}
