export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { vehicleType, pricePerKm, originAddress, destinationAddress, routeType = 'fastest' } = req.body;
  if (!vehicleType || !pricePerKm || !originAddress || !destinationAddress)
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });

  try {
    // ── Geocodificação robusta para endereços brasileiros ──
    const geocode = async (address) => {
      const nom = async (q) => {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`;
        const r = await fetch(url, { headers: { 'User-Agent': 'CBS-Frete/1.0 (contato@cbs.com)' } });
        const d = await r.json();
        if (d && d.length > 0) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
        return null;
      };

      // 1) endereço completo
      let c = await nom(address);
      if (c) return c;

      // 2) via CEP (ViaCEP)
      const cepM = address.match(/\d{5}-?\d{3}/);
      if (cepM) {
        try {
          const cep = cepM[0].replace('-', '');
          const vr = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const vd = await vr.json();
          if (!vd.erro) {
            c = await nom(`${vd.bairro}, ${vd.localidade}, ${vd.uf}`);
            if (c) return c;
            c = await nom(`${vd.localidade}, ${vd.uf}, Brasil`);
            if (c) return c;
          }
        } catch {}
      }

      // 3) remover número e CEP
      const limpo = address
        .replace(/,?\s*\d{5}-?\d{3}/, '')
        .replace(/,\s*\d+\s*-/, ',')
        .trim();
      c = await nom(limpo);
      if (c) return c;

      // 4) só cidade + UF
      const m = address.match(/([A-Za-zÀ-ÿ\s]+)\s*[-,]\s*(SP|RJ|MG|BA|PR|RS|SC|GO|ES|CE|PE|AM|PA|MT|MS|RO|AC|RR|AP|TO|MA|PI|RN|PB|AL|SE|DF)/i);
      if (m) {
        c = await nom(`${m[1].trim()}, ${m[2]}, Brasil`);
        if (c) return c;
      }

      return null;
    };

    const [origin, dest] = await Promise.all([geocode(originAddress), geocode(destinationAddress)]);

    if (!origin) return res.status(400).json({ error: `Origem não encontrada: "${originAddress}". Tente incluir cidade e estado, ex: "Guarujá, SP"` });
    if (!dest)   return res.status(400).json({ error: `Destino não encontrado: "${destinationAddress}". Tente incluir cidade e estado, ex: "Salvador, BA"` });

    // ── Rota via OSRM com alternativas ──
    const coords = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
    // alternatives=true retorna até 3 rotas; a [0] é mais rápida, outros têm distância diferente
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`;

    let distance, duration, routeCoords;

    try {
      const osrmRes = await fetch(osrmUrl, {
        headers: { 'User-Agent': 'CBS-Frete/1.0' },
        signal: AbortSignal.timeout(8000)
      });
      const osrmData = await osrmRes.json();

      if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
        // routeType: 'fastest' → menor tempo (routes[0])
        //            'shortest' → menor distância (ordenar por distance)
        let routes = osrmData.routes;
        let route;
        if (routeType === 'shortest') {
          route = routes.slice().sort((a, b) => a.distance - b.distance)[0];
        } else {
          route = routes[0]; // OSRM já retorna por menor tempo primeiro
        }

        distance    = Math.round(route.distance / 1000 * 10) / 10;
        const secs  = route.duration;
        const h     = Math.floor(secs / 3600);
        const m     = Math.floor((secs % 3600) / 60);
        duration    = h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
        routeCoords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      } else {
        throw new Error('OSRM sem rota');
      }
    } catch (osrmErr) {
      console.error('OSRM error:', osrmErr.message);
      // Fallback Haversine
      const R = 6371;
      const dLat = (dest.lat - origin.lat) * Math.PI / 180;
      const dLng = (dest.lng - origin.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(origin.lat*Math.PI/180)*Math.cos(dest.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const distLinha = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
      // Estimar distância por estrada (~1.3x linha reta no Brasil)
      distance    = Math.round(distLinha * 1.3 * 10) / 10;
      const h     = Math.floor(distance / 80);
      const m     = Math.floor((distance % 80) / 80 * 60);
      duration    = h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
      routeCoords = [[origin.lat, origin.lng], [dest.lat, dest.lng]];
    }

    const basePrice   = parseFloat((distance * pricePerKm).toFixed(2));
    const tolEstimate = parseFloat((distance * 0.20).toFixed(2));
    const totalPrice  = parseFloat((basePrice + tolEstimate).toFixed(2));

    return res.status(200).json({
      id: Math.floor(Math.random() * 100000),
      vehicleType, routeType, distance, duration,
      basePrice, tolEstimate, totalPrice,
      originCoords:  { lat: origin.lat, lng: origin.lng },
      destCoords:    { lat: dest.lat,   lng: dest.lng },
      routeCoords,
      createdAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Erro interno ao calcular rota' });
  }
}
