import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { importarProductos } from '../lib/api'

export default function ImportarProductos() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [importando, setImportando] = useState(false)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  function descargarPlantilla() {
    const plantilla = [
      {
        nombre: 'Ej: Coca-Cola 500ml',
        precio: 1200,
        stock_actual: 24,
        stock_minimo: 6,
        unidad: 'unidad',
        categoria: 'Bebidas',
        codigo_barras: '',
        fecha_vencimiento: ''
      }
    ]
    const ws = XLSX.utils.json_to_sheet(plantilla)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    XLSX.writeFile(wb, 'plantilla-delbarrio.xlsx')
  }

  function leerArchivo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setProductos([])
    setNombreArchivo(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target.result
        const workbook = XLSX.read(data, { type: 'array' })
        const hoja = workbook.Sheets[workbook.SheetNames[0]]
        const filas = XLSX.utils.sheet_to_json(hoja)

        if (filas.length === 0) {
          setError('El archivo esta vacio')
          return
        }

        const productosLimpios = filas.map(f => ({
          nombre: String(f.nombre || f.Nombre || f.NOMBRE || '').trim(),
          precio: Number(f.precio || f.Precio || f.PRECIO || 0),
          stock_actual: Number(f.stock_actual || f.stock || f.Stock || 0),
          stock_minimo: Number(f.stock_minimo || f.minimo || f.Minimo || 0),
          unidad: String(f.unidad || f.Unidad || 'unidad').toLowerCase().trim(),
          categoria: String(f.categoria || f.Categoria || f.categoría || 'Sin categoria').trim(),
          codigo_barras: String(f.codigo_barras || f.codigo || f.Codigo || '').trim(),
          fecha_vencimiento: String(f.fecha_vencimiento || f.vencimiento || '').trim()
        })).filter(p => p.nombre)

        if (productosLimpios.length === 0) {
          setError('No se encontraron productos validos. Fijate que la columna "nombre" este completa.')
          return
        }

        setProductos(productosLimpios)
      } catch (err) {
        setError('Error al leer el archivo: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function confirmarImportacion() {
    if (productos.length === 0) return
    setImportando(true)
    setError(null)
    try {
      const cantidad = await importarProductos(productos)
      setMensaje(cantidad + ' productos importados con exito')
      setProductos([])
      setNombreArchivo('')
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setError(err.message)
    }
    setImportando(false)
  }

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Importar productos
      </h1>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
          📋 Como preparar el Excel
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
          El archivo debe tener estas columnas (la primera fila es el encabezado):
        </p>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 ml-4">
          <li>• <b>nombre</b> (obligatorio)</li>
          <li>• precio</li>
          <li>• stock_actual</li>
          <li>• stock_minimo</li>
          <li>• unidad</li>
          <li>• categoria</li>
          <li>• codigo_barras (opcional)</li>
          <li>• fecha_vencimiento (opcional, formato AAAA-MM-DD)</li>
        </ul>
      </div>

      <button
        onClick={descargarPlantilla}
        className="w-full bg-white dark:bg-stone-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-stone-800 py-3 rounded-xl font-semibold text-sm mb-4"
      >
        📥 Descargar plantilla de ejemplo
      </button>

      <label className="block w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg text-center cursor-pointer active:scale-[0.98] transition-transform">
        {nombreArchivo ? '📄 ' + nombreArchivo : '📁 Elegir archivo Excel'}
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={leerArchivo}
          className="hidden"
        />
      </label>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-3 mt-4 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 mt-4 text-emerald-700 dark:text-emerald-300 text-sm">
          ✅ {mensaje}
        </div>
      )}

      {productos.length > 0 && (
        <>
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 mt-4 shadow-sm border border-gray-100 dark:border-stone-800">
            <p className="font-bold text-gray-800 dark:text-gray-100 mb-3">
              Preview ({productos.length} productos)
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {productos.slice(0, 10).map((p, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-gray-100 dark:border-stone-800 pb-1">
                  <span className="text-gray-700 dark:text-gray-200 truncate mr-2">
                    {p.nombre}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    ${p.precio.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
              {productos.length > 10 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  ... y {productos.length - 10} mas
                </p>
              )}
            </div>
          </div>

          <button
            onClick={confirmarImportacion}
            disabled={importando}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg mt-4 disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {importando ? 'Importando...' : 'Confirmar importacion (' + productos.length + ')'}
          </button>
        </>
      )}

      <button
        onClick={() => navigate('/')}
        className="w-full text-gray-500 dark:text-gray-400 py-3 rounded-xl font-semibold text-sm mt-2"
      >
        Cancelar
      </button>
    </div>
  )
}


