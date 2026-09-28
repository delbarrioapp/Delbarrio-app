import { useEffect, useState } from 'react'
import { listarProductos, ajustarStock } from '../lib/api'

export default function Vender() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const data = await listarProductos()
      setProductos(data)
    } catch (e) {
      setMensaje('Error al cargar: ' + e.message)
    }
    setCargando(false)
  }

  function agregar(p) {
    const existe = carrito.find(i => i.id === p.id)
    if (existe) {
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

  const total = carrito.reduce(
    (sum, i) => sum + Number(i.precio) * i.cantidad, 0
  )

  async function cobrar() {
    if (carrito.length === 0) return
    try {
      for (const item of carrito) {
        await ajustarStock(item.id, -item.cantidad)
      }
      setMensaje('Venta registrada: $' + total.toLocaleString('es-AR'))
      setCarrito([])
      cargar()
      setTimeout(() => setMensaje(null), 3000)
    } catch (e) {
      setMensaje('Error al cobrar: ' + e.message)
    }
  }

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="p-4 max-w-2xl mx-auto pb-40">
      <h1 className="text-2xl font-bold mb-4 text-barrio-700">Vender</h1>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-green-700 text-sm">
          {mensaje}
        </div>
      )}

      <input
        type="text"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full p-3 rounded-xl border border-gray-200 mb-4 text-lg"
      />

      {cargando ? (
        <p className="text-center text-gray-500 py-8">Cargando...</p>
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
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg p-4 max-h-80 overflow-y-auto">
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
                onClick={cobrar}
                className="bg-barrio-500 text-white px-6 py-3 rounded-xl font-bold"
              >
                COBRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



