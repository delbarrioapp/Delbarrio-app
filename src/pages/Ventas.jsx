import { useEffect, useState } from 'react'
import { listarVentasHoy } from '../lib/api'

function formatoHora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const METODO_COLOR = {
  efectivo: 'bg-green-100 text-green-700',
  transferencia: 'bg-blue-100 text-blue-700',
  mercadopago: 'bg-cyan-100 text-cyan-700',
  tarjeta: 'bg-purple-100 text-purple-700'
}

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const data = await listarVentasHoy()
      setVentas(data)
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  const total = ventas.reduce((s, v) => s + Number(v.total), 0)
  const porMetodo = ventas.reduce((acc, v) => {
    acc[v.metodo_pago] = (acc[v.metodo_pago] || 0) + Number(v.total)
    return acc
  }, {})

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-barrio-700">Ventas de hoy</h1>

      {cargando && <p className="text-center text-gray-500 py-8">Cargando...</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-semibold mb-1">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!cargando && !error && (
        <>
          <div className="bg-barrio-500 text-white rounded-2xl p-5 mb-4 shadow">
            <p className="text-sm opacity-80 mb-1">Total vendido hoy</p>
            <p className="text-4xl font-bold mb-1">
              ${total.toLocaleString('es-AR')}
            </p>
            <p className="text-sm opacity-80">
              {ventas.length} venta{ventas.length !== 1 ? 's' : ''}
            </p>
          </div>

          {Object.keys(porMetodo).length > 0 && (
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <p className="font-bold text-gray-700 mb-2 text-sm">Por método de pago</p>
              {Object.entries(porMetodo).map(([metodo, monto]) => (
                <div key={metodo} className="flex justify-between py-1 text-sm">
                  <span className="capitalize text-gray-600">{metodo}</span>
                  <span className="font-semibold">
                    ${Number(monto).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {ventas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay ventas registradas hoy.
            </p>
          ) : (
            <div className="space-y-2">
              {ventas.map(v => (
                <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      {formatoHora(v.fecha)}
                    </span>
                    <span className={'text-xs px-2 py-1 rounded-full ' + (METODO_COLOR[v.metodo_pago] || 'bg-gray-100')}>
                      {v.metodo_pago}
                    </span>
                  </div>
                  <div className="space-y-1 mb-2">
                    {(v.venta_items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {it.nombre_producto} x {Number(it.cantidad)}
                        </span>
                        <span className="text-gray-700">
                          ${Number(it.subtotal).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="font-bold text-barrio-700">
                      ${Number(v.total).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}


