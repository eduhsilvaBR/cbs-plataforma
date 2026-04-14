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
  routeType: string
  isRealRoute: boolean
  originCoords?: { lat: number; lng: number }
  destCoords?:   { lat: number; lng: number }
  routeCoords?:  [number, number][]
}

export default function Calculator() {
  const [vehicleType, setVehicleType] = useState<'MUNK' | 'PRANCHA'>('MUNK')
  const [routeType,   setRouteType]   = useState<'fastest' | 'shortest'>('fastest')
  const [fuelPrice,   setFuelPrice]   = useState('6.50')
  const [consumption, setConsumption] = useState('8')
  const [origin,      setOrigin]      = useState('')
  const [destination, setDestination] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [result,      setResult]      = useState<Result | null>(null)
  const [fuelCost,    setFuelCost]    = useState(0)

  const [originCoords,      setOriginCoords]      = useState<{lat:number;lng:number}|undefined>()
  const [destinationCoords, setDestinationCoords] = useState<{lat:number;lng:number}|undefined>()
  const [routeCoords,       setRouteCoords]       = useState<[number,number][]|undefined>()

  // Preview no mapa enquanto digita (debounce 900ms)
  useEffect(() => {
    if (!origin && !destination) return
    const t = setTimeout(async () => {
      const geo = async (addr: string) => {
        if (!addr) return undefined
        try {
          const cepM = addr.match(/\d{5}-?\d{3}/)
          if (cepM) {
            const cep = cepM[0].replace('-', '')
            const vd = await (await fetch(`https://viacep.com.br/ws/${cep}/json/`)).json()
            if (!vd.erro) addr = `${vd.localidade}, ${vd.uf}, Brasil`
          }
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1&countrycodes=br`,
            { headers: { 'User-Agent': 'CBS-Frete' } }
          )
          const d = await r.json()
          if (d && d.length > 0) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) }
        } catch {}
        return undefined
      }
      if (origin)      setOriginCoords(await geo(origin))
      if (destination) setDestinationCoords(await geo(destination))
    }, 900)
    return () => clearTimeout(t)
  }, [origin, destination])

  const doCalculate = async (orig: string, dest: string) => {
    setLoading(true); setError('')
    try {
      const res = await apiClient.post('/api/calculate', {
        vehicleType,
        pricePerKm: vehicleType === 'MUNK' ? 5.50 : 3.50,
        originAddress: orig,
        destinationAddress: dest,
        routeType,
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
    } finally { setLoading(false) }
  }

  const handleCalculate = (e: React.FormEvent) => { e.preventDefault(); doCalculate(origin, destination) }

  // Troca origem ↔ destino e recalcula
  const handleVolta = () => {
    const novaOrigem = destination
    const novoDestino = origin
    setOrigin(novaOrigem)
    setDestination(novoDestino)
    setOriginCoords(destinationCoords)
    setDestinationCoords(originCoords)
    setResult(null); setRouteCoords(undefined)
    doCalculate(novaOrigem, novoDestino)
  }

  const downloadPDF = () => {
    if (!result) return
    const txt = `CBS TRANSPORTES NÁUTICOS\nOrçamento #${String(result.id).padStart(6,'0')}\n\nVeículo: ${result.vehicleType}\nTipo de Rota: ${routeType==='fastest'?'Mais Rápida':'Mais Curta'}\nOrigem:  ${origin}\nDestino: ${destination}\n\nDistância: ${result.distance} km\nDuração:   ${result.duration}\n\nFrete Base:       R$ ${result.basePrice.toFixed(2)}\nPedágio Est.:     R$ ${result.tolEstimate.toFixed(2)}\nCombustível:      R$ ${fuelCost.toFixed(2)}\n──────────────────────────\nTOTAL:            R$ ${(result.totalPrice+fuelCost).toFixed(2)}\n\n${new Date().toLocaleString('pt-BR')}`
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })),
      download: `orcamento-cbs-${result.id}.txt`
    })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const resetar = () => { setResult(null); setRouteCoords(undefined) }

  return (
    <div className="calculator-container">
      <div className="map-fullscreen">
        <RouteMap
          origin={originCoords}
          destination={destinationCoords}
          originAddress={origin}
          destinationAddress={destination}
          routeCoords={routeCoords}
        />
      </div>

      <div className="floating-card">
        {!result ? (
          <>
            <p className="card-title">Calculadora de Frete</p>
            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleCalculate}>
              {/* Endereços */}
              <div className="address-inputs">
                <div className="address-field">
                  <span className="addr-icon">📍</span>
                  <input type="text" placeholder="Endereço de origem" value={origin}
                    onChange={e => setOrigin(e.target.value)} required />
                </div>
                <div className="address-field">
                  <span className="addr-icon">🎯</span>
                  <input type="text" placeholder="Endereço de destino" value={destination}
                    onChange={e => setDestination(e.target.value)} required />
                </div>
              </div>

              {/* Combustível */}
              <div className="options-row">
                <div className="option-input">
                  <label>Combustível (R$)</label>
                  <input type="number" step="0.01" min="0" value={fuelPrice}
                    onChange={e => setFuelPrice(e.target.value)} required />
                </div>
                <div className="option-input">
                  <label>Consumo (km/l)</label>
                  <input type="number" step="0.1" min="0.1" value={consumption}
                    onChange={e => setConsumption(e.target.value)} required />
                </div>
              </div>

              {/* Veículo */}
              <div className="vehicle-row">
                <button type="button" className={`vehicle-btn ${vehicleType==='MUNK'?'active':''}`}
                  onClick={() => setVehicleType('MUNK')}>
                  <span className="vicon">🏗️</span> MUNK
                </button>
                <button type="button" className={`vehicle-btn ${vehicleType==='PRANCHA'?'active':''}`}
                  onClick={() => setVehicleType('PRANCHA')}>
                  <span className="vicon">🚛</span> PRANCHA
                </button>
              </div>

              {/* Tipo de rota */}
              <div className="vehicle-row">
                <button type="button" className={`vehicle-btn route-btn ${routeType==='fastest'?'active':''}`}
                  onClick={() => setRouteType('fastest')}>⚡ Mais Rápida</button>
                <button type="button" className={`vehicle-btn route-btn ${routeType==='shortest'?'active':''}`}
                  onClick={() => setRouteType('shortest')}>📏 Mais Curta</button>
              </div>

              <button type="submit" className="btn-calcular" disabled={loading}>
                {loading ? '⏳ Calculando rota...' : '🚚 Calcular Frete'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="result-logo-header">
              <img src="/logo cbs.png" alt="CBS" />
              <h2>Resultado</h2>
            </div>

            <div className="result-rows">
              <div className="result-row">
                <span className="rl">Veículo</span>
                <span className="rv">{result.vehicleType}</span>
              </div>
              <div className="result-row">
                <span className="rl">Rota</span>
                <span className="rv">{routeType==='fastest'?'⚡ Mais Rápida':'📏 Mais Curta'}</span>
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
                <span className="rl">Duração</span>
                <span className="rv">{result.duration}</span>
              </div>
            </div>

            <div className="summary-box">
              <div className="summary-line"><span>Frete Base</span><span>R$ {result.basePrice.toFixed(2)}</span></div>
              <div className="summary-line"><span>Pedágio Estimado</span><span>R$ {result.tolEstimate.toFixed(2)}</span></div>
              <div className="summary-line"><span>Combustível</span><span>R$ {fuelCost.toFixed(2)}</span></div>
              <div className="summary-total"><span>TOTAL</span><span>R$ {(result.totalPrice+fuelCost).toFixed(2)}</span></div>
            </div>

            <div className="action-btns">
              <button className="btn-pdf" onClick={downloadPDF}>📄 Baixar PDF</button>
              <button className="btn-novo" onClick={resetar}>← Novo Cálculo</button>
            </div>

            {/* Botão Calcular Volta */}
            <button className="btn-volta" onClick={handleVolta} disabled={loading}>
              {loading ? '⏳ Calculando...' : '🔄 Calcular Volta'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
