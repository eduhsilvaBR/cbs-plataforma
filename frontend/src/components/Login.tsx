import { useState } from 'react'
import axios from 'axios'
import './Login.css'

interface LoginProps {
  onLogin: (token: string, user: any) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        const response = await axios.post('/api/auth/login', { email, password })
        onLogin(response.data.token, response.data.user)
      } else {
        await axios.post('/api/auth/register', { email, password, name })
        setSuccess('Cadastro realizado com sucesso! Faça login para continuar.')
        setEmail('')
        setPassword('')
        setName('')
        setTimeout(() => setIsLogin(true), 2000)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro na operação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>{isLogin ? 'Login' : 'Criar Conta'}</h2>
          <p>{isLogin ? 'Acesse sua conta CBS' : 'Crie uma nova conta para usar a calculadora'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '⏳ Carregando...' : isLogin ? '🔓 Entrar' : '📝 Criar Conta'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
            <a onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setSuccess('')
            }}>
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </a>
          </p>
        </div>

        {isLogin && (
          <div className="demo-section">
            <p className="demo-label">🔑 Credenciais de Demo (Admin)</p>
            <code>admin@cbs.com / admin123</code>
          </div>
        )}
      </div>
    </div>
  )
}
