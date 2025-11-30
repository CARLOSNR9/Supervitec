export default function HomePage() {
  return (
    <main className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">
        Bienvenido a SuperviTEC PRO
      </h1>
      <a
        href="/login"
        className="text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition"
      >
        Ir al Login
      </a>
    </main>
  );
}
