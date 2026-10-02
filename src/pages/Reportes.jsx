import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { listarProductos } from '../lib/api'

const PERIODOS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'ayer', label: 'Ayer' },
  { id: 'semana', label: '7 dias' },
  { id: 'mes', label: '30 dias' },
  { id: 'mes_actual', label: 'Este mes' },
  { id: 'mes_pasado', label: 'Mes pasado' },
  { id: 'ano', label: 'Este año' },
  { id: 'personalizado', label: '📅 Rango' }
]

function rangoFechas(periodo, customDesde, customHasta) {
  const ahora = new Date()
  ahora.setHours(23, 59, 59, 999)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  let desde = new Date(hoy)
  let hasta = new Date(ahora)
  let compararDesde = null
  let compararHasta = null

  if (periodo === 'hoy') {
    desde = new Date(hoy)
    hasta = new Date(ahora)
    compararDesde = new Date(hoy)
    compararDesde.setDate(compararDesde.getDate() - 1)
    compararHasta = new Date(compararDesde)
    compararHasta.setHours(23, 59, 59, 999)
  } else if (periodo === 'ayer') {
    desde = new Date(hoy)
    desde.setDate(desde.getDate() - 1)
    hasta = new Date(desde)
    hasta.setHours(23, 59, 59, 999)
    compararDesde = new Date(desde)
    compararDesde.setDate(compararDesde.getDate() - 1)
    compararHasta = new Date(compararDesde)
    compararHasta.setHours(23, 59, 59, 999)
  } else if (periodo === 'semana') {
    desde = new Date(hoy)
    desde.setDate(desde.getDate() - 7)
    compararDesde = new Date(desde)
    compararDesde.setDate(compararDesde.getDate() - 7)
    compararHasta = new Date(desde)
    compararHasta.setMilliseconds(-1)
  } else if (periodo === 'mes') {
    desde = new Date(hoy)
    desde.setDate(desde.getDate() - 30)
    compararDesde = new Date(desde)
    compararDesde.setDate(compararDesde.getDate() - 30)
    compararHasta = new Date(desde)
    compararHasta.setMilliseconds(-1)
  } else if (periodo === 'mes_actual') {
    desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    compararDesde = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
    compararHasta = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999)
  } else if (periodo === 'mes_pasado') {
    desde = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
    hasta = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999)
    compararDesde = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1)
    compararHasta = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 0, 23, 59, 59, 999)
  } else if (periodo === 'ano') {
    desde = new Date(ahora.getFullYear(), 0, 1)
    compararDesde = new Date(ahora.getFullYear() - 1, 0, 1)
    compararHasta = new Date(ahora.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
  } else if (periodo === 'personalizado') {
    if (customDesde) {
      desde = new Date(customDesde + 'T00:00:00')
    }
    if (customHasta) {
      hasta = new Date(customHasta + 'T23:59:59')
    }
  }

  return { desde, hasta, compararDesde, compararHasta }
}

export default function Reportes() {
  const [periodo, setPeriodo] = useState('semana')
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')
  const [mostrarCustom, setMostrarCustom] = useState(false)
  const [ventas, setVentas] = useState([])
  const [ventasComparar, setVentasComparar] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (periodo === 'personalizado' && (!customDesde || !customHasta)) {
      setMostrarCustom(true)
      return
    }
    setMostrarCustom(periodo === 'personalizado')
    cargar()
  }, [periodo, customDesde, customHasta])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const { desde, hasta, compararDesde, compararHasta } = rangoFechas(periodo, customDesde, customHasta)

      const { data, error } = await supabase
        .from('ventas')
        .select('*, venta_items(*)')
        .eq('anulada', false)
        .gte('fecha', desde.toISOString())
        .lte('fecha', hasta.toISOString())
        .order('fecha', { ascending: false })
      if (error) throw error
      setVentas(data || [])

      if (compararDesde && compararHasta) {
        const { data: dataComp } = await supabase
          .from('ventas')
          .select('total')
          .eq('anulada', false)
          .gte('fecha', compararDesde.toISOString())
          .lte('fecha', compararHasta.toISOString())
        setVentasComparar(dataComp || [])
      } else {
        setVentasComparar([])
      }

      const prods = await listarProductos()
      setProductos(prods)
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  const total = ventas.reduce((s, v) => s + Number(v.total), 0)
  const totalComparar = ventasComparar.reduce((s, v) => s + Number(v.total), 0)
  const cantidad = ventas.length
  const ticketPromedio = cantidad > 0 ? total / cantidad : 0
  const diferencia = totalComparar > 0 ? ((total - totalComparar) / totalComparar) * 100 : 0

  // Top productos
  const productosVendidos = useMemo(() => {
    const map = {}
    ventas.forEach(v => {
      (v.venta_items || []).forEach(it => {
        if (!map[it.nombre_producto]) {
          map[it.nombre_producto] = { cantidad: 0, total: 0, producto_id: it.producto_id }
        }
        map[it.nombre_producto].cantidad += Number(it.cantidad)
        map[it.nombre_producto].total += Number(it.subtotal)
      })
    })
    return map
  }, [ventas])

  const topProductos = Object.entries(productosVendidos)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
  const maxTop = topProductos.length > 0 ? topProductos[0][1].total : 1

  // Ventas por dia
  const porDia = {}
  ventas.forEach(v => {
    const fecha = new Date(v.fecha)
    fecha.setHours(0, 0, 0, 0)
    const key = fecha.toISOString()
    if (!porDia[key]) porDia[key] = 0
    porDia[key] += Number(v.total)
  })
  const dias = Object.entries(porDia).sort((a, b) => new Date(a[0]) - new Date(b[0]))
  const maxDia = Math.max(...dias.map(d => d[1]), 1)

  // Por metodo de pago
  const porMetodo = ventas.reduce((acc, v) => {
    acc[v.metodo_pago] = (acc[v.metodo_pago] || 0) + Number(v.total)
    return acc
  }, {})

  // Por dia de la semana
  const porDiaSemana = [0, 0, 0, 0, 0, 0, 0]
  ventas.forEach(v => {
    const dia = new Date(v.fecha).getDay()
    porDiaSemana[dia] += Number(v.total)
  })
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const maxDiaSemana = Math.max(...porDiaSemana, 1)
  const mejorDiaIdx = porDiaSemana.indexOf(Math.max(...porDiaSemana))
  const mejorDia = porDiaSemana[mejorDiaIdx] > 0 ? diasSemana[mejorDiaIdx] : null

  // Por categoria (necesita productos para saber categoria de cada venta)
  const productosMap = useMemo(() => {
    const m = {}
    productos.forEach(p => { m[p.id] = p })
    return m
  }, [productos])

  const porCategoria = useMemo(() => {
    const map = {}
    ventas.forEach(v => {
      (v.venta_items || []).forEach(it => {
        const prod = productosMap[it.producto_id]
        const cat = prod?.categoria || 'Sin categoria'
        if (!map[cat]) map[cat] = { cantidad: 0, total: 0 }
        map[cat].cantidad += Number(it.cantidad)
        map[cat].total += Number(it.subtotal)
      })
    })
    return map
  }, [ventas, productosMap])

  const categoriasOrdenadas = Object.entries(porCategoria).sort((a, b) => b[1].total - a[1].total)
  const maxCategoria = categoriasOrdenadas.length > 0 ? categoriasOrdenadas[0][1].total : 1

  // Por hora
  const porHora = Array(24).fill(0)
  ventas.forEach(v => {
    const h = new Date(v.fecha).getHours()
    porHora[h] += Number(v.total)
  })
  const maxHora = Math.max(...porHora, 1)
  const mejorHoraIdx = porHora.indexOf(Math.max(...porHora))
  const mejorHora = porHora[mejorHoraIdx] > 0 ? mejorHoraIdx : null

  // Productos sin movimiento (no vendidos en el periodo)
  const productosSinMovimiento = useMemo(() => {
    const vendidosIds = new Set(
      ventas.flatMap(v => (v.venta_items || []).map(it => it.producto_id))
    )
    return productos
      .filter(p => !vendidosIds.has(p.id) && Number(p.stock_actual) > 0)
      .slice(0, 10)
  }, [ventas, productos])

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Reportes
      </h1>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4">
        {PERIODOS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={
              'px-4 py-2 rounded-xl text-sm whitespace-nowrap font-semibold transition-colors ' +
              (periodo === p.id
                ? 'bg-barrio-500 text-white'
                : 'bg-white dark:bg-stone-900 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-stone-800')
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {mostrarCustom && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Rango personalizado
          </p>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1 ml-1">
                Desde
              </label>
              <input
                type="date"
                value={customDesde}
                onChange={e => setCustomDesde(e.target.value)}
                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1 ml-1">
                Hasta
              </label>
              <input
                type="date"
                value={customHasta}
                onChange={e => setCustomHasta(e.target.value)}
                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {customDesde && customHasta
              ? '✅ Mostrando del ' + new Date(customDesde + 'T00:00:00').toLocaleDateString('es-AR') + ' al ' + new Date(customHasta + 'T00:00:00').toLocaleDateString('es-AR')
              : 'Elegi las fechas para ver el reporte'}
          </p>
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
              Total del periodo
            </p>
            <p className="text-4xl font-bold tracking-tight mb-2">
              ${total.toLocaleString('es-AR')}
            </p>
            {totalComparar > 0 && (
              <div className={
                'inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-3 ' +
                (diferencia >= 0 ? 'bg-emerald-400/30 text-emerald-50' : 'bg-red-400/30 text-red-50')
              }>
                {diferencia >= 0 ? '▲' : '▼'} {Math.abs(diferencia).toFixed(1)}% vs periodo anterior
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm mt-2">
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
                          style={{ height: altura + '%', minHeight: '4px' }}
                          title={'$' + monto.toLocaleString('es-AR')}
                        ></div>
                      </div>
                      <span className="text-[8px] text-gray-400">
                        {new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
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
                🏆 Top 10 mas vendidos
              </p>
              <div className="space-y-3">
                {topProductos.map(([nombre, datos], idx) => {
                  const medalla = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1)
                  const porcentaje = (datos.total / maxTop) * 100
                  return (
                    <div key={nombre}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="w-6 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
                          {medalla}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {nombre}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {Number(datos.cantidad).toFixed(0)} vendidos
                          </p>
                        </div>
                        <span className="text-sm font-bold text-barrio-600 dark:text-barrio-500 whitespace-nowrap">
                          ${datos.total.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="ml-9 h-1.5 bg-gray-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-barrio-500 rounded-full"
                          style={{ width: porcentaje + '%' }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {categoriasOrdenadas.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                📦 Ventas por categoria
              </p>
              <div className="space-y-3">
                {categoriasOrdenadas.map(([cat, datos]) => {
                  const pct = total > 0 ? (datos.total / total) * 100 : 0
                  const pctBarra = (datos.total / maxCategoria) * 100
                  return (
                    <div key={cat}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {cat}
                        </span>
                        <span className="text-sm font-bold text-barrio-600 dark:text-barrio-500 ml-2 whitespace-nowrap">
                          ${datos.total.toLocaleString('es-AR')}
                          <span className="text-xs text-gray-400 font-normal ml-1">
                            ({pct.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: pctBarra + '%' }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {Object.keys(porMetodo).length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                💳 Ventas por metodo de pago
              </p>
              <div className="space-y-2">
                {Object.entries(porMetodo)
                  .sort((a, b) => b[1] - a[1])
                  .map(([metodo, monto]) => {
                    const pct = (monto / total) * 100
                    return (
                      <div key={metodo}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-200 capitalize font-medium">
                            {metodo}
                          </span>
                          <span className="text-gray-800 dark:text-gray-100 font-semibold">
                            ${Number(monto).toLocaleString('es-AR')}
                            <span className="text-xs text-gray-400 font-normal ml-1">
                              ({pct.toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: pct + '%' }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {ventas.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                📅 Ventas por dia de la semana
              </p>
              <div className="flex items-end gap-2 h-28">
                {porDiaSemana.map((monto, idx) => {
                  const altura = (monto / maxDiaSemana) * 100
                  const esMejor = idx === mejorDiaIdx && monto > 0
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className={
                            'w-full rounded-t transition-colors ' +
                            (esMejor ? 'bg-emerald-500' : 'bg-barrio-500')
                          }
                          style={{ height: altura + '%', minHeight: '4px' }}
                          title={'$' + monto.toLocaleString('es-AR')}
                        ></div>
                      </div>
                      <span className={
                        'text-[10px] ' +
                        (esMejor ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400')
                      }>
                        {diasSemana[idx]}
                      </span>
                    </div>
                  )
                })}
              </div>
              {mejorDia && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                  💡 Tu mejor dia es <b className="text-emerald-600 dark:text-emerald-400">{mejorDia}</b>
                </p>
              )}
            </div>
          )}

          {ventas.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                🕐 Ventas por hora
              </p>
              <div className="flex items-end gap-[2px] h-24">
                {porHora.map((monto, idx) => {
                  const altura = (monto / maxHora) * 100
                  const esMejor = idx === mejorHoraIdx && monto > 0
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className={
                            'w-full rounded-t transition-colors ' +
                            (esMejor ? 'bg-emerald-500' : 'bg-barrio-500')
                          }
                          style={{ height: altura + '%', minHeight: monto > 0 ? '3px' : '0' }}
                          title={idx + ':00 - $' + monto.toLocaleString('es-AR')}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-2 px-1">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
                <span>18h</span>
                <span>23h</span>
              </div>
              {mejorHora !== null && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                  💡 Tu mejor hora es a las <b className="text-emerald-600 dark:text-emerald-400">{mejorHora}:00 hs</b>
                </p>
              )}
            </div>
          )}

          {productosSinMovimiento.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                📊 Productos sin movimiento
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                No se vendieron en este periodo. Ideal para hacer promos.
              </p>
              <div className="space-y-2">
                {productosSinMovimiento.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-stone-800 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-100 truncate">
                        {p.nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {Number(p.stock_actual)} {p.unidad} en stock
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-stone-800 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                      {p.categoria || 'Sin cat.'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ventas.length === 0 && !mostrarCustom && (
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


