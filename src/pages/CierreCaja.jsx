import { useEffect, useState } from 'react'
import { listarVentasHoy, listarVentasEfectivoHoy, guardarCierreCaja, listarCierres } from '../lib/api'

export default function CierreCaja() {
  const [totalSistema, setTotalSistema] = useState(0)
  const [totalEfectivo, setTotalEfectivo] = useState(0)
  const [totalContado, setTotalContado] = useState('')
  const [notas, setNotas] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [cierres, setCierres] = useState([])

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const ventas = await listarVentasHoy()
      const totalDelDia = ventas.reduce((s, v) => s + Number(v.total), 0)
      setTotalSistema(totalDelDia)
      const efectivo = await listarVentasEfectivoHoy()
      setTotalEfectivo(efectivo)
      const historial = await listarCierres()
      setCierres(historial)
    } catch (e) {
      setMensaje('Error: ' + e.message)
    }
    setCargando(false)
  }

  const contado = Number(totalContado) || 0
  const diferencia = contado - totalEfectivo

  async function guardar() {
    setGuardando(true)
    setMensaje(null)
    try {
      await guardarCierreCaja({
        total_sistema: totalSistema,
        total_contado: contado,
        diferencia: diferencia,
        notas: notas.trim() || null
      })
      setMensaje('Cierre guardado')
      setTotalContado('')
      setNotas('')
      cargar()
      setTimeout(() => setMensaje(null), 3000)
    } catch (e) {
      setMensaje('Error: ' + e.message)
    }
    setGuardando(false)
  }

  function colorDiferencia() {
    if (diferencia === 0) return 'text-emerald-600 dark:text-emerald-400'
    if (Math.abs(diferencia) < 1000) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Cierre de caja
      </h1>

      {mensaje && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 mb-3 text-emerald-700 dark:text-emerald-300 text-sm">
          {mensaje}
        </div>
      )}

      {cargando ? (
        <div className="text-center text-gray-400 py-12">Cargando...</div>
      ) : (
        <>
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Total vendido hoy
            </p>
            <p className="text-3xl font-bold text-barrio-600 dark:text-barrio-500 mb-3">
              ${totalSistema.toLocaleString('es-AR')}
            </p>
            <div className="border-t border-gray-100 dark:border-stone-800 pt-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Solo efectivo (esperado en caja)
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                ${totalEfectivo.toLocaleString('es-AR')}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-stone-800">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              ¿Cuánto efectivo contás en la caja?
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={totalContado}
              onChange={e => setTotalContado(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-2xl font-bold mb-3 focus:outline-none focus:border-barrio-500"
            />

            {totalContado !== '' && (
              <div className={'p-3 rounded-xl mb-3 ' + (diferencia === 0 ? 'bg-emerald-50 dark:bg-emerald-950' : Math.abs(diferencia) < 1000 ? 'bg-amber-50 dark:bg-amber-950' : 'bg-red-50 dark:bg-red-950')}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Diferencia</span>
                  <span className={'text-xl font-bold ' + colorDiferencia()}>
                    {diferencia > 0 ? '+' : ''}${diferencia.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {diferencia === 0 && 'Caja perfecta'}
                  {diferencia > 0 && `Sobra $${diferencia.toLocaleString('es-AR')}`}
                  {diferencia < 0 && `Falta $${Math.abs(diferencia).toLocaleString('es-AR')}`}
                </p>
              </div>
            )}

            <input
              type="text"
              placeholder="Notas (opcional)"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-sm mb-3 focus:outline-none focus:border-barrio-500"
            />

            <button
              onClick={guardar}
              disabled={guardando || totalContado === ''}
              className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {guardando ? 'Guardando...' : 'Guardar cierre'}
            </button>
          </div>

          {cierres.length > 0 && (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Últimos cierres
              </p>
              <div className="space-y-2">
                {cierres.map(c => (
                  <div key={c.id} className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-stone-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                      </span>
                      <span className={'font-bold ' + (Number(c.diferencia) === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                        {Number(c.diferencia) > 0 ? '+' : ''}${Number(c.diferencia).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sistema: ${Number(c.total_sistema).toLocaleString('es-AR')} | Contado: ${Number(c.total_contado).toLocaleString('es-AR')}
                    </p>
                    {c.notas && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {c.notas}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}


