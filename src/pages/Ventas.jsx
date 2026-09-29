import { useEffect, useState } from 'react'
import { listarVentasHoy } from '../lib/api'

function formatoHora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const METODO_COLOR = {
  efectivo: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400',
  transferencia: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
  mercadopago: 'bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400',
  tarjeta: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400'
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
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Ventas de hoy
      </h1>

      {cargando && (
        <div className="text-center text-gray-400 py-12">Cargando...</div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!cargando && !error && (
        <>
          <div className="bg-gradient-to-br from-barrio-500 to-barrio-600 text-white rounded-2xl p-6 mb-4 shadow">
            <p className="text-xs uppercase tracking-wider opacity-80 mb-1">
              Total del dia
            </p>
            <p className="text-4xl font-bold tracking-tight mb-2">
              ${total.toLocaleString('es-AR')}
            </p>
            <p className="text-sm opacity-90">
              {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
            </p>
          </div>

          {Object.keys(porMetodo).length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Por metodo de pago
              </p>
              <div className="space-y-2">
                {Object.entries(porMetodo).map(([metodo, monto]) => (
                  <div key={metodo} className="flex justify-between items-center">
                    <span className={'text-xs font-semibold px-2 py-1 rounded-full capitalize ' + (METODO_COLOR[metodo] || 'bg-gray-50 dark:bg-stone-800 text-gray-700 dark:text-gray-300')}>
                      {metodo}
                    </span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      ${Number(monto).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ventas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🛒</p>
              <p className="text-gray-500 dark:text-gray-400">
                No hay ventas registradas hoy
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Cuando vendas algo, aparece aca
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Detalle
              </p>
              <div className="space-y-2">
                {ventas.map(v => (
                  <div key={v.id} className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-stone-800">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        🕐 {formatoHora(v.fecha)}
                      </span>
                      <span className={'text-[10px] font-bold px-2 py-1 rounded-full uppercase ' + (METODO_COLOR[v.metodo_pago] || 'bg-gray-50 dark:bg-stone-800 text-gray-700 dark:text-gray-300')}>
                        {v.metodo_pago}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      {(v.venta_items || []).map((it, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300 truncate">
                            {it.nombre_producto}
                            <span className="text-gray-400 dark:text-gray-500"> × {Number(it.cantidad)}</span>
                          </span>
                          <span className="text-gray-700 dark:text-gray-200 ml-2">
                            ${Number(it.subtotal).toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-stone-800">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        Total
                      </span>
                      <span className="font-bold text-barrio-600 dark:text-barrio-500 text-lg">
                        ${Number(v.total).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}


