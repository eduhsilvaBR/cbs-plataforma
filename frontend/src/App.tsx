import { useState, useEffect } from 'react'
import Calculator from './components/Calculator'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'calculator' | 'login' | 'admin'>('calculator')
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        setUser(decoded)
      } catch (error) {
        console.error('Erro ao decodificar token')
        logout()
      }
    }
  }, [token])

  const handleLogin = (newToken: string, userData: any) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
    setCurrentPage('calculator')
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setCurrentPage('calculator')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <img src="/logo cbs.png" alt="CBS Logo" className="logo" onError={(e) => {
                e.currentTarget.style.display = 'none'
              }} />
              <h1>CBS - Calculadora de Frete</h1>
            </div>
            <nav className="nav">
              <button
                className={`nav-btn ${currentPage === 'calculator' ? 'active' : ''}`}
                onClick={() => setCurrentPage('calculator')}
              >
                Calculadora
              </button>
              {user?.isAdmin && (
                <button
                  className={`nav-btn ${currentPage === 'admin' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('admin')}
                >
                  Painel Admin
                </button>
              )}
              {token ? (
                <>
                  <span className="user-info">Olá, {user?.email}</span>
                  <button className="nav-btn logout" onClick={logout}>
                    Sair
                  </button>
                </>
              ) : (
                <button
                  className={`nav-btn ${currentPage === 'login' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('login')}
                >
                  Login
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'calculator' && <Calculator token={token} />}
        {currentPage === 'login' && <Login onLogin={handleLogin} />}
        {currentPage === 'admin' && token && user?.isAdmin && <AdminPanel token={token} />}
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>&copy; 2024 CBS Transportes. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
