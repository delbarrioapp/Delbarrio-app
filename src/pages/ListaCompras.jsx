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
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1 text-barrio-700">Lista de compras</h1>
      <p className="text-sm text-gray-500 mb-4">
        Productos a reponer
      </p>

      {cargando && <p className="text-center text-gray-500 py-8">Cargando...</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {!cargando && !error && porReponer.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-semibold text-green-700">Todo en orden</p>
          <p className="text-sm text-green-600 mt-1">
            No hay productos para reponer
          </p>
        </div>
      )}

      {!cargando && !error && porReponer.length > 0 && (
        <>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-orange-800 text-sm font-semibold text-center">
            {porReponer.length} producto{porReponer.length > 1 ? 's' : ''} para reponer
          </div>

          {categorias.map(cat => (
            <div key={cat} className="mb-5">
              <h2 className="text-sm font-bold text-barrio-700 uppercase tracking-wide mb-2">
                {cat}
              </h2>
              {grupos[cat].map(p => {
                const falta = Number(p.stock_minimo) * 2 - Number(p.stock_actual)
                const pedir = falta > 0 ? falta : Number(p.stock_minimo)
                const cantidad = pedir.toFixed(2).replace(/\.?0+$/, '')
                return (
                  <div key={p.id} className="bg-white rounded-xl p-4 mb-2 shadow-sm flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{p.nombre}</p>
                      <p className="text-xs text-gray-500">
                        Stock actual: {Number(p.stock_actual)} {p.unidad} | Mínimo: {Number(p.stock_minimo)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Pedir</p>
                      <p className="font-bold text-barrio-700 text-lg">
                        {cantidad} {p.unidad}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          <button
            onClick={enviarWhatsApp}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg mt-4"
          >
            Enviar por WhatsApp
          </button>
        </>
      )}
    </div>
  )
}


