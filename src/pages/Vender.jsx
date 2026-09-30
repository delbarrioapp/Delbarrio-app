import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarProductos, listarPromosActivas, calcularDescuentos, guardarVenta } from '../lib/api'
import Escaner from '../components/Escaner'

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', color: 'bg-emerald-500' },
  { id: 'transferencia', label: 'Transferencia', color: 'bg-blue-500' },
  { id: 'mercadopago', label: 'Mercado Pago', color: 'bg-cyan-500' },
  { id: 'tarjeta', label: 'Tarjeta', color: 'bg-purple-500' }
]

export default function Vender() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [promos, setPromos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarMetodos, setMostrarMetodos] = useState(false)
  const [escaneando, setEscaneando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const [prods, prms] = await Promise.all([
        listarProductos(),
        listarPromosActivas()
      ])
      setProductos(prods)
      setPromos(prms)
    } catch (e) {
      setMensaje('Error: ' + e.message)
    }
    setCargando(false)
  }

  const categorias = useMemo(() => {
    const set = new Set(productos.map(p => p.categoria || 'Sin categoria'))
    return ['Todas', ...Array.from(set).sort()]
  }, [productos])

  const { descuentos, totalDescuento, subtotal } = useMemo(
    () => calcularDescuentos(carrito, promos),
    [carrito, promos]
  )

  const total = subtotal - totalDescuento

  function agregar(p) {
    const enCarrito = carrito.find(i => i.id === p.id)
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0

    if (Number(p.stock_actual) <= cantidadEnCarrito) {
      setMensaje('Sin stock suficiente de ' + p.nombre)
      setTimeout(() => setMensaje(null), 2000)
      return
    }

    if (enCarrito) {
      setCarrito(carrito.map(i =>
        i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i
      ))
    } else {
      setCarrito([...carrito, { ...p, cantidad: 1 }])
    }
  }

  function quitar(id) {
    const item = carrito.find(i => i.id === id)
    if (item.cantidad === 1) {
      setCarrito(carrito.filter(i => i.id !== id))
    } else {
      setCarrito(carrito.map(i =>
        i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i
      ))
    }
  }

  function alEscanear(codigo) {
    setEscaneando(false)
    const producto = productos.find(p => p.codigo_barras === codigo)
    if (producto) {
      agregar(producto)
      setMensaje('Agregado: ' + producto.nombre)
      setTimeout(() => setMensaje(null), 1500)
    } else {
      setNoEncontrado(codigo)
    }
  }

  function crearProductoNuevo() {
    navigate('/nuevo?codigo=' + encodeURIComponent(noEncontrado) + '&volver=/vender')
  }

  async function cobrarCon(metodo) {
    setMostrarMetodos(false)
    try {
      const venta = await guardarVenta(carrito, metodo, total)
      setCarrito([])
      navigate('/ticket/' + venta.id)
    } catch (e) {
      setMensaje('Error al cobrar: ' + e.message)
    }
  }

  const filtrados = productos.filter(p => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo_barras || '').includes(busqueda)
    const coincideCategoria =
      categoriaFiltro === 'Todas' ||
      (p.categoria || 'Sin categoria') === categoriaFiltro
    return coincideBusqueda && coincideCategoria
  })

  return (
    <div className="px-4 pt-5 pb-40">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Vender</h1>
        {promos.length > 0 && (
          <span className="text-xs font-semibold text-barrio-600 dark:text-barrio-500">
            🎉 {promos.length} promo{promos.length > 1 ? 's' : ''} activa{promos.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {mensaje && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 mb-3 text-emerald-700 dark:text-emerald-300 text-sm">
          {mensaje}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar o escanear..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-50 dark:bg-stone-900 border border-transparent text-gray-800 dark:text-gray-100 text-base focus:outline-none focus:bg-white dark:focus:bg-stone-900 focus:border-barrio-500"
          />
        </div>
        <button
          onClick={() => setEscaneando(true)}
          className="bg-barrio-500 text-white px-4 rounded-xl text-xl"
        >
          📷
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4">
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

      {cargando ? (
        <div className="text-center text-gray-400 py-12">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-gray-500 dark:text-gray-400">Sin resultados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(p => {
            const promoActiva = promos.some(pr => {
              const c = pr.config || {}
              return c.producto_id === p.id || c.categoria === p.categoria
            })
            return (
              <button
                key={p.id}
                onClick={() => agregar(p)}
                className="w-full bg-white dark:bg-stone-900 rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100 dark:border-stone-800 text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {p.nombre}
                    {promoActiva && <span className="ml-2 text-xs">🎉</span>}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    ${Number(p.precio).toLocaleString('es-AR')}
                    <span className="text-gray-400"> — stock {Number(p.stock_actual)} {p.unidad}</span>
                  </p>
                </div>
                <span className="text-2xl text-barrio-500 font-bold ml-2">+</span>
              </button>
            )
          })}
        </div>
      )}

      {carrito.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-gray-100 dark:border-stone-800 shadow-2xl p-4 max-h-[60vh] overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Carrito
            </p>
            {carrito.map(i => (
              <div key={i.id} className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate mr-2">
                  {i.nombre}
                  <span className="text-gray-400"> × {i.cantidad}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    ${(Number(i.precio) * i.cantidad).toLocaleString('es-AR')}
                  </span>
                  <button
                    onClick={() => quitar(i.id)}
                    className="text-red-500 text-lg"
                  >
                    −
                  </button>
                </div>
              </div>
            ))}

            {descuentos.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-stone-800 space-y-1">
                {descuentos.map((d, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span className="truncate">🎉 {d.promo}</span>
                    <span>-${d.monto.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-stone-800">
              <div>
                <p className="font-bold text-lg text-gray-800 dark:text-gray-100">
                  Total: ${total.toLocaleString('es-AR')}
                </p>
                {totalDescuento > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Ahorro: ${totalDescuento.toLocaleString('es-AR')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setMostrarMetodos(true)}
                className="bg-barrio-500 text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform"
              >
                COBRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarMetodos && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white dark:bg-stone-900 w-full rounded-t-2xl p-4">
            <p className="text-lg font-bold mb-1 text-center text-gray-800 dark:text-gray-100">
              ¿Cómo paga?
            </p>
            <p className="text-center text-2xl font-bold text-barrio-600 dark:text-barrio-500 mb-3">
              ${total.toLocaleString('es-AR')}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {METODOS.map(m => (
                <button
                  key={m.id}
                  onClick={() => cobrarCon(m.id)}
                  className={m.color + ' text-white py-5 rounded-xl font-bold text-lg active:scale-95 transition-transform'}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMostrarMetodos(false)}
              className="w-full bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {escaneando && (
        <Escaner
          onDetectado={alEscanear}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      {noEncontrado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
            <p className="text-3xl text-center mb-3">📷</p>
            <p className="font-bold text-lg text-center text-gray-800 dark:text-gray-100 mb-2">
              Producto no encontrado
            </p>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 font-mono mb-4 break-all">
              {noEncontrado}
            </p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-5">
              ¿Queres cargarlo ahora?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setNoEncontrado(null)}
                className="flex-1 bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={crearProductoNuevo}
                className="flex-1 bg-barrio-500 text-white py-3 rounded-xl font-bold"
              >
                Cargar producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


