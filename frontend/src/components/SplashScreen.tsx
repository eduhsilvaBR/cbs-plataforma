import { useEffect, useState } from 'react'
import './SplashScreen.css'

interface SplashScreenProps {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true)
      setTimeout(onFinish, 600)
    }, 2000)
    return () => clearTimeout(t)
  }, [onFinish])

  return (
    <div className={`splash-screen ${done ? 'fade-out' : ''}`}>
      <div className="splash-logo-wrap">
        <img src="/logo cbs.png" alt="CBS" className="splash-logo" />
      </div>
    </div>
  )
}
