import type { ComicSummary } from "../lib/api";

export function exportReadingHistoryCSV(comics: ComicSummary[]): void {
  const completedComics = comics.filter((c) => c.completed);
  
  const headers = ["Título", "Formato", "Páginas", "Progreso %", "Completado"];
  const rows = completedComics.map((c) => [
    c.title,
    c.format,
    c.pageCount,
    Math.round((c.currentPage / c.pageCount) * 100),
    "Sí",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  downloadFile(csv, "percy-reading-history.csv", "text/csv");
}

export function exportReadingHistoryJSON(comics: ComicSummary[]): void {
  const data = {
    exportDate: new Date().toISOString(),
    totalComics: comics.length,
    completedComics: comics.filter((c) => c.completed).length,
    totalPages: comics.reduce((sum, c) => sum + c.pageCount, 0),
    readPages: comics.reduce((sum, c) => sum + c.currentPage, 0),
    comics: comics.map((c) => ({
      title: c.title,
      format: c.format,
      pages: c.pageCount,
      currentPage: c.currentPage,
      completed: c.completed,
      categories: [c.category, ...c.categories].filter(Boolean),
    })),
  };

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, "percy-reading-history.json", "application/json");
}

export function generateReadingReport(comics: ComicSummary[]): string {
  const totalRead = comics.filter((c) => c.completed).length;
  const totalPages = comics.reduce((sum, c) => sum + c.pageCount, 0);
  const readPages = comics.reduce((sum, c) => sum + c.currentPage, 0);
  const hoursSpent = Math.round((readPages / 30) * 10) / 10;

  const report = `
REPORTE DE LECTURA - Percy's Library
Generado: ${new Date().toLocaleString()}

=== ESTADÍSTICAS GENERALES ===
Total de Cómics: ${comics.length}
Cómics Completados: ${totalRead}
Páginas Totales: ${totalPages}
Páginas Leídas: ${readPages}
Tiempo Aproximado: ${hoursSpent} horas
Progreso General: ${Math.round((readPages / totalPages) * 100)}%

=== DETALLES POR CÓMIC ===
${comics
    .filter((c) => c.completed)
    .map((c) => `${c.title} - ${c.pageCount} páginas`)
    .join("\n")}

=== FIN DEL REPORTE ===
  `.trim();

  return report;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
