import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { actualizarProducto, borrarProducto } from '../lib/api'

export default function EditarProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [id])

  async function cargar() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return setError(error.message)
    setForm({
      nombre: data.nombre,
      precio: data.precio,
      stock_actual: data.stock_actual,
      stock_minimo: data.stock_minimo,
      unidad: data.unidad,
      categoria: data.categoria || '',
      codigo_barras: data.codigo_barras || '',
      fecha_vencimiento: data.fecha_vencimiento || ''
    })
  }

  function cambiar(campo, valor) {
    setForm({ ...form, [campo]: valor })
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre) return setError('Pone un nombre')
    setGuardando(true)
    setError(null)
    try {
      await actualizarProducto(id, {
        nombre: form.nombre,
        precio: Number(form.precio) || 0,
        stock_actual: Number(form.stock_actual) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
        unidad: form.unidad,
        categoria: form.categoria.trim() || 'Sin categoria',
        codigo_barras: form.codigo_barras.trim() || null,
        fecha_vencimiento: form.fecha_vencimiento || null
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
    setGuardando(false)
  }

  async function eliminar() {
    if (!confirm('Borrar este producto?')) return
    try {
      await borrarProducto(id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  const inputClass = "w-full p-3 rounded-xl bg-gray-50 dark:bg-stone-900 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-base focus:outline-none focus:bg-white dark:focus:bg-stone-900 focus:border-barrio-500"

  if (error && !form) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="text-center text-gray-400 py-12">Cargando...</div>
    )
  }

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Editar producto
      </h1>

      <form onSubmit={guardar} className="space-y-3">
        <input
          type="text"
          placeholder="Nombre"
          value={form.nombre}
          onChange={e => cambiar('nombre', e.target.value)}
          className={inputClass}
        />

        <input
          type="text"
          placeholder="Codigo de barras"
          value={form.codigo_barras}
          onChange={e => cambiar('codigo_barras', e.target.value)}
          className={inputClass}
        />

        <input
          type="text"
          placeholder="Categoria"
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
            Fecha de vencimiento
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
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <button
          type="button"
          onClick={eliminar}
          className="w-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 py-3 rounded-xl font-semibold"
        >
          Borrar producto
        </button>
      </form>
    </div>
  )
}


