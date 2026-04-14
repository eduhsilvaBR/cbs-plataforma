import { useState, useEffect } from 'react'
import apiClient from '../utils/api'
import RouteMap from './RouteMap'
import './Calculator.css'

interface Result {
  id: number
  vehicleType: string
  distance: number
  duration: string
  basePrice: number
  tolEstimate: number
  totalPrice: number
  originCoords?: { lat: number; lng: number }
  destCoords?:   { lat: number; lng: number }
  routeCoords?:  [number, number][]
}

export default function Calculator() {
  const [vehicleType, setVehicleType]   = useState<'MUNK' | 'PRANCHA'>('MUNK')
  const [pricePerKm, setPricePerKm]     = useState('5.50')
  const [fuelPrice, setFuelPrice]       = useState('6.50')
  const [consumption, setConsumption]   = useState('8')
  const [origin, setOrigin]             = useState('')
  const [destination, setDestination]   = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [result, setResult]             = useState<Result | null>(null)
  const [fuelCost, setFuelCost]         = useState(0)

  const [originCoords, setOriginCoords]           = useState<{lat:number;lng:number}|null>(null)
  const [destinationCoords, setDestinationCoords] = useState<{lat:number;lng:number}|null>(null)
  const [routeCoords, setRouteCoords]             = useState<[number,number][]|undefined>(undefined)

  // Geocodificar ao digitar (debounce 800ms) para preview no mapa
  useEffect(() => {
    if (!origin && !destination) return
    const t = setTimeout(async () => {
      const geocode = async (addr: string) => {
        if (!addr) return null
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1&countrycodes=br`, {
            headers: { 'User-Agent': 'CBS-Frete' }
          })
          const d = await r.json()
          if (d && d.length > 0) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) }
        } catch {}
        return null
      }
      if (origin)      { const c = await geocode(origin);      if (c) setOriginCoords(c) }
      if (destination) { const c = await geocode(destination); if (c) setDestinationCoords(c) }
    }, 800)
    return () => clearTimeout(t)
  }, [origin, destination])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/api/calculate', {
        vehicleType,
        pricePerKm: parseFloat(pricePerKm),
        originAddress: origin,
        destinationAddress: destination,
      })
      const data: Result = res.data
      setResult(data)
      if (data.originCoords) setOriginCoords(data.originCoords)
      if (data.destCoords)   setDestinationCoords(data.destCoords)
      if (data.routeCoords)  setRouteCoords(data.routeCoords)

      const fuel = (data.distance / parseFloat(consumption)) * parseFloat(fuelPrice)
      setFuelCost(parseFloat(fuel.toFixed(2)))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao calcular. Verifique os endereços.')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    if (!result) return
    const content = `CBS TRANSPORTES NÁUTICOS
Orçamento #${String(result.id).padStart(6,'0')}

Veículo: ${result.vehicleType}
Origem:  ${origin}
Destino: ${destination}

Distância:   ${result.distance} km
Duração:     ${result.duration}

Frete Base:        R$ ${result.basePrice.toFixed(2)}
Pedágio Estimado:  R$ ${result.tolEstimate.toFixed(2)}
Combustível:       R$ ${fuelCost.toFixed(2)}
─────────────────────────────
TOTAL:             R$ ${(result.totalPrice + fuelCost).toFixed(2)}

Gerado em: ${new Date().toLocaleString('pt-BR')}
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `orcamento-cbs-${result.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="calculator-container">

      {/* Mapa fullscreen atrás */}
      <div className="map-fullscreen">
        <RouteMap
          origin={originCoords || undefined}
          destination={destinationCoords || undefined}
          originAddress={origin}
          destinationAddress={destination}
          routeCoords={routeCoords}
        />
      </div>

      {/* Card flutuante à esquerda */}
      <div className="floating-card">

        {!result ? (
          <>
            <p className="card-title">Calculadora de Frete</p>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleCalculate}>

              {/* Campos de endereço */}
              <div className="address-inputs">
                <div className="address-field">
                  <span className="addr-icon">📍</span>
                  <input
                    type="text"
                    placeholder="Endereço de origem"
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    required
                  />
                </div>
                <div className="address-field">
                  <span className="addr-icon">🎯</span>
                  <input
                    type="text"
                    placeholder="Endereço de destino"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Combustível e Consumo */}
              <div className="options-row">
                <div className="option-input">
                  <label>Combustível (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={fuelPrice}
                    onChange={e => setFuelPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="option-input">
                  <label>Consumo (km/l)</label>
                  <input
                    type="number" step="0.1" min="0.1"
                    value={consumption}
                    onChange={e => setConsumption(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Valor por km */}
              <div className="options-row" style={{gridTemplateColumns:'1fr'}}>
                <div className="option-input">
                  <label>Valor por km (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={pricePerKm}
                    onChange={e => setPricePerKm(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Seletor de veículo */}
              <div className="vehicle-row">
                <button type="button" className={`vehicle-btn ${vehicleType==='MUNK'?'active':''}`} onClick={() => setVehicleType('MUNK')}>
                  <span className="vicon">🏗️</span> MUNK
                </button>
                <button type="button" className={`vehicle-btn ${vehicleType==='PRANCHA'?'active':''}`} onClick={() => setVehicleType('PRANCHA')}>
                  <span className="vicon">🚛</span> PRANCHA
                </button>
              </div>

              <button type="submit" className="btn-calcular" disabled={loading}>
                {loading ? '⏳ Calculando rota...' : '🚚 Calcular Frete'}
              </button>

            </form>
          </>
        ) : (
          <>
            {/* Logo + Título */}
            <div className="result-logo-header">
              <img src="/logo cbs.png" alt="CBS" />
              <h2>Resultado do Orçamento</h2>
            </div>

            {/* Informações */}
            <div className="result-rows">
              <div className="result-row">
                <span className="rl">Orçamento #</span>
                <span className="rv">{String(result.id).padStart(6,'0')}</span>
              </div>
              <div className="result-row">
                <span className="rl">Veículo</span>
                <span className="rv">{result.vehicleType}</span>
              </div>
              <div className="result-row">
                <span className="rl">Origem</span>
                <span className="rv small">{origin}</span>
              </div>
              <div className="result-row">
                <span className="rl">Destino</span>
                <span className="rv small">{destination}</span>
              </div>
              <div className="result-row">
                <span className="rl">Distância</span>
                <span className="rv">{result.distance} km</span>
              </div>
              <div className="result-row">
                <span className="rl">Tempo Est.</span>
                <span className="rv">{result.duration}</span>
              </div>
            </div>

            {/* Resumo financeiro */}
            <div className="summary-box">
              <div className="summary-line">
                <span>Frete Base</span>
                <span>R$ {result.basePrice.toFixed(2)}</span>
              </div>
              <div className="summary-line">
                <span>Pedágio Estimado</span>
                <span>R$ {result.tolEstimate.toFixed(2)}</span>
              </div>
              <div className="summary-line">
                <span>Custo de Combustível</span>
                <span>R$ {fuelCost.toFixed(2)}</span>
              </div>
              <div className="summary-total">
                <span>TOTAL</span>
                <span>R$ {(result.totalPrice + fuelCost).toFixed(2)}</span>
              </div>
            </div>

            {/* Botões */}
            <div className="action-btns">
              <button className="btn-pdf" onClick={downloadPDF}>
                📄 Baixar PDF
              </button>
              <button className="btn-novo" onClick={() => { setResult(null); setRouteCoords(undefined) }}>
                ← Novo Cálculo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
