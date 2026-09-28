import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarProductos, guardarVenta } from '../lib/api'
import Escaner from '../components/Escaner'

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', color: 'bg-green-500' },
  { id: 'transferencia', label: 'Transferencia', color: 'bg-blue-500' },
  { id: 'mercadopago', label: 'Mercado Pago', color: 'bg-cyan-500' },
  { id: 'tarjeta', label: 'Tarjeta', color: 'bg-purple-500' }
]

export default function Vender() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarMetodos, setMostrarMetodos] = useState(false)
  const [escaneando, setEscaneando] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const data = await listarProductos()
      setProductos(data)
    } catch (e) {
      setMensaje('Error: ' + e.message)
    }
    setCargando(false)
  }

  const categorias = useMemo(() => {
    const set = new Set(productos.map(p => p.categoria || 'Sin categoria'))
    return ['Todas', ...Array.from(set).sort()]
  }, [productos])

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
      setMensaje('Producto no encontrado: ' + codigo)
      setTimeout(() => setMensaje(null), 3000)
    }
  }

  const total = carrito.reduce(
    (sum, i) => sum + Number(i.precio) * i.cantidad, 0
  )

  async function cobrarCon(metodo) {
    setMostrarMetodos(false)
    try {
      const venta = await guardarVenta(carrito, metodo)
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
    <div className="p-4 max-w-2xl mx-auto pb-40">
      <h1 className="text-2xl font-bold mb-4 text-barrio-700">Vender</h1>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-green-700 text-sm">
          {mensaje}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Buscar o escanear..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 p-3 rounded-xl border border-gray-200 text-lg"
        />
        <button
          onClick={() => setEscaneando(true)}
          className="bg-barrio-500 text-white px-4 rounded-xl font-bold text-2xl"
        >
          📷
        </button>
      </div>

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

      {cargando ? (
        <p className="text-center text-gray-500 py-8">Cargando...</p>
      ) : filtrados.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No se encontraron productos.
        </p>
      ) : (
        <div className="space-y-2">
          {filtrados.map(p => (
            <button
              key={p.id}
              onClick={() => agregar(p)}
              className="w-full bg-white rounded-xl p-4 flex justify-between items-center shadow-sm text-left"
            >
              <div>
                <p className="font-semibold text-gray-800">{p.nombre}</p>
                <p className="text-sm text-gray-500">
                  ${Number(p.precio).toLocaleString('es-AR')} — stock {Number(p.stock_actual)} {p.unidad}
                </p>
              </div>
              <span className="text-2xl text-barrio-500 font-bold">+</span>
            </button>
          ))}
        </div>
      )}

      {carrito.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg p-4 max-h-96 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <p className="font-bold text-gray-700 mb-2">Carrito</p>
            {carrito.map(i => (
              <div key={i.id} className="flex justify-between items-center py-1">
                <span className="text-sm">{i.nombre} x {i.cantidad}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
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
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <span className="font-bold text-lg">
                Total: ${total.toLocaleString('es-AR')}
              </span>
              <button
                onClick={() => setMostrarMetodos(true)}
                className="bg-barrio-500 text-white px-6 py-3 rounded-xl font-bold"
              >
                COBRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarMetodos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-4">
            <p className="text-lg font-bold mb-3 text-center">¿Cómo paga?</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {METODOS.map(m => (
                <button
                  key={m.id}
                  onClick={() => cobrarCon(m.id)}
                  className={m.color + ' text-white py-5 rounded-xl font-bold text-lg'}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMostrarMetodos(false)}
              className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold"
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
    </div>
  )
}


