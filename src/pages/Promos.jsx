import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarPromos, actualizarPromo, borrarPromo } from '../lib/api'

function resumenPromo(p) {
  const c = p.config || {}
  if (p.tipo === 'cantidad') {
    return 'Lleva ' + c.lleva + ', paga ' + c.paga
  }
  if (p.tipo === 'porcentaje') {
    return c.descuento + '% de descuento'
  }
  if (p.tipo === 'combo') {
    return 'Combo a $' + Number(c.precio_combo || 0).toLocaleString('es-AR')
  }
  return ''
}

function vencida(p) {
  if (!p.fecha_hasta) return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const hasta = new Date(p.fecha_hasta + 'T00:00:00')
  return hasta < hoy
}

export default function Promos() {
  const navigate = useNavigate()
  const [promos, setPromos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const data = await listarPromos()
      setPromos(data)
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  function mostrarMensaje(txt, tipo = 'ok') {
    setMensaje({ txt, tipo })
    setTimeout(() => setMensaje(null), 2500)
  }

  async function toggleActiva(p) {
    try {
      const actualizada = await actualizarPromo(p.id, { activa: !p.activa })
      setPromos(promos.map(x => x.id === p.id ? actualizada : x))
      mostrarMensaje(actualizada.activa ? 'Promo activada' : 'Promo pausada')
    } catch (e) {
      mostrarMensaje('Error: ' + e.message, 'error')
    }
  }

  async function eliminar(p) {
    if (!confirm('Borrar la promo "' + p.nombre + '"?')) return
    try {
      await borrarPromo(p.id)
      setPromos(promos.filter(x => x.id !== p.id))
      mostrarMensaje('Promo borrada')
    } catch (e) {
      mostrarMensaje('Error: ' + e.message, 'error')
    }
  }

  const activas = promos.filter(p => p.activa && !vencida(p))
  const inactivas = promos.filter(p => !p.activa || vencida(p))

  return (
    <div className="px-4 pt-5 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Promos
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {activas.length} activas
          </p>
        </div>
        <button
          onClick={() => navigate('/promos/nueva')}
          className="bg-barrio-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          + Nueva
        </button>
      </div>

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

      {!cargando && !error && promos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-5xl mb-3">🎉</p>
          <p className="text-gray-600 dark:text-gray-300 font-semibold mb-1">
            Todavia no tenes promos
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Crea promos para vender mas
          </p>
          <button
            onClick={() => navigate('/promos/nueva')}
            className="bg-barrio-500 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Crear la primera
          </button>
        </div>
      )}

      {!cargando && !error && activas.length > 0 && (
        <>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">
            🟢 Activas
          </p>
          <div className="space-y-2 mb-6">
            {activas.map(p => (
              <div key={p.id} className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-stone-800">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {p.nombre}
                    </p>
                    <p className="text-sm text-barrio-600 dark:text-barrio-500 mt-0.5">
                      {resumenPromo(p)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    Activa
                  </span>
                </div>
                {p.fecha_hasta && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Vence: {new Date(p.fecha_hasta + 'T00:00:00').toLocaleDateString('es-AR')}
                  </p>
                )}
                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-stone-800">
                  <button
                    onClick={() => navigate('/promos/editar/' + p.id)}
                    className="flex-1 text-xs font-semibold text-barrio-600 dark:text-barrio-500 py-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActiva(p)}
                    className="flex-1 text-xs font-semibold text-amber-600 dark:text-amber-400 py-2"
                  >
                    Pausar
                  </button>
                  <button
                    onClick={() => eliminar(p)}
                    className="flex-1 text-xs font-semibold text-red-500 py-2"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!cargando && !error && inactivas.length > 0 && (
        <>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            ⚪ Pausadas / Vencidas
          </p>
          <div className="space-y-2">
            {inactivas.map(p => (
              <div key={p.id} className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-stone-800 opacity-70">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {p.nombre}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {resumenPromo(p)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-gray-400">
                    {vencida(p) ? 'Vencida' : 'Pausada'}
                  </span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-stone-800">
                  <button
                    onClick={() => toggleActiva(p)}
                    className="flex-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-2"
                  >
                    Reactivar
                  </button>
                  <button
                    onClick={() => eliminar(p)}
                    className="flex-1 text-xs font-semibold text-red-500 py-2"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


