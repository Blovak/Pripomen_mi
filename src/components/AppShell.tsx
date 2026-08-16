import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { useReminders } from '../context/RemindersContext'

export function AppShell({ children }: PropsWithChildren) {
  const { offline } = useReminders()
  return (
    <div className="app-shell">
      {offline && <div className="network-banner">Bez připojení · změny čekají na synchronizaci</div>}
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Připomeň mi – domů">Připomeň mi</NavLink>
        <NavLink to="/settings" className="icon-link" aria-label="Nastavení">⚙︎</NavLink>
      </header>
      <main>{children}</main>
      <nav className="bottom-nav" aria-label="Hlavní navigace">
        <NavLink to="/" end>Nová</NavLink>
        <NavLink to="/reminders">Připomínky</NavLink>
        <NavLink to="/onboarding">Instalace</NavLink>
      </nav>
    </div>
  )
}
