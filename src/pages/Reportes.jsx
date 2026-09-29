import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function formatoFecha(d) {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

export default function Reportes() {
  const [periodo, setPeriodo] = useState('semana')
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [periodo])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const dias = periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : 90
      const desde = new Date()
      desde.setDate(desde.getDate() - dias)
      desde.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('ventas')
        .select('*, venta_items(*)')
        .gte('fecha', desde.toISOString())
        .order('fecha', { ascending: false })
      if (error) throw error
      setVentas(data || [])
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  const total = ventas.reduce((s, v) => s + Number(v.total), 0)
  const cantidad = ventas.length
  const ticketPromedio = cantidad > 0 ? total / cantidad : 0

  // Productos mas vendidos
  const productosVendidos = {}
  ventas.forEach(v => {
    (v.venta_items || []).forEach(it => {
      if (!productosVendidos[it.nombre_producto]) {
        productosVendidos[it.nombre_producto] = { cantidad: 0, total: 0 }
      }
      productosVendidos[it.nombre_producto].cantidad += Number(it.cantidad)
      productosVendidos[it.nombre_producto].total += Number(it.subtotal)
    })
  })
  const topProductos = Object.entries(productosVendidos)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5)

  // Ventas por dia
  const porDia = {}
  ventas.forEach(v => {
    const fecha = new Date(v.fecha)
    fecha.setHours(0, 0, 0, 0)
    const key = fecha.toISOString()
    if (!porDia[key]) porDia[key] = 0
    porDia[key] += Number(v.total)
  })
  const dias = Object.entries(porDia)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
  const maxDia = Math.max(...dias.map(d => d[1]), 1)

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Reportes
      </h1>

      <div className="flex gap-2 mb-4">
        {[
          { id: 'semana', label: '7 dias' },
          { id: 'mes', label: '30 dias' },
          { id: 'trimestre', label: '90 dias' }
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={
              'flex-1 py-2 rounded-xl text-sm font-semibold ' +
              (periodo === p.id
                ? 'bg-barrio-500 text-white'
                : 'bg-white dark:bg-stone-900 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-stone-800')
            }
          >
            {p.label}
          </button>
        ))}
      </div>

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
              Total del periodo
            </p>
            <p className="text-4xl font-bold tracking-tight mb-3">
              ${total.toLocaleString('es-AR')}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="opacity-80 text-xs">Ventas</p>
                <p className="font-bold text-lg">{cantidad}</p>
              </div>
              <div>
                <p className="opacity-80 text-xs">Ticket promedio</p>
                <p className="font-bold text-lg">
                  ${Math.round(ticketPromedio).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </div>

          {dias.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Ventas por dia
              </p>
              <div className="flex items-end gap-1 h-32">
                {dias.map(([fecha, monto]) => {
                  const altura = (monto / maxDia) * 100
                  return (
                    <div key={fecha} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full bg-barrio-500 rounded-t"
                          style={{ height: altura + '%' }}
                          title={'$' + monto.toLocaleString('es-AR')}
                        ></div>
                      </div>
                      <span className="text-[9px] text-gray-400">
                        {formatoFecha(new Date(fecha))}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {topProductos.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Top 5 mas vendidos
              </p>
              <div className="space-y-3">
                {topProductos.map(([nombre, datos], idx) => (
                  <div key={nombre} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-barrio-100 dark:bg-stone-800 text-barrio-700 dark:text-barrio-500 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {datos.cantidad} vendidos
                      </p>
                    </div>
                    <span className="text-sm font-bold text-barrio-600 dark:text-barrio-500">
                      ${datos.total.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ventas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-gray-500 dark:text-gray-400">
                Sin ventas en este periodo
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}


