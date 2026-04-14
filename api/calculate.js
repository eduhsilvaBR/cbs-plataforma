// API: só geocodifica e calcula preço. OSRM é chamado pelo browser.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { vehicleType, originAddress, destinationAddress } = req.body;
  if (!vehicleType || !originAddress || !destinationAddress)
    return res.status(400).json({ error: 'Preencha todos os campos' });

  const nom = async (q) => {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`,
      { headers: { 'User-Agent': 'CBS-Transportes/1.0' } }
    );
    const d = await r.json();
    if (d && d.length > 0) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
    return null;
  };

  const geocode = async (address) => {
    let c = await nom(address);
    if (c) return c;
    // via CEP
    const cepM = address.match(/\d{5}-?\d{3}/);
    if (cepM) {
      try {
        const cep = cepM[0].replace('-', '');
        const vd = await (await fetch(`https://viacep.com.br/ws/${cep}/json/`)).json();
        if (!vd.erro) {
          c = await nom(`${vd.logradouro}, ${vd.localidade}, ${vd.uf}`);
          if (c) return c;
          c = await nom(`${vd.localidade}, ${vd.uf}`);
          if (c) return c;
        }
      } catch {}
    }
    // remove número e CEP
    const limpo = address.replace(/,?\s*\d{5}-?\d{3}/, '').replace(/,\s*\d+\s*-/, ',').trim();
    c = await nom(limpo);
    if (c) return c;
    // só cidade-UF
    const m = address.match(/([A-Za-zÀ-ÿ\s]+)\s*[-,]\s*(SP|RJ|MG|BA|PR|RS|SC|GO|ES|CE|PE|AM|PA|MT|MS|RO|AC|RR|AP|TO|MA|PI|RN|PB|AL|SE|DF)/i);
    if (m) { c = await nom(`${m[1].trim()}, ${m[2]}`); if (c) return c; }
    return null;
  };

  try {
    const [origin, dest] = await Promise.all([geocode(originAddress), geocode(destinationAddress)]);
    if (!origin) return res.status(400).json({ error: `Origem não encontrada: "${originAddress}". Tente: "Guarujá, SP"` });
    if (!dest)   return res.status(400).json({ error: `Destino não encontrado: "${destinationAddress}". Tente: "Salvador, BA"` });

    return res.status(200).json({
      originCoords: { lat: origin.lat, lng: origin.lng },
      destCoords:   { lat: dest.lat,   lng: dest.lng },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro: ' + err.message });
  }
}
