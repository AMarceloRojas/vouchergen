import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password })
      localStorage.setItem('token', res.data.access_token)
      onLogin(res.data.access_token)
    } catch {
      setError('Credenciales inválidas')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-red-700 rounded-xl px-4 py-2 inline-block mb-4">
            <span className="text-white font-black text-xl">YOBEL</span>
            <span className="text-red-200 text-xs block leading-none">supply chain</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Plataforma de Vouchers</h1>
          <p className="text-gray-400 text-sm mt-1">Inicia sesión para continuar</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="usuario@yobel.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="••••••••" />
          </div>
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition">
            {loading ? '⏳ Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [lotes, setLotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [selectedLote, setSelectedLote] = useState<any>(null)
  const [vouchers, setVouchers] = useState<any[]>([])
  const [confirmarEliminar, setConfirmarEliminar] = useState<number | null>(null)

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => { if (token) cargarLotes() }, [token])

  const cargarLotes = async () => {
    try {
      const res = await axios.get(`${API}/vouchers/lotes`, authHeaders)
      setLotes(res.data)
    } catch {
      handleLogout()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  const subirExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setMensaje('')
    const form = new FormData()
    form.append('file', file)
    const res = await axios.post(`${API}/vouchers/upload`, form, authHeaders)
    setMensaje(`✅ Lote creado con ${res.data.total} vouchers`)
    cargarLotes()
    setLoading(false)
  }

  const enviarVouchers = async (loteId: number) => {
    setLoading(true)
    setMensaje('')
    const res = await axios.post(`${API}/vouchers/enviar/${loteId}`, {}, authHeaders)
    setMensaje(`✅ Enviados: ${res.data.enviados} | Errores: ${res.data.errores}`)
    cargarLotes()
    setLoading(false)
  }

  const verVouchers = async (lote: any) => {
    setSelectedLote(lote)
    const res = await axios.get(`${API}/vouchers/lotes/${lote.id}`, authHeaders)
    setVouchers(res.data)
  }

  const eliminarLote = async (loteId: number) => {
    await axios.delete(`${API}/vouchers/lotes/${loteId}`, authHeaders)
    setConfirmarEliminar(null)
    setSelectedLote(null)
    setVouchers([])
    setMensaje('🗑️ Lote eliminado correctamente')
    cargarLotes()
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (!token) return <LoginPage onLogin={setToken} />

  return (
    <div className="min-h-screen bg-gray-50">
      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar lote?</h3>
              <p className="text-gray-500 mb-6">Esta acción eliminará el lote, todos sus vouchers y los PDFs generados. No se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmarEliminar(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition">
                  Cancelar
                </button>
                <button onClick={() => eliminarLote(confirmarEliminar)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition">
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-red-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg px-3 py-1">
              <span className="text-red-700 font-black text-lg">YOBEL</span>
              <span className="text-gray-500 text-xs block leading-none">supply chain</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Plataforma de Vouchers</h1>
              <p className="text-red-200 text-sm">Generación y envío masivo</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="bg-red-800 hover:bg-red-900 text-white text-sm px-4 py-2 rounded-xl transition">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl mb-6 font-medium">
            {mensaje}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-1">📤 Subir archivo Excel</h2>
          <p className="text-gray-500 text-sm mb-4">Columnas requeridas: Order, Client Name, Client Last Name, Email, Phone, City, Street, distrito, Reference, Postal Code, tracking Yobel, sku Name, SKU Selling Price</p>
          <label className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}>
            {loading ? '⏳ Procesando...' : '📂 Seleccionar Excel'}
            <input type="file" accept=".xlsx,.xls" onChange={subirExcel} className="hidden" disabled={loading}/>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Historial de lotes</h2>
            {lotes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-400">No hay lotes aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lotes.map(lote => (
                  <div key={lote.id} className={`border rounded-xl p-4 transition cursor-pointer ${selectedLote?.id === lote.id ? 'border-red-300 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{lote.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatFecha(lote.creadoEn)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        lote.estado === 'COMPLETADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{lote.estado}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Total: {lote.totalItems} | ✅ {lote.enviados} | ❌ {lote.errores}</p>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => verVouchers(lote)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition">
                        👁 Ver vouchers
                      </button>
                      {lote.estado === 'PENDIENTE' && (
                        <button onClick={() => enviarVouchers(lote.id)} disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                          📧 Enviar correos
                        </button>
                      )}
                      {lote.pdfMaestro && (
                        <a href={`${API}/uploads/lote_${lote.id}/lote_${lote.id}_completo.pdf`} target="_blank"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                          📥 Descargar PDF
                        </a>
                      )}
                      <button onClick={() => setConfirmarEliminar(lote.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition">
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {selectedLote ? `🎫 ${selectedLote.nombre}` : '🎫 Selecciona un lote'}
            </h2>
            {!selectedLote ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">👈</p>
                <p className="text-gray-400">Selecciona un lote para ver sus vouchers</p>
              </div>
            ) : vouchers.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No hay vouchers en este lote</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {vouchers.map(v => (
                  <div key={v.id} className="border border-gray-100 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{v.clienteNombre} {v.clienteApellido}</p>
                      <p className="text-xs text-gray-400">{v.clienteEmail}</p>
                      <p className="text-xs text-gray-400">Orden: {v.orden}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">S/ {v.total.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        v.estado === 'ENVIADO' ? 'bg-green-100 text-green-700' :
                        v.estado === 'ERROR' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{v.estado}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
