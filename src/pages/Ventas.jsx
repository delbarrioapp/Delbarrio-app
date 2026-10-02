import { useEffect, useState } from 'react'
import { listarVentasHoy, anularVenta } from '../lib/api'

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
  const [mensaje, setMensaje] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [anulando, setAnulando] = useState(false)

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

  function mostrarMensaje(txt, tipo = 'ok') {
    setMensaje({ txt, tipo })
    setTimeout(() => setMensaje(null), 2500)
  }

  async function confirmarAnular() {
    if (!detalle) return
    setAnulando(true)
    try {
      await anularVenta(detalle.id, 'Error al cobrar')
      mostrarMensaje('Venta anulada correctamente')
      setDetalle(null)
      cargar()
    } catch (e) {
      mostrarMensaje('Error: ' + e.message, 'error')
    }
    setAnulando(false)
  }

  const ventasActivas = ventas.filter(v => !v.anulada)
  const total = ventasActivas.reduce((s, v) => s + Number(v.total), 0)
  const porMetodo = ventasActivas.reduce((acc, v) => {
    acc[v.metodo_pago] = (acc[v.metodo_pago] || 0) + Number(v.total)
    return acc
  }, {})

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Ventas de hoy
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
              {ventasActivas.length} {ventasActivas.length === 1 ? 'venta' : 'ventas'}
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
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Detalle
              </p>
              <div className="space-y-2">
                {ventas.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setDetalle(v)}
                    className={
                      'w-full bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border text-left active:scale-[0.99] transition-transform ' +
                      (v.anulada
                        ? 'border-red-200 dark:border-red-900 opacity-60'
                        : 'border-gray-100 dark:border-stone-800')
                    }
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        🕐 {formatoHora(v.fecha)}
                      </span>
                      <div className="flex items-center gap-2">
                        {v.anulada && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400">
                            Anulada
                          </span>
                        )}
                        <span className={'text-[10px] font-bold px-2 py-1 rounded-full uppercase ' + (METODO_COLOR[v.metodo_pago] || 'bg-gray-50 dark:bg-stone-800 text-gray-700 dark:text-gray-300')}>
                          {v.metodo_pago}
                        </span>
                      </div>
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
                      <span className={
                        'font-bold text-lg ' +
                        (v.anulada
                          ? 'text-gray-400 dark:text-gray-500 line-through'
                          : 'text-barrio-600 dark:text-barrio-500')
                      }>
                        ${Number(v.total).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {detalle && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => !anulando && setDetalle(null)}>
          <div
            className="bg-white dark:bg-stone-900 w-full rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Venta de las {formatoHora(detalle.fecha)}
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  ${Number(detalle.total).toLocaleString('es-AR')}
                </p>
              </div>
              <button
                onClick={() => setDetalle(null)}
                className="text-2xl text-gray-400 leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-1 mb-4 pb-4 border-b border-gray-100 dark:border-stone-800">
              {(detalle.venta_items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    {it.nombre_producto} × {Number(it.cantidad)}
                  </span>
                  <span className="text-gray-800 dark:text-gray-100">
                    ${Number(it.subtotal).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-5">
              <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                Pago: {detalle.metodo_pago}
              </span>
              {detalle.anulada && (
                <span className="text-xs font-bold px-2 py-1 rounded-full uppercase bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400">
                  Anulada
                </span>
              )}
            </div>

            {!detalle.anulada ? (
              <button
                onClick={confirmarAnular}
                disabled={anulando}
                className="w-full bg-red-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                {anulando ? 'Anulando...' : '⚠️ Anular esta venta'}
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-950 rounded-xl p-3 text-center">
                <p className="text-sm text-red-700 dark:text-red-300 font-semibold">
                  Esta venta ya fue anulada
                </p>
                {detalle.motivo_anulacion && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {detalle.motivo_anulacion}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setDetalle(null)}
              className="w-full mt-3 bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


