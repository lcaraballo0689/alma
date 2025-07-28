// composables/useHoraZonificada.js
import { DateTime } from 'luxon';

export function useHoraZonificada() {
  /**
   * Convierte una hora entre zonas horarias
   * @param {string} fechaStr - Ej: "21-06-2025 / 05:14 AM"
   * @param {string} zonaOrigen - Ej: "UTC", "America/New_York", "Europe/Madrid"
   * @param {string} zonaDestino - Ej: "America/Bogota"
   * @returns {string} - Fecha ajustada en formato original
   */
  const convertirZona = (fechaStr, zonaOrigen = 'UTC', zonaDestino = 'UTC+5') => {
    try {
      const [fechaParte, horaParte] = fechaStr.split(' / ');
      const [dia, mes, anio] = fechaParte.split('-');

      const fechaISO = `${anio}-${mes}-${dia}T${formatearHora24(horaParte)}`;

      // Parsear con zona de origen
      const dt = DateTime.fromISO(fechaISO, { zone: zonaOrigen });

      if (!dt.isValid) throw new Error('Fecha inválida');

      // Convertir a zona destino
      const dtDestino = dt.setZone(zonaDestino);

      // Devolver en mismo formato: DD-MM-YYYY / hh:mm AM|PM
      const fechaFinal = dtDestino.toFormat("dd-MM-yyyy / hh:mm a");

      return fechaFinal;
    } catch (e) {
      console.error('[useHoraZonificada] Error:', e.message);
      return fechaStr;
    }
  };

  // Auxiliar para convertir AM/PM a formato 24h
  const formatearHora24 = (hora12) => {
    const date = DateTime.fromFormat(hora12, 'hh:mm a');
    return date.toFormat('HH:mm');
  };

  return { convertirZona };
}
