import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import theme from './theme'
import './index.css'

// Apply theme CSS variables from theme.js onto :root
Object.entries(theme).forEach(([key, val]) => {
  document.documentElement.style.setProperty(key, val)
})

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
