export function FeaturesOverview() {
  const features = [
    {
      category: "🔍 Búsqueda & Filtrado",
      items: [
        "Búsqueda avanzada con múltiples filtros",
        "Filtros por formato, estado y categorías",
        "Búsqueda en tiempo real",
      ],
    },
    {
      category: "📊 Estadísticas & Analytics",
      items: [
        "Dashboard de lectura con métricas personalizadas",
        "Estadísticas por formato y categoría",
        "Progreso de lectura en tiempo real",
        "Tendencias de lectura",
      ],
    },
    {
      category: "🎯 Gestión de Listas",
      items: [
        "Listas de lectura personalizadas",
        "Por Leer, Leyendo, Completados automáticos",
        "Recomendaciones inteligentes",
      ],
    },
    {
      category: "🎨 Temas & Apariencia",
      items: [
        "Modo claro/oscuro/automático",
        "Tema de color personalizable",
        "Interfaz responsive",
      ],
    },
    {
      category: "💾 Exportar & Importar",
      items: [
        "Exportar historial en CSV",
        "Exportar en JSON para respaldo",
        "Generar reportes de lectura",
      ],
    },
    {
      category: "⚡ Rendimiento",
      items: [
        "Carga de imágenes con blur-up",
        "Virtual scrolling para bibliotecas grandes",
        "Infinite scroll automático",
        "Caché inteligente",
      ],
    },
    {
      category: "🛠️ Herramientas",
      items: [
        "Operaciones en lote (favoritos, eliminar)",
        "Organización automática sugerida",
        "Atajos de teclado",
        "Múltiples vistas (cuadrícula, lista, Kanban, cronología)",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Percy's Library - Features</h2>
        <p className="text-slate-400">Tu lector de cómics completo con herramientas avanzadas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((section) => (
          <div key={section.category} className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">{section.category}</h3>
            <ul className="space-y-2">
              {section.items.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-6">
        <h3 className="text-lg font-bold text-green-300 mb-2">🚀 Versión 0.3.0</h3>
        <p className="text-sm text-slate-300">
          Incluye búsqueda avanzada, estadísticas completas, gestión de listas, temas personalizables, exportación de datos,
          y múltiples optimizaciones de rendimiento.
        </p>
      </div>
    </div>
  );
}
