import Productos from './pages/Productos'

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-barrio-500 text-white p-4 shadow">
        <h1 className="text-xl font-bold">delbarrio.com</h1>
      </header>
      <main>
        <Productos />
      </main>
    </div>
  )
}
