import { useState, useEffect } from 'react'
import axios from 'axios'
import './AdminPanel.css'

interface VehiclePrice {
  id: number
  vehicleType: string
  pricePerKm: number
  description: string
  updatedAt: string
}

interface AdminPanelProps {
  token: string
}

export default function AdminPanel({ token }: AdminPanelProps) {
  const [prices, setPrices] = useState<VehiclePrice[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadPrices()
  }, [])

  const loadPrices = async () => {
    try {
      const response = await axios.get('/api/admin/vehicle-prices')
      setPrices(response.data)
      setLoading(false)
    } catch (err) {
      setError('Erro ao carregar preços')
      setLoading(false)
    }
  }

  const handleEdit = (price: VehiclePrice) => {
    setEditingId(price.id)
    setEditValue(price.pricePerKm.toString())
  }

  const handleSave = async (id: number) => {
    try {
      setError('')
      setSuccess('')

      const response = await axios.put(
        `/api/admin/vehicle-prices/${id}`,
        { pricePerKm: parseFloat(editValue) },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setPrices(prices.map(p => p.id === id ? response.data : p))
      setEditingId(null)
      setSuccess('Preço atualizado com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar preço')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="container">
          <div className="admin-card">
            <p className="loading">⏳ Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="container">
        <div className="admin-card">
          <h2>Painel Administrativo</h2>
          <p className="subtitle">Gerenciar preços dos veículos</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="prices-table">
            <div className="table-header">
              <div className="col-vehicle">Veículo</div>
              <div className="col-price">Valor por km (R$)</div>
              <div className="col-updated">Atualizado em</div>
              <div className="col-actions">Ações</div>
            </div>

            {prices.map(price => (
              <div key={price.id} className="table-row">
                <div className="col-vehicle">
                  <div className="vehicle-info">
                    <span className="vehicle-icon">
                      {price.vehicleType === 'MUNK' ? '🏗️' : '🚛'}
                    </span>
                    <div>
                      <strong>{price.vehicleType}</strong>
                      <small>{price.description}</small>
                    </div>
                  </div>
                </div>

                <div className="col-price">
                  {editingId === price.id ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                  ) : (
                    <span className="price-value">R$ {price.pricePerKm.toFixed(2)}</span>
                  )}
                </div>

                <div className="col-updated">
                  <small>{new Date(price.updatedAt).toLocaleDateString('pt-BR')}</small>
                </div>

                <div className="col-actions">
                  {editingId === price.id ? (
                    <>
                      <button
                        className="btn btn-small btn-success"
                        onClick={() => handleSave(price.id)}
                      >
                        ✓ Salvar
                      </button>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={handleCancel}
                      >
                        ✕ Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => handleEdit(price)}
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="admin-notes">
            <h3>ℹ️ Informações</h3>
            <ul>
              <li>Os valores aqui são os padrões para cada veículo</li>
              <li>Os clientes podem ajustar o valor por km durante o cálculo</li>
              <li>O cálculo inclui estimativa automática de pedágio</li>
              <li>Todos os orçamentos são salvos no banco de dados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
