import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Productos from './pages/Productos'
import NuevoProducto from './pages/NuevoProducto'
import Vender from './pages/Vender'
import Ventas from './pages/Ventas'
import CierreCaja from './pages/CierreCaja'
import EntradaMercaderia from './pages/EntradaMercaderia'
import EditarProducto from './pages/EditarProducto'

function Nav() {
  const { pathname } = useLocation()
  const tabs = [
    { to: '/', label: 'Stock' },
    { to: '/vender', label: 'Vender' },
    { to: '/entrada', label: 'Entrada' },
    { to: '/ventas', label: 'Ventas' },
    { to: '/cierre', label: 'Caja' },
    { to: '/nuevo', label: 'Nuevo' }
  ]
  return (
    <nav className="flex border-t bg-white overflow-x-auto">
      {tabs.map(t => (
        <Link
          key={t.to}
          to={t.to}
          className={
            'flex-1 text-center py-4 font-semibold text-xs whitespace-nowrap px-2 ' +
            (pathname === t.to ? 'text-barrio-600' : 'text-gray-500')
          }
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <header className="bg-barrio-500 text-white p-4 shadow">
          <h1 className="text-xl font-bold">delbarrio.com</h1>
        </header>
        <main className="flex-1 pb-2">
          <Routes>
            <Route path="/" element={<Productos />} />
            <Route path="/vender" element={<Vender />} />
            <Route path="/entrada" element={<EntradaMercaderia />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/cierre" element={<CierreCaja />} />
            <Route path="/nuevo" element={<NuevoProducto />} />
            <Route path="/editar/:id" element={<EditarProducto />} />
          </Routes>
        </main>
        <Nav />
      </div>
    </BrowserRouter>
  )
}


