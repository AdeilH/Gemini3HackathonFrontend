import { useState } from 'react'
import './App.css'
import Login from './components/Login'
import VideoUpload from './components/VideoUpload'

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <div className="App">
      <h1>Gemini Coach</h1>
      {!token ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div style={{ position: 'relative' }}>
          <button className="logout-btn" onClick={handleLogout} style={{ position: 'absolute', top: '-60px', right: '0' }}>Logout</button>
          <VideoUpload />
        </div>
      )}
    </div>
  )
}

export default App
