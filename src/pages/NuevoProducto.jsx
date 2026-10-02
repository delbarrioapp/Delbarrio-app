import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { crearProducto, subirFotoProducto } from '../lib/api'
import Escaner from '../components/Escaner'

export default function NuevoProducto() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codigoInicial = searchParams.get('codigo') || ''
  const volverA = searchParams.get('volver') || '/'

  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    stock_actual: '',
    stock_minimo: '',
    unidad: 'unidad',
    categoria: '',
    codigo_barras: codigoInicial,
    fecha_vencimiento: ''
  })
  const [archivoFoto, setArchivoFoto] = useState(null)
  const [previewFoto, setPreviewFoto] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [escaneando, setEscaneando] = useState(false)

  function cambiar(campo, valor) {
    setForm({ ...form, [campo]: valor })
  }

  function elegirFoto(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (archivo.size > 5 * 1024 * 1024) {
      setError('La foto no puede pesar mas de 5 MB')
      return
    }
    setArchivoFoto(archivo)
    setPreviewFoto(URL.createObjectURL(archivo))
    setError(null)
  }

  function quitarFoto() {
    setArchivoFoto(null)
    if (previewFoto) URL.revokeObjectURL(previewFoto)
    setPreviewFoto(null)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre) return setError('Pone un nombre')
    setGuardando(true)
    setError(null)

    try {
      const creado = await crearProducto({
        nombre: form.nombre,
        precio: Number(form.precio) || 0,
        stock_actual: Number(form.stock_actual) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
        unidad: form.unidad,
        categoria: form.categoria.trim() || 'Sin categoria',
        codigo_barras: form.codigo_barras.trim() || null,
        fecha_vencimiento: form.fecha_vencimiento || null
      })

      if (archivoFoto && creado?.id) {
        try {
          const url = await subirFotoProducto(archivoFoto, creado.id)
          const { supabase } = await import('../lib/supabase')
          await supabase
            .from('productos')
            .update({ foto_url: url })
            .eq('id', creado.id)
        } catch (errFoto) {
          console.error('Error subiendo foto:', errFoto)
        }
      }

      navigate(volverA)
    } catch (err) {
      setError(err.message)
    }
    setGuardando(false)
  }

  const inputClass = "w-full p-3 rounded-xl bg-gray-50 dark:bg-stone-900 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-base focus:outline-none focus:bg-white dark:focus:bg-stone-900 focus:border-barrio-500"

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Nuevo producto
      </h1>

      {codigoInicial && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            📷 Codigo escaneado: {codigoInicial}
          </p>
        </div>
      )}

      {/* FOTO */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 ml-1">
          Foto del producto
        </label>
        {previewFoto ? (
          <div className="relative">
            <img
              src={previewFoto}
              alt="Preview"
              className="w-full h-48 object-cover rounded-2xl"
            />
            <button
              type="button"
              onClick={quitarFoto}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-9 h-9 font-bold"
            >
              ×
            </button>
            <label className="absolute bottom-2 right-2 bg-white dark:bg-stone-900 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow">
              Cambiar
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={elegirFoto}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <label className="block w-full border-2 border-dashed border-gray-200 dark:border-stone-800 rounded-2xl p-8 text-center cursor-pointer active:bg-gray-50 dark:active:bg-stone-900">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Agregar foto
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tocala para sacar una foto o elegir de la galeria
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={elegirFoto}
              className="hidden"
            />
          </label>
        )}
      </div>

      <form onSubmit={guardar} className="space-y-3">
        <input
          type="text"
          placeholder="Nombre del producto"
          value={form.nombre}
          onChange={e => cambiar('nombre', e.target.value)}
          className={inputClass}
        />

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Codigo de barras"
            value={form.codigo_barras}
            onChange={e => cambiar('codigo_barras', e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setEscaneando(true)}
            className="bg-barrio-500 text-white px-4 rounded-xl text-2xl"
          >
            📷
          </button>
        </div>

        <input
          type="text"
          placeholder="Categoria (ej: Bebidas)"
          value={form.categoria}
          onChange={e => cambiar('categoria', e.target.value)}
          list="categorias-sugeridas"
          className={inputClass}
        />
        <datalist id="categorias-sugeridas">
          <option value="Bebidas" />
          <option value="Golosinas" />
          <option value="Galletitas" />
          <option value="Cigarrillos" />
          <option value="Snacks" />
          <option value="Lacteos" />
          <option value="Panaderia" />
          <option value="Almacen" />
          <option value="Limpieza" />
          <option value="Frutos secos" />
          <option value="Semillas" />
          <option value="Dietetica" />
          <option value="Perfumes" />
          <option value="Cremas" />
          <option value="Maquillaje" />
        </datalist>

        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={form.precio}
          onChange={e => cambiar('precio', e.target.value)}
          className={inputClass}
        />

        <div className="flex gap-3">
          <input
            type="number"
            step="0.001"
            placeholder="Stock actual"
            value={form.stock_actual}
            onChange={e => cambiar('stock_actual', e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            step="0.001"
            placeholder="Stock minimo"
            value={form.stock_minimo}
            onChange={e => cambiar('stock_minimo', e.target.value)}
            className={inputClass}
          />
        </div>

        <select
          value={form.unidad}
          onChange={e => cambiar('unidad', e.target.value)}
          className={inputClass}
        >
          <option value="unidad">Unidad</option>
          <option value="kg">Kilogramo</option>
          <option value="g">Gramo</option>
          <option value="litro">Litro</option>
          <option value="pack">Pack</option>
        </select>

        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1 ml-1">
            Fecha de vencimiento (opcional)
          </label>
          <input
            type="date"
            value={form.fecha_vencimiento}
            onChange={e => cambiar('fecha_vencimiento', e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {guardando ? 'Guardando...' : 'Guardar producto'}
        </button>
      </form>

      {escaneando && (
        <Escaner
          onDetectado={(codigo) => {
            setEscaneando(false)
            cambiar('codigo_barras', codigo)
          }}
          onCerrar={() => setEscaneando(false)}
        />
      )}
    </div>
  )
}


