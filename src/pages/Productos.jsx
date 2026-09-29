import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarProductos, ajustarStock, borrarProducto, actualizarProducto } from '../lib/api'
import Escaner from '../components/Escaner'

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
  const [escaneando, setEscaneando] = useState(false)
  const [reponiendo, setReponiendo] = useState(null)
  const [cantidad, setCantidad] = useState('')
  const [mensaje, setMensaje] = useState(null)

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

  function mostrarMensaje(txt, tipo = 'ok') {
    setMensaje({ txt, tipo })
    setTimeout(() => setMensaje(null), 2500)
  }

  async function cambiarStock(p, delta) {
    try {
      const actualizado = await ajustarStock(p.id, delta)
      setProductos(productos.map(x => x.id === p.id ? actualizado : x))
    } catch (e) {
      mostrarMensaje('Error: ' + e.message, 'error')
    }
  }

  function abrirReponer(p) {
    setReponiendo(p)
    setCantidad('')
  }

  async function confirmarReponer() {
    const cant = Number(cantidad)
    if (!cant || cant <= 0) return
    try {
      const actualizado = await actualizarProducto(reponiendo.id, {
        stock_actual: Number(reponiendo.stock_actual) + cant
      })
      setProductos(productos.map(x => x.id === reponiendo.id ? actualizado : x))
      mostrarMensaje('Repuesto: ' + reponiendo.nombre + ' +' + cant)
      setReponiendo(null)
      setCantidad('')
    } catch (e) {
      mostrarMensaje('Error: ' + e.message, 'error')
    }
  }

  function alEscanearReponer(codigo) {
    setEscaneando(false)
    const producto = productos.find(p => p.codigo_barras === codigo)
    if (producto) {
      setReponiendo(producto)
      setCantidad('')
    } else {
      if (confirm('Producto no encontrado con codigo ' + codigo + '.\n¿Queres cargarlo?')) {
        navigate('/nuevo')
      }
    }
  }

  async function eliminar(p) {
    if (!confirm('Borrar ' + p.nombre + '?')) return
    try {
      await borrarProducto(p.id)
      setProductos(productos.filter(x => x.id !== p.id))
    } catch (e) {
      mostrarMensaje('Error: ' + e.message, 'error')
    }
  }

  function estadoStock(p) {
    if (p.stock_actual <= 0) return { color: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400', txt: 'Agotado' }
    if (p.stock_actual <= p.stock_minimo) return { color: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400', txt: 'Reponer' }
    return { color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400', txt: 'OK' }
  }

  function estadoVencimiento(p) {
    const dias = diasParaVencer(p.fecha_vencimiento)
    if (dias === null) return null
    if (dias < 0) return { color: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400', txt: 'Vencido' }
    if (dias <= 30) return { color: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400', txt: 'Vence ' + dias + 'd' }
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

  const totalReponer = productos.filter(p =>
    Number(p.stock_actual) <= Number(p.stock_minimo)
  ).length

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Productos</h1>
          <span className="text-xs text-gray-400 font-medium">
            {productos.length} en total
          </span>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-50 dark:bg-stone-900 border border-transparent text-gray-800 dark:text-gray-100 text-base focus:outline-none focus:bg-white dark:focus:bg-stone-900 focus:border-barrio-500"
            />
          </div>
          <button
            onClick={() => setEscaneando(true)}
            className="bg-barrio-500 text-white px-4 rounded-xl text-xl"
            title="Reponer con escaner"
          >
            📷
          </button>
        </div>

        {(totalPorVencer > 0 || totalReponer > 0) && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {totalReponer > 0 && (
              <button
                onClick={() => { setSoloPorVencer(false); setCategoriaFiltro('Todas') }}
                className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
              >
                ⚠️ {totalReponer} para reponer
              </button>
            )}
            {totalPorVencer > 0 && (
              <button
                onClick={() => setSoloPorVencer(!soloPorVencer)}
                className={
                  'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ' +
                  (soloPorVencer
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900')
                }
              >
                📅 {totalPorVencer} por vencer
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={
                'px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ' +
                (categoriaFiltro === cat
                  ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-stone-900 text-gray-600 dark:text-gray-300')
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {mensaje && (
        <div className="px-4 mb-3">
          <div className={
            'rounded-xl p-3 text-sm border ' +
            (mensaje.tipo === 'error'
              ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900')
          }>
            {mensaje.txt}
          </div>
        </div>
      )}

      <div className="px-4">
        {cargando && (
          <div className="text-center text-gray-400 py-12">Cargando...</div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4 text-red-700 dark:text-red-300">
            <p className="font-semibold mb-1">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!cargando && !error && filtrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-gray-500 dark:text-gray-400">
              {busqueda ? 'Sin resultados' : 'No hay productos todavia'}
            </p>
          </div>
        )}

        {!cargando && !error && categoriasOrdenadas.map(cat => (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {cat}
              </h2>
              <span className="text-xs text-gray-300 dark:text-gray-600">
                {grupos[cat].length}
              </span>
            </div>

            <div className="space-y-2">
              {grupos[cat].map(p => {
                const est = estadoStock(p)
                const ven = estadoVencimiento(p)
                return (
                  <div key={p.id} className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-stone-800">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        onClick={() => navigate('/editar/' + p.id)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {p.nombre}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          ${Number(p.precio).toLocaleString('es-AR')}
                          <span className="text-gray-400 dark:text-gray-500"> / {p.unidad}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={'text-[10px] font-bold px-2 py-1 rounded-full uppercase ' + est.color}>
                          {est.txt}
                        </span>
                        {ven && (
                          <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + ven.color}>
                            {ven.txt}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => cambiarStock(p, -1)}
                          className="w-9 h-9 rounded-full bg-gray-50 dark:bg-stone-800 text-gray-600 dark:text-gray-300 text-lg font-medium active:bg-gray-100 dark:active:bg-stone-700"
                        >
                          −
                        </button>
                        <span className="font-bold text-gray-800 dark:text-gray-100 text-base min-w-[60px] text-center">
                          {Number(p.stock_actual)}
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">
                            {p.unidad}
                          </span>
                        </span>
                        <button
                          onClick={() => cambiarStock(p, 1)}
                          className="w-9 h-9 rounded-full bg-gray-50 dark:bg-stone-800 text-gray-600 dark:text-gray-300 text-lg font-medium active:bg-gray-100 dark:active:bg-stone-700"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => abrirReponer(p)}
                          className="text-xs font-semibold text-barrio-600 dark:text-barrio-500 px-3 py-2 rounded-lg"
                        >
                          Reponer
                        </button>
                        <button
                          onClick={() => eliminar(p)}
                          className="text-gray-300 dark:text-gray-600 text-lg px-1"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {escaneando && (
        <Escaner
          onDetectado={alEscanearReponer}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      {reponiendo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
            <p className="font-bold text-lg mb-1 text-gray-800 dark:text-gray-100">
              {reponiendo.nombre}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Stock actual: {Number(reponiendo.stock_actual)} {reponiendo.unidad}
            </p>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
              ¿Cuántas unidades llegaron?
            </label>
            <input
              type="number"
              step="0.001"
              autoFocus
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmarReponer()}
              placeholder="0"
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-2xl font-bold text-center mb-4 focus:outline-none focus:border-barrio-500"
            />
            {cantidad && Number(cantidad) > 0 && (
              <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 mb-3 font-medium">
                Nuevo stock: {(Number(reponiendo.stock_actual) + Number(cantidad))} {reponiendo.unidad}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setReponiendo(null)}
                className="flex-1 bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarReponer}
                disabled={!cantidad || Number(cantidad) <= 0}
                className="flex-1 bg-barrio-500 text-white py-3 rounded-xl font-bold disabled:opacity-40"
              >
                Reponer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


