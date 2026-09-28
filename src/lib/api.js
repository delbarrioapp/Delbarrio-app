import { supabase } from './supabase'

export async function listarProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data || []
}

export async function crearProducto(p) {
  const { data, error } = await supabase
    .from('productos')
    .insert(p)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarProducto(id, cambios) {
  const { data, error } = await supabase
    .from('productos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function borrarProducto(id) {
  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id)
  if (error) throw error
}

export async function ajustarStock(id, delta) {
  const { data: actual } = await supabase
    .from('productos')
    .select('stock_actual')
    .eq('id', id)
    .single()
  const nuevo = Number(actual.stock_actual) + Number(delta)
  const { data, error } = await supabase
    .from('productos')
    .update({ stock_actual: nuevo })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
