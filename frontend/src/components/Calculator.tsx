import { useState, useEffect } from 'react'
import axios from 'axios'
import apiClient from '../utils/api'
import RouteMap from './RouteMap'
import './Calculator.css'

interface Budget {
  id: number
  vehicleType: string
  distance: number
  basePrice: number
  tolEstimate: number
  totalPrice: number
  duration: string
  createdAt: string
}

interface Coordinates {
  lat: number
  lng: number
}

interface CalculatorProps {
  token: string | null
}

export default function Calculator({ token }: CalculatorProps) {
  const [vehicleType, setVehicleType] = useState<'MUNK' | 'PRANCHA'>('MUNK')
  const [pricePerKm, setPricePerKm] = useState('5.50')
  const [fuelPrice, setFuelPrice] = useState('6.50')
  const [consumption, setConsumption] = useState('8')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Budget | null>(null)
  const [originCoords, setOriginCoords] = useState<Coordinates | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null)
  const [fuelCost, setFuelCost] = useState(0)

  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    try {
      // Usar Nominatim (OpenStreetMap) - completamente gratuito
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'CBS-Frete-Calculator',
        },
      })

      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0]
        return { lat: parseFloat(lat), lng: parseFloat(lon) }
      }
      return null
    } catch (err) {
      console.error('Erro ao geocodificar endereço:', err)
      return null
    }
  }

  // Atualizar coordenadas em tempo real enquanto digita
  const updateMapCoordinates = async () => {
    if (origin) {
      const coords = await geocodeAddress(origin)
      if (coords) setOriginCoords(coords)
    }
    if (destination) {
      const coords = await geocodeAddress(destination)
      if (coords) setDestinationCoords(coords)
    }
  }

  // Debounce para não fazer requisições a cada letra
  const handleAddressChange = (type: 'origin' | 'destination', value: string) => {
    if (type === 'origin') {
      setOrigin(value)
    } else {
      setDestination(value)
    }
  }

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Atualizar mapa antes de calcular
      await updateMapCoordinates()

      const response = await apiClient.post('/api/calculate', {
        vehicleType,
        pricePerKm: parseFloat(pricePerKm),
        originAddress: origin,
        destinationAddress: destination,
        clientName: 'Orçamento',
        clientEmail: '',
        clientPhone: ''
      })

      setResult(response.data)

      // Atualizar coordenadas do mapa com os dados da API
      if (response.data.originCoords) {
        setOriginCoords(response.data.originCoords)
      }
      if (response.data.destCoords) {
        setDestinationCoords(response.data.destCoords)
      }

      // Calcular custo de combustível
      const distance = response.data.distance
      const fuel = parseFloat(fuelPrice) / parseFloat(consumption)
      const totalFuel = distance * fuel
      setFuelCost(totalFuel)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao calcular frete. Verifique os endereços.')
    } finally {
      setLoading(false)
    }
  }

  // Atualizar mapa quando endereço mudar
  useEffect(() => {
    const timer = setTimeout(() => {
      updateMapCoordinates()
    }, 500)
    return () => clearTimeout(timer)
  }, [origin, destination])

  const downloadPDF = async () => {
    if (!result) return

    try {
      const response = await apiClient.get(`/api/budgets/${result.id}/pdf`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `orcamento-${result.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentElement?.removeChild(link)
    } catch (err) {
      console.error('Erro ao baixar PDF:', err)
      setError('Erro ao gerar PDF')
    }
  }

  return (
    <div className="calculator-container">
      <div className={`calculator-wrapper`}>
        <div className={result ? 'result-card' : 'calculator-card'}>
          {!result ? (
            <>
              <h2>Calculadora de Frete</h2>
              <p className="subtitle">Digite os dados para calcular seu orçamento</p>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleCalculate} className="form">
              <div className="form-section">
                <h3>Dados do Veículo</h3>

                <div className="form-group">
                  <label>Tipo de Veículo *</label>
                  <div className="vehicle-selector">
                    <button
                      type="button"
                      className={`vehicle-option ${vehicleType === 'MUNK' ? 'active' : ''}`}
                      onClick={() => setVehicleType('MUNK')}
                    >
                      <span className="vehicle-icon">🏗️</span>
                      <span>MUNK</span>
                    </button>
                    <button
                      type="button"
                      className={`vehicle-option ${vehicleType === 'PRANCHA' ? 'active' : ''}`}
                      onClick={() => setVehicleType('PRANCHA')}
                    >
                      <span className="vehicle-icon">🚛</span>
                      <span>PRANCHA</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Valor por km (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricePerKm}
                    onChange={(e) => setPricePerKm(e.target.value)}
                    placeholder="Ex: 5.50"
                    required
                  />
                  <small>Você pode alterar este valor conforme necessário</small>
                </div>
              </div>

              <div className="form-section">
                <h3>Combustível</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Combustível (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fuelPrice}
                      onChange={(e) => setFuelPrice(e.target.value)}
                      placeholder="Ex: 6.50"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Consumo (km/l) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={consumption}
                      onChange={(e) => setConsumption(e.target.value)}
                      placeholder="Ex: 8"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Endereços</h3>

                <div className="form-group">
                  <label>Endereço de Origem *</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Ex: Rua A, 123, São Paulo, SP"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Endereço de Destino *</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ex: Rua B, 456, Rio de Janeiro, RJ"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '⏳ Calculando...' : '🚚 Calcular Frete'}
              </button>
            </form>
            </>
          ) : (
            <>
              <div className="result-header">
                <img src="/logo cbs.png" alt="CBS Logo" className="result-logo" />
                <h2>Resultado do Orçamento</h2>
              </div>

              <div className="result-info">
                  <div className="info-row">
                    <span className="label">Orçamento #</span>
                    <span className="value">{result.id.toString().padStart(6, '0')}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Veículo</span>
                    <span className="value">{result.vehicleType}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Origem</span>
                    <span className="value small">{origin}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Destino</span>
                    <span className="value small">{destination}</span>
                  </div>

                  <div className="divider"></div>

                  <div className="calc-details">
                    <div className="calc-row">
                      <span>Distância</span>
                      <strong>{result.distance} km</strong>
                    </div>
                    <div className="calc-row">
                      <span>Tempo Estimado</span>
                      <strong>{result.duration}</strong>
                    </div>
                    <div className="calc-row">
                      <span>Valor por km</span>
                      <strong>R$ {(result.basePrice / result.distance).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="summary">
                    <div className="summary-row">
                      <span>Frete Base</span>
                      <span>R$ {result.basePrice.toFixed(2)}</span>
                    </div>
                    {result.tolEstimate > 0 && (
                      <div className="summary-row">
                        <span>Estimativa de Pedágio</span>
                        <span>R$ {result.tolEstimate.toFixed(2)}</span>
                      </div>
                    )}
                    {fuelCost > 0 && (
                      <div className="summary-row">
                        <span>Custo de Combustível</span>
                        <span>R$ {fuelCost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="summary-row total">
                      <span>TOTAL</span>
                      <span>R$ {(result.totalPrice + fuelCost).toFixed(2)}</span>
                    </div>
                  </div>

                <div className="actions">
                  <button className="btn btn-primary" onClick={downloadPDF}>
                    📄 Baixar PDF
                  </button>
                  <button className="btn btn-secondary" onClick={() => setResult(null)}>
                    ← Novo Cálculo
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <RouteMap
          origin={originCoords || undefined}
          destination={destinationCoords || undefined}
          originAddress={origin}
          destinationAddress={destination}
        />
      </div>
    </div>
  )
}
