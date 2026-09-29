import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Productos from './pages/Productos'
import NuevoProducto from './pages/NuevoProducto'
import Vender from './pages/Vender'
import Ventas from './pages/Ventas'
import CierreCaja from './pages/CierreCaja'
import EntradaMercaderia from './pages/EntradaMercaderia'
import ListaCompras from './pages/ListaCompras'
import Reportes from './pages/Reportes'
import Ticket from './pages/Ticket'
import EditarProducto from './pages/EditarProducto'
import PanelAdmin from './pages/PanelAdmin'

const MENU_LOCAL = [
  { to: '/', label: 'Stock', icon: '📦' },
  { to: '/ventas', label: 'Ventas de hoy', icon: '📊' },
  { to: '/reportes', label: 'Reportes', icon: '📈' },
  { to: '/entrada', label: 'Entrada mercaderia', icon: '📥' },
  { to: '/lista', label: 'Lista de compras', icon: '📝' },
  { to: '/cierre', label: 'Cierre de caja', icon: '💵' },
  { to: '/nuevo', label: 'Nuevo producto', icon: '➕' }
]

const MENU_ADMIN = [
  { to: '/admin', label: 'Panel Admin', icon: '👑' }
]

function MenuLateral({ abierto, cerrar, esAdmin, local, cerrarSesion }) {
  const { pathname } = useLocation()
  if (!abierto) return null

  const menu = esAdmin ? MENU_ADMIN : MENU_LOCAL

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={cerrar}></div>
      <div className="w-72 bg-white dark:bg-stone-900 h-full shadow-lg overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-stone-800 flex justify-between items-center">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {esAdmin ? 'delbarrio.com' : 'Local'}
            </p>
            <p className="font-bold text-barrio-700 dark:text-barrio-500 truncate">
              {esAdmin ? 'Administrador' : (local?.nombre || 'Mi local')}
            </p>
          </div>
          <button onClick={cerrar} className="text-2xl text-gray-500 dark:text-gray-400 leading-none">×</button>
        </div>
        <div className="py-2 flex-1">
          {menu.map(m => (
            <Link
              key={m.to}
              to={m.to}
              onClick={cerrar}
              className={
                'flex items-center gap-3 px-4 py-4 text-base ' +
                (pathname === m.to
                  ? 'bg-orange-50 dark:bg-stone-800 text-barrio-700 dark:text-barrio-500 font-semibold'
                  : 'text-gray-700 dark:text-gray-300')
              }
            >
              <span className="text-2xl">{m.icon}</span>
              <span>{m.label}</span>
            </Link>
          ))}
        </div>
        <div className="border-t border-gray-100 dark:border-stone-800 p-4">
          <button
            onClick={() => {
              if (confirm('Cerrar sesion?')) {
                cerrarSesion()
                cerrar()
              }
            }}
            className="w-full text-left text-red-600 dark:text-red-400 font-semibold py-2"
          >
            🚪 Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  )
}

function BotonVender() {
  const { pathname } = useLocation()
  if (pathname === '/vender') return null
  return (
    <Link
      to="/vender"
      className="fixed bottom-6 right-6 bg-barrio-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl z-40 active:scale-95 transition-transform"
      title="Vender"
    >
      🛒
    </Link>
  )
}

function AppAdmin({ esAdmin, local, cerrarSesion }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-gray-100 dark:border-stone-800 shadow-sm px-4 py-3 relative">
        <button
          onClick={() => setMenuAbierto(true)}
          className="absolute top-4 right-4 text-3xl text-gray-600 dark:text-gray-300 leading-none z-10"
        >
          ☰
        </button>
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="delbarrio.com"
            className="h-24 object-contain"
          />
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/admin" element={<PanelAdmin />} />
          <Route path="*" element={<PanelAdmin />} />
        </Routes>
      </main>
      <MenuLateral
        abierto={menuAbierto}
        cerrar={() => setMenuAbierto(false)}
        esAdmin={esAdmin}
        local={local}
        cerrarSesion={cerrarSesion}
      />
    </div>
  )
}

function AppLocal({ esAdmin, local, cerrarSesion }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-gray-100 dark:border-stone-800 shadow-sm px-4 py-3 relative">
        <Link
          to="/"
          className="absolute top-5 left-4 text-2xl text-gray-600 dark:text-gray-300 z-10"
          title="Buscar"
        >
          🔍
        </Link>
        <button
          onClick={() => setMenuAbierto(true)}
          className="absolute top-4 right-4 text-3xl text-gray-600 dark:text-gray-300 leading-none z-10"
        >
          ☰
        </button>
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="delbarrio.com"
            className="h-24 object-contain"
          />
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Productos />} />
          <Route path="/vender" element={<Vender />} />
          <Route path="/entrada" element={<EntradaMercaderia />} />
          <Route path="/lista" element={<ListaCompras />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/cierre" element={<CierreCaja />} />
          <Route path="/nuevo" element={<NuevoProducto />} />
          <Route path="/ticket/:id" element={<Ticket />} />
          <Route path="/editar/:id" element={<EditarProducto />} />
          <Route path="*" element={<Productos />} />
        </Routes>
      </main>
      <BotonVender />
      <MenuLateral
        abierto={menuAbierto}
        cerrar={() => setMenuAbierto(false)}
        esAdmin={false}
        local={local}
        cerrarSesion={cerrarSesion}
      />
    </div>
  )
}

export default function App() {
  const { user, esAdmin, local, cargando, cerrarSesion } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      {esAdmin
        ? <AppAdmin esAdmin={esAdmin} local={local} cerrarSesion={cerrarSesion} />
        : <AppLocal esAdmin={esAdmin} local={local} cerrarSesion={cerrarSesion} />
      }
    </BrowserRouter>
  )
}


