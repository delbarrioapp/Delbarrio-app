import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Productos from './pages/Productos'
import NuevoProducto from './pages/NuevoProducto'
import Vender from './pages/Vender'
import Ventas from './pages/Ventas'
import CierreCaja from './pages/CierreCaja'
import EntradaMercaderia from './pages/EntradaMercaderia'
import ListaCompras from './pages/ListaCompras'
import Ticket from './pages/Ticket'
import EditarProducto from './pages/EditarProducto'

const MENU = [
  { to: '/', label: 'Stock', icon: '📦' },
  { to: '/ventas', label: 'Ventas de hoy', icon: '📊' },
  { to: '/entrada', label: 'Entrada mercaderia', icon: '📥' },
  { to: '/lista', label: 'Lista de compras', icon: '📝' },
  { to: '/cierre', label: 'Cierre de caja', icon: '💵' },
  { to: '/nuevo', label: 'Nuevo producto', icon: '➕' }
]

function MenuLateral({ abierto, cerrar }) {
  const { pathname } = useLocation()
  if (!abierto) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={cerrar}></div>
      <div className="w-72 bg-white h-full shadow-lg overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <span className="font-bold text-barrio-700">Menu</span>
          <button onClick={cerrar} className="text-2xl text-gray-500 leading-none">×</button>
        </div>
        <div className="py-2">
          {MENU.map(m => (
            <Link
              key={m.to}
              to={m.to}
              onClick={cerrar}
              className={
                'flex items-center gap-3 px-4 py-4 text-base ' +
                (pathname === m.to
                  ? 'bg-orange-50 text-barrio-700 font-semibold'
                  : 'text-gray-700')
              }
            >
              <span className="text-2xl">{m.icon}</span>
              <span>{m.label}</span>
            </Link>
          ))}
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

export default function App() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b shadow-sm px-4 py-3 relative">
          <button
            onClick={() => setMenuAbierto(true)}
            className="absolute top-4 right-4 text-3xl text-gray-600 leading-none z-10"
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
            <Route path="/cierre" element={<CierreCaja />} />
            <Route path="/nuevo" element={<NuevoProducto />} />
            <Route path="/ticket/:id" element={<Ticket />} />
            <Route path="/editar/:id" element={<EditarProducto />} />
          </Routes>
        </main>
        <BotonVender />
        <MenuLateral abierto={menuAbierto} cerrar={() => setMenuAbierto(false)} />
      </div>
    </BrowserRouter>
  )
}


