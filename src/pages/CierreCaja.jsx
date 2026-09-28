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
    if (diferencia === 0) return 'text-green-700'
    if (Math.abs(diferencia) < 1000) return 'text-yellow-700'
    return 'text-red-700'
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-barrio-700">Cierre de caja</h1>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-green-700 text-sm">
          {mensaje}
        </div>
      )}

      {cargando ? (
        <p className="text-center text-gray-500 py-8">Cargando...</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total vendido hoy</p>
            <p className="text-3xl font-bold text-barrio-700 mb-3">
              ${totalSistema.toLocaleString('es-AR')}
            </p>
            <div className="border-t pt-3">
              <p className="text-sm text-gray-500 mb-1">Solo efectivo (esperado en caja)</p>
              <p className="text-xl font-bold text-gray-800">
                ${totalEfectivo.toLocaleString('es-AR')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ¿Cuánto efectivo contás en la caja?
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={totalContado}
              onChange={e => setTotalContado(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-2xl font-bold mb-3"
            />

            {totalContado !== '' && (
              <div className={'p-3 rounded-xl mb-3 ' + (diferencia === 0 ? 'bg-green-50' : Math.abs(diferencia) < 1000 ? 'bg-yellow-50' : 'bg-red-50')}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Diferencia</span>
                  <span className={'text-xl font-bold ' + colorDiferencia()}>
                    {diferencia > 0 ? '+' : ''}${diferencia.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
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
              className="w-full p-3 rounded-xl border border-gray-200 text-sm mb-3"
            />

            <button
              onClick={guardar}
              disabled={guardando || totalContado === ''}
              className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar cierre'}
            </button>
          </div>

          {cierres.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-barrio-700 mb-2">Últimos cierres</h2>
              <div className="space-y-2">
                {cierres.map(c => (
                  <div key={c.id} className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500">
                        {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                      </span>
                      <span className={'font-bold ' + (Number(c.diferencia) === 0 ? 'text-green-700' : 'text-red-700')}>
                        {Number(c.diferencia) > 0 ? '+' : ''}${Number(c.diferencia).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Sistema: ${Number(c.total_sistema).toLocaleString('es-AR')} | Contado: ${Number(c.total_contado).toLocaleString('es-AR')}
                    </p>
                    {c.notas && <p className="text-xs text-gray-400 mt-1">{c.notas}</p>}
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


