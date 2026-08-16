import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { RemindersProvider } from './context/RemindersContext'
import './styles.css'

registerSW({ immediate: true })

const restoredRoute = sessionStorage.getItem('githubPagesRoute')
if (restoredRoute) {
  sessionStorage.removeItem('githubPagesRoute')
  history.replaceState(null, '', restoredRoute)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <RemindersProvider><App /></RemindersProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
