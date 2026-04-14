import { useState } from 'react'
import Calculator from './components/Calculator'
import SplashScreen from './components/SplashScreen'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  const handleSplashFinish = () => {
    setShowSplash(false)
  }

  return (
    <div className="app">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <img src="/logo cbs.png" alt="CBS Logo" className="logo" onError={(e) => {
                e.currentTarget.style.display = 'none'
              }} />
              <h1>CBS Frete</h1>
            </div>
            <nav className="nav">
              <span className="nav-text">Calculadora Inteligente de Frete</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Calculator token={null} />
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
