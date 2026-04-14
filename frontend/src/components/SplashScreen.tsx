import { useEffect, useState } from 'react'
import './SplashScreen.css'

interface SplashScreenProps {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 30
        if (next >= 100) {
          clearInterval(interval)
          setIsLoading(false)
          setTimeout(onFinish, 800)
          return 100
        }
        return next
      })
    }, 200)

    return () => clearInterval(interval)
  }, [onFinish])

  return (
    <div className={`splash-screen ${!isLoading ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="logo-container">
          <img src="/logo cbs.png" alt="CBS Logo" className="splash-logo" />
          <h1 className="splash-title">CBS Frete</h1>
          <p className="splash-subtitle">Calculadora Inteligente de Transporte</p>
        </div>

        {isLoading && (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="loading-text">Preparando sua calculadora...</p>
          </div>
        )}

        {!isLoading && (
          <div className="ready-message">
            <p className="success-text">✓ Pronto para calcular!</p>
          </div>
        )}
      </div>

      <div className="splash-footer">
        <p>Sua solução de frete em tempo real</p>
      </div>
    </div>
  )
}
