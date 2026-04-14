import { useState, useEffect } from 'react'
import apiClient from '../utils/api'
import RouteMap from './RouteMap'
import './Calculator.css'

interface Coords { lat: number; lng: number }
interface Result {
  id: number
  vehicleType: string
  routeType: string
  distance: number
  duration: string
  basePrice: number
  tolEstimate: number
  totalPrice: number
  fuelCost: number
}

// Chama OSRM direto do browser
async function getOsrmRoute(origin: Coords, dest: Coords, type: 'fastest' | 'shortest') {
  const coords = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Sem rota')

  const routes = data.routes as any[]
  const route = type === 'shortest'
    ? routes.slice().sort((a: any, b: any) => a.distance - b.distance)[0]
    : routes[0]

  const distKm = Math.round(route.distance / 1000 * 10) / 10
  const secs = route.duration
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const duration = h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`
  const routeCoords: [number, number][] = route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng])
  return { distKm, duration, routeCoords }
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

  const [originCoords,      setOriginCoords]      = useState<Coords | undefined>()
  const [destinationCoords, setDestinationCoords] = useState<Coords | undefined>()
  const [routeCoords,       setRouteCoords]       = useState<[number,number][] | undefined>()

  // Preview mapa ao digitar
  useEffect(() => {
    const t = setTimeout(async () => {
      const geo = async (addr: string): Promise<Coords | undefined> => {
        if (!addr) return undefined
        try {
          const cepM = addr.match(/\d{5}-?\d{3}/)
          let q = addr
          if (cepM) {
            const vd = await (await fetch(`https://viacep.com.br/ws/${cepM[0].replace('-','')}}/json/`)).json()
            if (!vd.erro) q = `${vd.localidade}, ${vd.uf}`
          }
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`,
            { headers: { 'User-Agent': 'CBS-Frete' } }
          )
          const d = await r.json()
          if (d?.length > 0) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) }
        } catch {}
        return undefined
      }
      if (origin)      setOriginCoords(await geo(origin))
      if (destination) setDestinationCoords(await geo(destination))
    }, 900)
    return () => clearTimeout(t)
  }, [origin, destination])

  const calcular = async (orig: string, dest: string, keepResult = false) => {
    if (!orig || !dest) return
    setLoading(true); setError('')
    if (!keepResult) { setResult(null); setRouteCoords(undefined) }
    try {
      const geoRes = await apiClient.post('/api/calculate', {
        vehicleType, originAddress: orig, destinationAddress: dest
      })
      const { originCoords: oCoords, destCoords: dCoords } = geoRes.data
      setOriginCoords(oCoords)
      setDestinationCoords(dCoords)

      const { distKm, duration, routeCoords: rc } = await getOsrmRoute(oCoords, dCoords, routeType)
      setRouteCoords(rc)

      const pricePerKm  = vehicleType === 'MUNK' ? 5.50 : 3.50
      const basePrice   = parseFloat((distKm * pricePerKm).toFixed(2))
      // Pedágio: ~R$0.12/km (média nacional) — apenas estimativa
      const tolEstimate = parseFloat((distKm * 0.12).toFixed(2))
      const totalPrice  = parseFloat((basePrice + tolEstimate).toFixed(2))
      const fuelCost    = parseFloat(((distKm / parseFloat(consumption)) * parseFloat(fuelPrice)).toFixed(2))

      setResult({
        id: Math.floor(Math.random() * 100000),
        vehicleType, routeType,
        distance: distKm, duration,
        basePrice, tolEstimate, totalPrice, fuelCost
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao calcular. Verifique os endereços.')
    } finally { setLoading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); calcular(origin, destination) }

  const handleVolta = () => {
    const novaOrig = destination
    const novaDest = origin
    setOrigin(novaOrig)
    setDestination(novaDest)
    // keepResult=true: mantém na tela de resultado enquanto recalcula
    calcular(novaOrig, novaDest, true)
  }

  const downloadPDF = () => {
    if (!result) return
    const txt = [
      'CBS TRANSPORTES NÁUTICOS',
      `Orçamento #${String(result.id).padStart(6,'0')}`,
      '',
      `Veículo:   ${result.vehicleType}`,
      `Rota:      ${result.routeType === 'fastest' ? 'Mais Rápida' : 'Mais Curta'}`,
      `Origem:    ${origin}`,
      `Destino:   ${destination}`,
      '',
      `Distância: ${result.distance} km`,
      `Duração:   ${result.duration}`,
      '',
      `Frete Base:       R$ ${result.basePrice.toFixed(2)}`,
      `Pedágio Est.:     R$ ${result.tolEstimate.toFixed(2)}`,
      `Combustível:      R$ ${result.fuelCost.toFixed(2)}`,
      '─────────────────────────────',
      `TOTAL:            R$ ${(result.totalPrice + result.fuelCost).toFixed(2)}`,
      '',
      new Date().toLocaleString('pt-BR'),
    ].join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })),
      download: `orcamento-cbs-${result.id}.txt`
    })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

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

            <form onSubmit={handleSubmit}>
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

              <div className="vehicle-row">
                <button type="button" className={`vehicle-btn ${vehicleType==='MUNK'?'active':''}`}
                  onClick={() => setVehicleType('MUNK')}><span className="vicon">🏗️</span> MUNK</button>
                <button type="button" className={`vehicle-btn ${vehicleType==='PRANCHA'?'active':''}`}
                  onClick={() => setVehicleType('PRANCHA')}><span className="vicon">🚛</span> PRANCHA</button>
              </div>

              <div className="vehicle-row">
                <button type="button" className={`vehicle-btn route-btn ${routeType==='fastest'?'active':''}`}
                  onClick={() => setRouteType('fastest')}>⚡ Mais Rápida</button>
                <button type="button" className={`vehicle-btn route-btn ${routeType==='shortest'?'active':''}`}
                  onClick={() => setRouteType('shortest')}>📏 Mais Curta</button>
              </div>

              <div className="calc-buttons">
                <button type="submit" className="btn-calcular" disabled={loading}>
                  {loading ? '⏳ Calculando...' : '🚚 Calcular Frete'}
                </button>
                <button type="button" className="btn-volta-form" disabled={loading || !origin || !destination}
                  onClick={handleVolta}>
                  🔄 Calcular Volta
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="result-logo-header">
              <img src="/logo cbs.png" alt="CBS" />
              <h2>{loading ? '⏳ Recalculando...' : 'Resultado'}</h2>
            </div>

            <div className="result-rows">
              <div className="result-row"><span className="rl">Veículo</span><span className="rv">{result.vehicleType}</span></div>
              <div className="result-row"><span className="rl">Rota</span><span className="rv">{result.routeType==='fastest'?'⚡ Mais Rápida':'📏 Mais Curta'}</span></div>
              <div className="result-row"><span className="rl">Origem</span><span className="rv small">{origin}</span></div>
              <div className="result-row"><span className="rl">Destino</span><span className="rv small">{destination}</span></div>
              <div className="result-row"><span className="rl">Distância</span><span className="rv">{result.distance} km</span></div>
              <div className="result-row"><span className="rl">Duração</span><span className="rv">{result.duration}</span></div>
            </div>

            <div className="summary-box">
              <div className="summary-line"><span>Frete Base</span><span>R$ {result.basePrice.toFixed(2)}</span></div>
              <div className="summary-line">
                <span>Pedágio <small className="note">est.</small></span>
                <span>R$ {result.tolEstimate.toFixed(2)}</span>
              </div>
              <div className="summary-line"><span>Combustível</span><span>R$ {result.fuelCost.toFixed(2)}</span></div>
              <div className="summary-total"><span>TOTAL</span><span>R$ {(result.totalPrice + result.fuelCost).toFixed(2)}</span></div>
            </div>
            <p className="toll-note">* Pedágio estimado em R$0,12/km. Valor real pode variar.</p>

            <div className="action-btns">
              <button className="btn-pdf" onClick={downloadPDF}>📄 Baixar PDF</button>
              <button className="btn-novo" onClick={() => { setResult(null); setRouteCoords(undefined) }}>← Novo Cálculo</button>
            </div>
            <button className="btn-volta" onClick={handleVolta} disabled={loading}>
              {loading ? '⏳ Calculando...' : '🔄 Calcular Volta'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
