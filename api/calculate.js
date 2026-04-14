// Handler simples para Vercel - sem dependências externas!
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { vehicleType, pricePerKm, originAddress, destinationAddress } = req.body;

    // Validação básica
    if (!vehicleType || !pricePerKm || !originAddress || !destinationAddress) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // CÁLCULO SIMPLES (sem fazer requisição para Nominatim agora)
    // Simulamos uma distância básica entre endereços
    const distance = Math.random() * 200 + 50; // Entre 50 e 250 km
    const basePrice = parseFloat((distance * pricePerKm).toFixed(2));
    const tolEstimate = parseFloat((distance * 0.20).toFixed(2)); // R$ 0.20/km
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
      createdAt: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
