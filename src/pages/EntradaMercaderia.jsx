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
    <div className="p-4 max-w-2xl mx-auto pb-44">
      <h1 className="text-2xl font-bold mb-4 text-barrio-700">Entrada de mercaderia</h1>

      {mensaje && (
        <div className={'rounded-xl p-3 mb-3 text-sm ' + (mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200')}>
          {mensaje.txt}
        </div>
      )}

      <button
        onClick={() => setEscaneando(true)}
        className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg mb-3"
      >
        📷 Escanear producto
      </button>

      <input
        type="text"
        placeholder="O buscar por nombre..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full p-3 rounded-xl border border-gray-200 mb-3 text-lg"
      />

      {cargando ? (
        <p className="text-center text-gray-500 py-8">Cargando...</p>
      ) : busqueda && filtrados.length > 0 ? (
        <div className="space-y-2 mb-4">
          {filtrados.slice(0, 10).map(p => (
            <button
              key={p.id}
              onClick={() => seleccionarProducto(p)}
              className="w-full bg-white rounded-xl p-3 flex justify-between items-center shadow-sm text-left"
            >
              <div>
                <p className="font-semibold text-gray-800 text-sm">{p.nombre}</p>
                <p className="text-xs text-gray-500">
                  stock: {Number(p.stock_actual)} {p.unidad}
                </p>
              </div>
              <span className="text-barrio-500 font-bold text-xl">+</span>
            </button>
          ))}
        </div>
      ) : null}

      {lista.length > 0 && (
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold text-gray-700">
              Por ingresar ({lista.length})
            </p>
            <span className="text-sm text-gray-500">
              {totalUnidades} unidades
            </span>
          </div>
          {lista.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-2 border-b last:border-b-0">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{item.nombre}</p>
                <p className="text-xs text-gray-500">
                  {Number(item.stock_actual)} → {Number(item.stock_actual) + Number(item.cantidad)} {item.unidad}
                </p>
              </div>
              <input
                type="number"
                step="0.001"
                value={item.cantidad}
                onChange={e => editarCantidad(item.id, e.target.value)}
                className="w-20 p-2 rounded-lg border border-gray-200 text-center font-bold"
              />
              <button
                onClick={() => quitarItem(item.id)}
                className="text-red-500 text-xl"
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
          className="fixed bottom-20 left-4 right-4 max-w-2xl mx-auto bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <p className="font-bold text-lg mb-1">{seleccionado.nombre}</p>
            <p className="text-sm text-gray-500 mb-4">
              Stock actual: {Number(seleccionado.stock_actual)} {seleccionado.unidad}
            </p>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full p-3 rounded-xl border border-gray-200 text-2xl font-bold text-center mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSeleccionado(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCantidad}
                disabled={!cantidad || Number(cantidad) <= 0}
                className="flex-1 bg-barrio-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
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


