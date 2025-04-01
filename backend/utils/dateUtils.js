// dateUtils.js

/**
 * Formatea una fecha al formato "DD:MM:AAAA hh:MM AM/PM"
 * @param {Date|string|number} dateInput - Un objeto Date o un valor convertible a Date.
 * @returns {string} La fecha formateada.
 */
function formatDate(dateInput) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  
    // Obtener día, mes y año con ceros a la izquierda si es necesario
    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2); // getMonth() devuelve 0-11
    const year = date.getFullYear();
  
    // Obtener horas y minutos con formato AM/PM
    let hours = date.getHours();
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // el 0 se traduce a 12
    const formattedHours = ("0" + hours).slice(-2);
  
    return `${day}-${month}-${year} / ${formattedHours}:${minutes} ${ampm}`;
  }
  
  module.exports = { formatDate };
  