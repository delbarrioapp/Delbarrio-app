import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarProductos, ajustarStock, borrarProducto } from '../lib/api'

function diasParaVencer(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vence = new Date(fecha + 'T00:00:00')
  return Math.floor((vence - hoy) / (1000 * 60 * 60 * 24))
}

export default function Productos() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [soloPorVencer, setSoloPorVencer] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const data = await listarProductos()
      setProductos(data)
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  async function cambiarStock(p, delta) {
    try {
      const actualizado = await ajustarStock(p.id, delta)
      setProductos(productos.map(x => x.id === p.id ? actualizado : x))
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  async function eliminar(p) {
    if (!confirm('Borrar ' + p.nombre + '?')) return
    try {
      await borrarProducto(p.id)
      setProductos(productos.filter(x => x.id !== p.id))
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  function estadoStock(p) {
    if (p.stock_actual <= 0) return { color: 'bg-red-100 text-red-700', txt: 'Agotado' }
    if (p.stock_actual <= p.stock_minimo) return { color: 'bg-yellow-100 text-yellow-700', txt: 'Reponer' }
    return { color: 'bg-green-100 text-green-700', txt: 'OK' }
  }

  function estadoVencimiento(p) {
    const dias = diasParaVencer(p.fecha_vencimiento)
    if (dias === null) return null
    if (dias < 0) return { color: 'bg-red-100 text-red-700', txt: 'VENCIDO' }
    if (dias <= 30) return { color: 'bg-orange-100 text-orange-700', txt: 'Vence en ' + dias + 'd' }
    return null
  }

  const categorias = useMemo(() => {
    const set = new Set(productos.map(p => p.categoria || 'Sin categoria'))
    return ['Todas', ...Array.from(set).sort()]
  }, [productos])

  const filtrados = productos.filter(p => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo_barras || '').includes(busqueda)
    const coincideCategoria =
      categoriaFiltro === 'Todas' ||
      (p.categoria || 'Sin categoria') === categoriaFiltro
    const dias = diasParaVencer(p.fecha_vencimiento)
    const coincideVencimiento = !soloPorVencer || (dias !== null && dias <= 30)
    return coincideBusqueda && coincideCategoria && coincideVencimiento
  })

  const grupos = useMemo(() => {
    const g = {}
    filtrados.forEach(p => {
      const cat = p.categoria || 'Sin categoria'
      if (!g[cat]) g[cat] = []
      g[cat].push(p)
    })
    return g
  }, [filtrados])

  const categoriasOrdenadas = Object.keys(grupos).sort()

  const totalPorVencer = productos.filter(p => {
    const dias = diasParaVencer(p.fecha_vencimiento)
    return dias !== null && dias <= 30
  }).length

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-barrio-700">Productos</h1>
        <span className="text-sm text-gray-500">{productos.length} en total</span>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o codigo..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full p-3 rounded-xl border border-gray-200 mb-3 text-lg focus:outline-none focus:border-barrio-500"
      />

      {totalPorVencer > 0 && (
        <button
          onClick={() => setSoloPorVencer(!soloPorVencer)}
          className={
            'w-full mb-3 p-3 rounded-xl font-semibold text-left ' +
            (soloPorVencer
              ? 'bg-orange-500 text-white'
              : 'bg-orange-50 text-orange-700 border border-orange-200')
          }
        >
          ⚠️ {totalPorVencer} producto{totalPorVencer > 1 ? 's' : ''} por vencer
          {soloPorVencer ? ' (tocá para ver todos)' : ' (tocá para ver solo estos)'}
        </button>
      )}

      <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaFiltro(cat)}
            className={
              'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ' +
              (categoriaFiltro === cat
                ? 'bg-barrio-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200')
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {cargando && <p className="text-center text-gray-500 py-8">Cargando...</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-semibold mb-1">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!cargando && !error && filtrados.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          {busqueda || categoriaFiltro !== 'Todas' || soloPorVencer
            ? 'No se encontraron productos.'
            : 'No hay productos todavia.'}
        </p>
      )}

      {!cargando && !error && categoriasOrdenadas.map(cat => (
        <div key={cat} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-bold text-barrio-700 uppercase tracking-wide">
              {cat}
            </h2>
            <span className="text-xs text-gray-400">({grupos[cat].length})</span>
          </div>

          {grupos[cat].map(p => {
            const est = estadoStock(p)
            const ven = estadoVencimiento(p)
            return (
              <div key={p.id} className="bg-white rounded-xl p-4 mb-2 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div onClick={() => navigate('/editar/' + p.id)} className="flex-1 cursor-pointer">
                    <p className="font-semibold text-gray-800">{p.nombre}</p>
                    <p className="text-sm text-gray-500">
                      ${Number(p.precio).toLocaleString('es-AR')} / {p.unidad}
                    </p>
                    {ven && (
                      <span className={'inline-block mt-1 text-xs px-2 py-0.5 rounded-full ' + ven.color}>
                        {ven.txt}
                      </span>
                    )}
                  </div>
                  <span className={'text-xs px-2 py-1 rounded-full ' + est.color}>
                    {est.txt}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => cambiarStock(p, -1)}
                      className="w-10 h-10 rounded-full bg-red-100 text-red-600 text-xl font-bold"
                    >
                      −
                    </button>
                    <span className="font-bold text-lg min-w-[80px] text-center">
                      {Number(p.stock_actual)} {p.unidad}
                    </span>
                    <button
                      onClick={() => cambiarStock(p, 1)}
                      className="w-10 h-10 rounded-full bg-green-100 text-green-600 text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => eliminar(p)}
                    className="text-red-500 text-sm px-3 py-2"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}


