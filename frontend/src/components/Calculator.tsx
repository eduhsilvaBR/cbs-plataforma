import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import apiClient from '../utils/api'
import RouteMap from './RouteMap'
import './Calculator.css'

interface Coords { lat: number; lng: number }
interface RouteData {
  distKm: number
  duration: string
}

interface Result {
  id: number
  vehicleType: string
  routeType: string
  ida: RouteData
  volta: RouteData
  totalDistance: number
  basePrice: number
  tolEstimate: number
  totalPrice: number
  fuelCost: number
}

// ── Decoder: Valhalla usa encoded polyline com precisão 6 ─────────────────
function decodePolyline6(encoded: string): [number, number][] {
  const coords: [number, number][] = []
  let idx = 0, lat = 0, lng = 0
  while (idx < encoded.length) {
    let b, shift = 0, result = 0
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)
    shift = 0; result = 0
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)
    coords.push([lat / 1e6, lng / 1e6]) // já em [lat, lng] para Leaflet
  }
  return coords
}

// ── Valhalla auto ──────────────────────────────────────────────────────────
// Perfil "auto" segue rotas costeiras (BR-101) sem penalizar serras
async function tryValhalla(origin: Coords, dest: Coords, shortest: boolean) {
  try {
    const body = {
      locations: [
        { lon: origin.lng, lat: origin.lat },
        { lon: dest.lng,   lat: dest.lat   },
      ],
      costing: 'auto',
      directions_type: 'none',
      costing_options: { auto: { shortest } },
    }
    const res = await fetch('https://valhalla1.openstreetmap.de/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const leg = data?.trip?.legs?.[0]
    if (!leg?.shape || typeof leg.shape !== 'string') return null
    const distKm      = Math.round(leg.summary.length * 10) / 10
    const secs        = leg.summary.time
    const routeCoords = decodePolyline6(leg.shape)
    return { distKm, secs, routeCoords }
  } catch { return null }
}

// ── OSRM (fallback) ────────────────────────────────────────────────────────
async function tryOsrm(server: string, coords: string, alternatives: boolean) {
  try {
    const url = `${server}/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=${alternatives}&steps=false`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const data = await res.json()
    if (data.code === 'Ok' && data.routes?.length) return data.routes as any[]
  } catch {}
  return null
}

async function getRoute(origin: Coords, dest: Coords, type: 'fastest' | 'shortest') {
  const shortest = type === 'shortest'

  // Tenta Valhalla auto (carro) — melhor para rotas costeiras
  const vResult = await tryValhalla(origin, dest, shortest)
  if (vResult) {
    const { distKm, secs, routeCoords } = vResult
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return { distKm, duration: h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`, routeCoords }
  }

  // Fallback: OSRM
  const coords  = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`
  const servers = ['https://router.project-osrm.org', 'https://routing.openstreetmap.de/routed-car']
  let routes: any[] | null = null
  for (const server of servers) {
    routes = await tryOsrm(server, coords, shortest)
    if (routes) break
  }
  if (!routes) throw new Error('Nenhum servidor de rota disponível')

  const route = shortest
    ? routes.slice().sort((a: any, b: any) => a.distance - b.distance)[0]
    : routes[0]
  const distKm = Math.round(route.distance / 1000 * 10) / 10
  const secs   = route.duration
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const routeCoords: [number, number][] = route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng])
  return { distKm, duration: h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`, routeCoords }
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
      // Geocodifica endereços uma vez
      const geoRes = await apiClient.post('/api/calculate', {
        vehicleType, originAddress: orig, destinationAddress: dest
      })
      const { originCoords: oCoords, destCoords: dCoords } = geoRes.data
      setOriginCoords(oCoords)
      setDestinationCoords(dCoords)

      // Calcula IDA: orig → dest
      const idaRoute = await getRoute(oCoords, dCoords, routeType)

      // Calcula VOLTA: dest → orig (mesma rota, sentido oposto)
      const voltaRoute = await getRoute(dCoords, oCoords, routeType)

      // Usa rota da IDA no mapa
      setRouteCoords(idaRoute.routeCoords)

      const pricePerKm  = vehicleType === 'MUNK' ? 5.50 : 3.50
      const totalDist   = idaRoute.distKm + voltaRoute.distKm
      const basePrice   = parseFloat((totalDist * pricePerKm).toFixed(2))
      const tolEstimate = parseFloat((totalDist * 0.12).toFixed(2))
      const totalPrice  = parseFloat((basePrice + tolEstimate).toFixed(2))
      const fuelCost    = parseFloat(((totalDist / parseFloat(consumption)) * parseFloat(fuelPrice)).toFixed(2))

      setResult({
        id: Math.floor(Math.random() * 100000),
        vehicleType, routeType,
        ida: { distKm: idaRoute.distKm, duration: idaRoute.duration },
        volta: { distKm: voltaRoute.distKm, duration: voltaRoute.duration },
        totalDistance: totalDist,
        basePrice, tolEstimate, totalPrice, fuelCost
      })
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao calcular. Verifique os endereços.'
      setError(msg)
    } finally { setLoading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); calcular(origin, destination) }

  const handleVolta = () => {
    const novaOrig = destination
    const novaDest = origin
    if (!novaOrig || !novaDest) { setError('Endereços não definidos'); return }
    setOrigin(novaOrig)
    setDestination(novaDest)
    setRouteCoords(undefined)
    calcular(novaOrig, novaDest, false)
  }

  const downloadPDF = async () => {
    if (!result) return
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210, margin = 20

    // Carregar logo
    try {
      const logoRes = await fetch('/logo cbs.png')
      const blob    = await logoRes.blob()
      const b64     = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      doc.addImage(b64, 'PNG', margin, 12, 30, 18)
    } catch {}

    // Título
    doc.setFontSize(16)
    doc.setTextColor(21, 101, 192)
    doc.setFont('helvetica', 'bold')
    doc.text('CBS TRANSPORTES NÁUTICOS', 60, 25)

    let y = 45

    // VEÍCULO
    doc.setFontSize(11)
    doc.setTextColor(21, 101, 192)
    doc.setFont('helvetica', 'bold')
    doc.text('VEÍCULO', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(10)
    doc.text(result.vehicleType, margin, y)
    y += 12

    // DISTÂNCIA
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(21, 101, 192)
    doc.setFontSize(11)
    doc.text('DISTÂNCIA', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(10)
    doc.text(`${result.totalDistance} km`, margin, y)
    y += 12

    // ORIGEM
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(21, 101, 192)
    doc.setFontSize(11)
    doc.text('ORIGEM', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(9)
    const origLines = doc.splitTextToSize(origin, W - margin*2)
    doc.text(origLines, margin, y)
    y += origLines.length * 4 + 8

    // DESTINO
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(21, 101, 192)
    doc.setFontSize(11)
    doc.text('DESTINO', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(9)
    const destLines = doc.splitTextToSize(destination, W - margin*2)
    doc.text(destLines, margin, y)
    y += destLines.length * 4 + 12

    // VALOR TOTAL (box amarelo)
    doc.setFillColor(255, 251, 235)
    doc.setDrawColor(252, 211, 77)
    doc.roundedRect(margin, y, W - margin*2, 25, 3, 3, 'FD')
    y += 4

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(217, 119, 6)
    doc.setFontSize(12)
    doc.text('VALOR TOTAL', margin + 8, y + 8)
    doc.setFontSize(14)
    doc.text(`R$ ${(result.totalPrice + result.fuelCost).toFixed(2)}`, W - margin - 8, y + 8, { align: 'right' })

    doc.save(`orcamento-cbs-${result.id}.pdf`)
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

            {error && <div className="error-msg">{error}</div>}

            <div className="result-rows">
              <div className="result-row"><span className="rl">Veículo</span><span className="rv">{result.vehicleType}</span></div>
              <div className="result-row"><span className="rl">Rota</span><span className="rv">{result.routeType==='fastest'?'⚡ Mais Rápida':'📏 Mais Curta'}</span></div>
              <div className="result-row"><span className="rl">Origem</span><span className="rv small">{origin}</span></div>
              <div className="result-row"><span className="rl">Destino</span><span className="rv small">{destination}</span></div>

              <div style={{marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #eee'}}>
                <div className="result-row"><span className="rl">📍 Ida</span><span className="rv">{result.ida.distKm} km · {result.ida.duration}</span></div>
                <div className="result-row"><span className="rl">📍 Volta</span><span className="rv">{result.volta.distKm} km · {result.volta.duration}</span></div>
              </div>

              <div className="result-row"><span className="rl">Total</span><span className="rv" style={{fontWeight: '700', color: '#1565c0'}}>{result.totalDistance} km</span></div>
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
          </>
        )}
      </div>
    </div>
  )
}
