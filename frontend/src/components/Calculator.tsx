import { useState } from 'react'
import axios from 'axios'
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
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Budget | null>(null)
  const [originCoords, setOriginCoords] = useState<Coordinates | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null)

  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      if (!apiKey) return null

      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: apiKey,
        },
      })

      if (response.data.results && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location
        return { lat, lng }
      }
      return null
    } catch (err) {
      console.error('Erro ao geocodificar endereço:', err)
      return null
    }
  }

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Geocodificar endereços para exibir no mapa
      const [originCoord, destCoord] = await Promise.all([
        geocodeAddress(origin),
        geocodeAddress(destination),
      ])

      const response = await axios.post('/api/calculate', {
        vehicleType,
        pricePerKm: parseFloat(pricePerKm),
        originAddress: origin,
        destinationAddress: destination,
        clientName,
        clientEmail,
        clientPhone
      })

      setResult(response.data)
      setOriginCoords(originCoord)
      setDestinationCoords(destCoord)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao calcular frete. Verifique os endereços.')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!result) return

    try {
      const response = await axios.get(`/api/budgets/${result.id}/pdf`, {
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
      <div className="container">
        <div className={`calculator-wrapper ${result ? 'with-map' : ''}`}>
          <div className="calculator-card">
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

              <div className="form-section">
                <h3>Dados do Cliente</h3>

                <div className="form-group">
                  <label>Nome do Cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="form-group">
                  <label>Email do Cliente</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Telefone do Cliente</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '⏳ Calculando...' : '🚚 Calcular Frete'}
              </button>
            </form>
          </div>

          {result && (
            <>
              <div className="result-card">
                <h2>Resultado do Orçamento</h2>

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
                    <div className="summary-row total">
                      <span>TOTAL</span>
                      <span>R$ {result.totalPrice.toFixed(2)}</span>
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
              </div>
              <RouteMap
                origin={originCoords || undefined}
                destination={destinationCoords || undefined}
                originAddress={origin}
                destinationAddress={destination}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
