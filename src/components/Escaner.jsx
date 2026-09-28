import { useEffect, useRef, useState } from 'react'

export default function Escaner({ onDetectado, onCerrar }) {
  const videoRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let stream = null
    let detector = null
    let intervalId = null

    async function iniciar() {
      if (!('BarcodeDetector' in window)) {
        setError('Tu navegador no soporta escaner. Usa Chrome en Android.')
        return
      }

      try {
        detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
        })
      } catch (e) {
        setError('Error al iniciar detector')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e) {
        setError('No se pudo acceder a la camara: ' + e.message)
        return
      }

      intervalId = setInterval(async () => {
        if (!videoRef.current || !detector) return
        try {
          const codigos = await detector.detect(videoRef.current)
          if (codigos && codigos.length > 0) {
            const valor = codigos[0].rawValue
            clearInterval(intervalId)
            if (stream) stream.getTracks().forEach(t => t.stop())
            onDetectado(valor)
          }
        } catch (e) {}
      }, 400)
    }

    iniciar()

    return () => {
      if (intervalId) clearInterval(intervalId)
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [onDetectado])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 text-white">
        <span className="font-bold">Escanear codigo</span>
        <button onClick={onCerrar} className="text-3xl leading-none">×</button>
      </div>

      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-40 border-4 border-white rounded-xl opacity-70"></div>
        </div>

        {error && (
          <div className="absolute bottom-8 left-4 right-4 bg-red-500 text-white p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="p-4 text-white text-center text-sm opacity-70">
        Apunta la camara al codigo de barras
      </div>
    </div>
  )
}


