import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function PanelAdmin() {
  const { esAdmin } = useAuth()
  const [locales, setLocales] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [detalle, setDetalle] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const { data: localesData, error: errL } = await supabase
        .from('locales')
        .select('*')
        .order('created_at', { ascending: false })
      if (errL) throw errL
      setLocales(localesData || [])

      const { data: usuariosData, error: errU } = await supabase
        .from('usuarios')
        .select('*')
      if (errU) throw errU
      setUsuarios(usuariosData || [])

      const hace30 = new Date()
      hace30.setDate(hace30.getDate() - 30)
      const { data: ventasData, error: errV } = await supabase
        .from('ventas')
        .select('id, total, fecha, local_id, metodo_pago')
        .gte('fecha', hace30.toISOString())
      if (errV) throw errV
      setVentas(ventasData || [])
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  function statsLocal(localId) {
    const vs = ventas.filter(v => v.local_id === localId)
    const total = vs.reduce((s, v) => s + Number(v.total), 0)
    const ultima = vs.length > 0
      ? vs.reduce((a, b) => new Date(a.fecha) > new Date(b.fecha) ? a : b)
      : null
    return { cantidad: vs.length, total, ultima }
  }

  function usuarioDeLocal(localId) {
    return usuarios.find(u => u.local_id === localId)
  }

  const totalFacturado = ventas.reduce((s, v) => s + Number(v.total), 0)
  const localesActivos = locales.filter(l => {
    const st = statsLocal(l.id)
    return st.cantidad > 0
  }).length

  if (!esAdmin) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4 text-red-700 dark:text-red-300">
          No tenes permiso para ver esta seccion
        </div>
      </div>
    )
  }

  if (cargando) {
    return <div className="text-center text-gray-400 py-12">Cargando panel...</div>
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5 pb-24">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">👑</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Panel Admin
        </h1>
      </div>

      {/* Metricas globales */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-barrio-500 to-barrio-600 text-white rounded-2xl p-4 shadow">
          <p className="text-[10px] uppercase tracking-wider opacity-80 mb-1">
            Locales
          </p>
          <p className="text-3xl font-bold">{locales.length}</p>
          <p className="text-xs opacity-80 mt-1">
            {localesActivos} activos (30d)
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 shadow">
          <p className="text-[10px] uppercase tracking-wider opacity-80 mb-1">
            Facturado 30d
          </p>
          <p className="text-2xl font-bold">
            ${totalFacturado.toLocaleString('es-AR')}
          </p>
          <p className="text-xs opacity-80 mt-1">{ventas.length} ventas</p>
        </div>
      </div>

      {/* Lista de locales */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Locales registrados
      </p>

      {locales.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🏪</p>
          <p className="text-gray-500 dark:text-gray-400">
            Todavia no hay locales registrados
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {locales.map(local => {
            const st = statsLocal(local.id)
            const user = usuarioDeLocal(local.id)
            const activo = st.cantidad > 0
            return (
              <button
                key={local.id}
                onClick={() => setDetalle({ local, stats: st, user })}
                className="w-full bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-stone-800 text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {local.nombre}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {user?.nombre || 'Sin nombre'} · {local.tipo || 'otro'}
                    </p>
                  </div>
                  <span className={
                    'text-[10px] font-bold px-2 py-1 rounded-full uppercase ' +
                    (activo
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-gray-400')
                  }>
                    {activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-stone-800">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Ventas 30d
                    </p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {st.cantidad}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Facturado 30d
                    </p>
                    <p className="text-sm font-bold text-barrio-600 dark:text-barrio-500">
                      ${st.total.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>

                {st.ultima && (
                  <p className="text-[10px] text-gray-400 mt-2">
                    Ultima venta:{' '}
                    {new Date(st.ultima.fecha).toLocaleDateString('es-AR')}{' '}
                    {new Date(st.ultima.fecha).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Modal de detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setDetalle(null)}>
          <div
            className="bg-white dark:bg-stone-900 w-full rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Detalle del local
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                  {detalle.local.nombre}
                </p>
              </div>
              <button
                onClick={() => setDetalle(null)}
                className="text-2xl text-gray-400 leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-stone-950 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                  Dueño
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {detalle.user?.nombre || 'Sin nombre'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-stone-950 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Tipo
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 capitalize">
                    {detalle.local.tipo || 'otro'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-stone-950 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Registrado
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {new Date(detalle.local.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-3">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                    Ventas 30d
                  </p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {detalle.stats.cantidad}
                  </p>
                </div>
                <div className="bg-barrio-50 dark:bg-stone-950 rounded-xl p-3">
                  <p className="text-xs font-bold text-barrio-600 dark:text-barrio-500 uppercase mb-1">
                    Facturado 30d
                  </p>
                  <p className="text-lg font-bold text-barrio-700 dark:text-barrio-500">
                    ${detalle.stats.total.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-stone-950 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                  ID del local
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-mono break-all">
                  {detalle.local.id}
                </p>
              </div>
            </div>

            <button
              onClick={() => setDetalle(null)}
              className="w-full mt-5 bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


