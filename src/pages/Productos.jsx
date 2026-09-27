import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre')
    if (error) {
      setError(error.message)
      setProductos([])
    } else {
      setProductos(data || [])
    }
    setCargando(false)
  }

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo_barras || '').includes(busqueda)
  )

  function estadoStock(p) {
    if (p.stock_actual <= 0) return { color: 'bg-red-100 text-red-700', txt: 'Agotado' }
    if (p.stock_actual <= p.stock_minimo) return { color: 'bg-yellow-100 text-yellow-700', txt: 'Reponer' }
    return { color: 'bg-green-100 text-green-700', txt: 'OK' }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-barrio-700">Productos</h1>

      <input
        type="text"
        placeholder="Buscar por nombre o codigo..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full p-3 rounded-xl border border-gray-200 mb-4 text-lg focus:outline-none focus:border-barrio-500"
      />

      {cargando && <p className="text-center text-gray-500 py-8">Cargando...</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-semibold mb-1">Error al cargar productos</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!cargando && !error && filtrados.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          {busqueda ? 'No se encontraron productos.' : 'No hay productos todavia.'}
        </p>
      )}

      {!cargando && !error && filtrados.map(p => {
        const est = estadoStock(p)
        return (
          <div key={p.id} className="bg-white rounded-xl p-4 mb-2 flex justify-between items-center shadow-sm">
            <div>
              <p className="font-semibold text-gray-800">{p.nombre}</p>
              <p className="text-sm text-gray-500">
                ${Number(p.precio).toLocaleString('es-AR')} / {p.unidad}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">
                {Number(p.stock_actual)} {p.unidad}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full ${est.color}`}>
                {est.txt}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
