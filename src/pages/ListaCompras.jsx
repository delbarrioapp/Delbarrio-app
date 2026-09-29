import { useEffect, useState } from 'react'
import { listarProductos } from '../lib/api'

export default function ListaCompras() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const data = await listarProductos()
      setProductos(data)
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  const porReponer = productos.filter(p =>
    Number(p.stock_actual) <= Number(p.stock_minimo)
  )

  const grupos = {}
  porReponer.forEach(p => {
    const cat = p.categoria || 'Sin categoria'
    if (!grupos[cat]) grupos[cat] = []
    grupos[cat].push(p)
  })

  const categorias = Object.keys(grupos).sort()

  function generarTexto() {
    let texto = '*Lista de compras - delbarrio.com*\n\n'
    categorias.forEach(cat => {
      texto += '*' + cat.toUpperCase() + '*\n'
      grupos[cat].forEach(p => {
        const falta = Number(p.stock_minimo) * 2 - Number(p.stock_actual)
        const pedir = falta > 0 ? falta : Number(p.stock_minimo)
        texto += '- ' + p.nombre + ': pedir ' + pedir.toFixed(2).replace(/\.?0+$/, '') + ' ' + p.unidad + '\n'
      })
      texto += '\n'
    })
    return texto
  }

  function enviarWhatsApp() {
    const texto = encodeURIComponent(generarTexto())
    window.open('https://wa.me/?text=' + texto, '_blank')
  }

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        Lista de compras
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Productos a reponer
      </p>

      {cargando && (
        <div className="text-center text-gray-400 py-12">Cargando...</div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!cargando && !error && porReponer.length === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6 text-center">
          <p className="text-4xl mb-2">✅</p>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            Todo en orden
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
            No hay productos para reponer
          </p>
        </div>
      )}

      {!cargando && !error && porReponer.length > 0 && (
        <>
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-xl p-3 mb-4 text-amber-800 dark:text-amber-400 text-sm font-semibold text-center">
            {porReponer.length} producto{porReponer.length > 1 ? 's' : ''} para reponer
          </div>

          {categorias.map(cat => (
            <div key={cat} className="mb-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {cat}
              </h2>
              <div className="space-y-2">
                {grupos[cat].map(p => {
                  const falta = Number(p.stock_minimo) * 2 - Number(p.stock_actual)
                  const pedir = falta > 0 ? falta : Number(p.stock_minimo)
                  const cantidad = pedir.toFixed(2).replace(/\.?0+$/, '')
                  return (
                    <div key={p.id} className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-stone-800 flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {p.nombre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Stock: {Number(p.stock_actual)} {p.unidad} · Mín: {Number(p.stock_minimo)}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">
                          Pedir
                        </p>
                        <p className="font-bold text-barrio-600 dark:text-barrio-500 text-lg whitespace-nowrap">
                          {cantidad} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{p.unidad}</span>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <button
            onClick={enviarWhatsApp}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg mt-4 active:scale-[0.98] transition-transform"
          >
            Enviar por WhatsApp
          </button>
        </>
      )}
    </div>
  )
}
