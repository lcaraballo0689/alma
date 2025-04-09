// controllers/horariosController.js
const { connectDB, sql } = require('../config/db');

/** Convierte "hh:mm AM/PM" a "HH:mm" (24h) */
function amPmTo24h(horaAmPm) {
  if (!horaAmPm) return null;
  const [time, ampm] = horaAmPm.split(' ');
  let [hh, mm] = time.split(':').map(Number);

  if (ampm.toLowerCase() === 'pm' && hh < 12) hh += 12;
  else if (ampm.toLowerCase() === 'am' && hh === 12) hh = 0;

  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

/** Convierte "HH:mm" (24h) a "hh:mm AM/PM" */
function h24toAmPm(h24) {
  if (!h24) return null;
  let [hh, mm] = h24.split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  if (hh === 0) hh = 12;
  else if (hh > 12) hh -= 12;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
}

/** De un int 0..23 a "HH:00". Ej.: 8 => "08:00", 17 => "17:00" */
function hourIntToH24String(intVal) {
  if (intVal == null) return null;
  return `${intVal.toString().padStart(2, '0')}:00`;
}

/** De "HH:mm" a int (0..23). Ej.: "08:00" => 8 */
function h24StringToHourInt(h24String) {
  if (!h24String) return null;
  const [hh, mm] = h24String.split(':').map(Number);
  return hh;
}

/** GET: agrupa horarios */
async function getHorariosAgrupados(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT
        H.id,
        H.clienteId,
        H.dia,
        H.horaInicio, -- int 0..23
        H.horaFin,    -- int 0..23
        H.createdAt,
        H.updatedAt,
        C.nombre AS clienteNombre
      FROM dbo.HorasLaborales H
      JOIN dbo.Cliente C ON C.id = H.clienteId
      ORDER BY H.clienteId, H.dia
    `);

    // Prepara un objeto base con los días
    const initialDias = {
      lunes:     { active: false, horaInicio: null, horaFin: null },
      martes:    { active: false, horaInicio: null, horaFin: null },
      miércoles: { active: false, horaInicio: null, horaFin: null },
      jueves:    { active: false, horaInicio: null, horaFin: null },
      viernes:   { active: false, horaInicio: null, horaFin: null },
      sábado:    { active: false, horaInicio: null, horaFin: null },
      domingo:   { active: false, horaInicio: null, horaFin: null }
    };

    const map = new Map();

    for (const row of result.recordset) {
      const dayName = (row.dia || '').toLowerCase(); // "lunes", "martes", etc.
      const cId = row.clienteId;

      if (!map.has(cId)) {
        map.set(cId, {
          clienteId: cId,
          clienteNombre: row.clienteNombre,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          // Clona "initialDias"
          dias: JSON.parse(JSON.stringify(initialDias))
        });
      }
      const obj = map.get(cId);

      if (obj.dias[dayName]) {
        obj.dias[dayName].active = true;
        // int => "HH:00" => AM/PM
        const hInicio24 = hourIntToH24String(row.horaInicio); // 8 => "08:00"
        const hFin24 = hourIntToH24String(row.horaFin);       // 17 => "17:00"
        obj.dias[dayName].horaInicio = h24toAmPm(hInicio24);  // "08:00 AM"
        obj.dias[dayName].horaFin = h24toAmPm(hFin24);        // "05:00 PM"
      } else {
        console.warn('Día no mapeado:', row.dia);
      }
    }

    // Retornar como array
    const data = Array.from(map.values());
    return res.json(data);
  } catch (error) {
    console.error('Error en getHorariosAgrupados:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/** POST: guardar/actualizar horarios de un cliente (7 días) */
async function saveHorariosCliente(req, res) {
  const { clienteId, dias } = req.body;
  if (!clienteId || !dias) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: clienteId o dias.' });
  }
  try {
    const pool = await connectDB();
    const dayNames = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];

    for (const dayName of dayNames) {
      const infoDia = dias[dayName];
      if (!infoDia) continue; // si no hay info para ese día, skip
      if (!infoDia.active) {
        // Eliminar si existe
        await pool.request()
          .input('clienteId', sql.Int, clienteId)
          .input('dia', sql.NVarChar, dayName)
          .query(`
            DELETE FROM dbo.HorasLaborales
            WHERE clienteId = @clienteId AND dia = @dia
          `);
      } else {
        // Conviertes "08:00 AM" => "08:00" => 8
        const horaInicio24 = amPmTo24h(infoDia.horaInicio); 
        const horaFin24 = amPmTo24h(infoDia.horaFin);

        const horaInicioInt = horaInicio24 ? h24StringToHourInt(horaInicio24) : null;
        const horaFinInt = horaFin24 ? h24StringToHourInt(horaFin24) : null;

        const check = await pool.request()
          .input('clienteId', sql.Int, clienteId)
          .input('dia', sql.NVarChar, dayName)
          .query(`
            SELECT id FROM dbo.HorasLaborales
            WHERE clienteId = @clienteId AND dia = @dia
          `);

        if (check.recordset.length === 0) {
          // Insert
          await pool.request()
            .input('clienteId', sql.Int, clienteId)
            .input('dia', sql.NVarChar, dayName)
            .input('horaInicio', sql.Int, horaInicioInt)
            .input('horaFin', sql.Int, horaFinInt)
            .query(`
              INSERT INTO dbo.HorasLaborales (clienteId, dia, horaInicio, horaFin, createdAt, updatedAt)
              VALUES (@clienteId, @dia, @horaInicio, @horaFin, GETDATE(), GETDATE())
            `);
        } else {
          // Update
          const id = check.recordset[0].id;
          await pool.request()
            .input('id', sql.Int, id)
            .input('horaInicio', sql.Int, horaInicioInt)
            .input('horaFin', sql.Int, horaFinInt)
            .query(`
              UPDATE dbo.HorasLaborales
              SET horaInicio = @horaInicio,
                  horaFin = @horaFin,
                  updatedAt = GETDATE()
              WHERE id = @id
            `);
        }
      }
    }

    return res.json({ message: 'Horarios guardados correctamente.' });
  } catch (error) {
    console.error('Error en saveHorariosCliente:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = {
  getHorariosAgrupados,
  saveHorariosCliente
};
