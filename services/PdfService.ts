
/**
 * Nota: El sistema ahora utiliza la función nativa window.print() 
 * para garantizar la máxima compatibilidad y evitar bloqueos de la interfaz.
 */
export class PdfService {
  static async generateAttendanceReport(elementId: string, filename: string) {
    // Redirigir a la impresión nativa para evitar bloqueos
    window.print();
  }
}
