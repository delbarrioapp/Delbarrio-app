import { useEffect, useState } from 'react'
import { listarProductos, actualizarProducto } from '../lib/api'
import Escaner from '../components/Escaner'

export default function EntradaMercaderia() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [lista, setLista] = useState([])
  const [escaneando, setEscaneando] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [cantidad, setCantidad] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const data = await listarProductos()
      setProductos(data)
    } catch (e) {
      setMensaje({ tipo: 'error', txt: e.message })
    }
    setCargando(false)
  }

  function seleccionarProducto(p) {
    setSeleccionado(p)
    setCantidad('')
  }

  function confirmarCantidad() {
    const cant = Number(cantidad)
    if (!cant || cant <= 0) return

    const existente = lista.find(i => i.id === seleccionado.id)
    if (existente) {
      setLista(lista.map(i =>
        i.id === seleccionado.id ? { ...i, cantidad: i.cantidad + cant } : i
      ))
    } else {
      setLista([...lista, { ...seleccionado, cantidad: cant }])
    }

    setSeleccionado(null)
    setCantidad('')
  }

  function quitarItem(id) {
    setLista(lista.filter(i => i.id !== id))
  }

  function editarCantidad(id, nueva) {
    const cant = Number(nueva)
    if (cant <= 0) return quitarItem(id)
    setLista(lista.map(i => i.id === id ? { ...i, cantidad: cant } : i))
  }

  function alEscanear(codigo) {
    setEscaneando(false)
    const producto = productos.find(p => p.codigo_barras === codigo)
    if (producto) {
      seleccionarProducto(producto)
    } else {
      setMensaje({ tipo: 'error', txt: 'Producto no encontrado: ' + codigo })
      setTimeout(() => setMensaje(null), 3000)
    }
  }

  async function confirmarEntrada() {
    if (lista.length === 0) return
    setConfirmando(true)
    try {
      for (const item of lista) {
        await actualizarProducto(item.id, {
          stock_actual: Number(item.stock_actual) + Number(item.cantidad)
        })
      }
      setMensaje({ tipo: 'ok', txt: 'Entrada confirmada: ' + lista.length + ' productos actualizados' })
      setLista([])
      cargar()
      setTimeout(() => setMensaje(null), 3000)
    } catch (e) {
      setMensaje({ tipo: 'error', txt: 'Error: ' + e.message })
    }
    setConfirmando(false)
  }

  const totalUnidades = lista.reduce((s, i) => s + Number(i.cantidad), 0)
  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo_barras || '').includes(busqueda)
  )

  return (
    <div className="px-4 pt-5 pb-44">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Entrada de mercaderia
      </h1>

      {mensaje && (
        <div className={
          'rounded-xl p-3 mb-3 text-sm border ' +
          (mensaje.tipo === 'error'
            ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
            : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900')
        }>
          {mensaje.txt}
        </div>
      )}

      <button
        onClick={() => setEscaneando(true)}
        className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg mb-3 active:scale-[0.98] transition-transform"
      >
        📷 Escanear producto
      </button>

      <input
        type="text"
        placeholder="O buscar por nombre..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-stone-900 border border-transparent text-gray-800 dark:text-gray-100 text-base mb-3 focus:outline-none focus:bg-white dark:focus:bg-stone-900 focus:border-barrio-500"
      />

      {cargando ? (
        <div className="text-center text-gray-400 py-12">Cargando...</div>
      ) : busqueda && filtrados.length > 0 ? (
        <div className="space-y-2 mb-4">
          {filtrados.slice(0, 10).map(p => (
            <button
              key={p.id}
              onClick={() => seleccionarProducto(p)}
              className="w-full bg-white dark:bg-stone-900 rounded-xl p-3 flex justify-between items-center shadow-sm border border-gray-100 dark:border-stone-800 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                  {p.nombre}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  stock: {Number(p.stock_actual)} {p.unidad}
                </p>
              </div>
              <span className="text-barrio-500 font-bold text-xl ml-2">+</span>
            </button>
          ))}
        </div>
      ) : null}

      {lista.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold text-gray-700 dark:text-gray-200">
              Por ingresar ({lista.length})
            </p>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalUnidades} unidades
            </span>
          </div>
          {lista.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-stone-800 last:border-b-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {item.nombre}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {Number(item.stock_actual)} → {Number(item.stock_actual) + Number(item.cantidad)} {item.unidad}
                </p>
              </div>
              <input
                type="number"
                step="0.001"
                value={item.cantidad}
                onChange={e => editarCantidad(item.id, e.target.value)}
                className="w-20 p-2 rounded-lg bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-center font-bold focus:outline-none focus:border-barrio-500"
              />
              <button
                onClick={() => quitarItem(item.id)}
                className="text-red-500 text-xl px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {lista.length > 0 && (
        <button
          onClick={confirmarEntrada}
          disabled={confirmando}
          className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {confirmando ? 'Guardando...' : 'Confirmar entrada (' + lista.length + ')'}
        </button>
      )}

      {escaneando && (
        <Escaner
          onDetectado={alEscanear}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      {seleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
            <p className="font-bold text-lg mb-1 text-gray-800 dark:text-gray-100">
              {seleccionado.nombre}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Stock actual: {Number(seleccionado.stock_actual)} {seleccionado.unidad}
            </p>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              ¿Cuántas unidades llegaron?
            </label>
            <input
              type="number"
              step="0.001"
              autoFocus
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmarCantidad()}
              placeholder="0"
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-2xl font-bold text-center mb-4 focus:outline-none focus:border-barrio-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSeleccionado(null)}
                className="flex-1 bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCantidad}
                disabled={!cantidad || Number(cantidad) <= 0}
                className="flex-1 bg-barrio-500 text-white py-3 rounded-xl font-bold disabled:opacity-40"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


