import PDFDocument from 'pdfkit';

const BRAND = '#0E79FD';
const INK = '#0A0A1A';
const MUTED = '#6B7280';
const RULE = '#E5E7EB';
const SUCCESS = '#10B981';

/**
 * Genera el PDF del acta de Paz y Salvo finalizada.
 * @param {object} acta - registro de la tabla actas
 * @param {Array} firmas - registros de la tabla firmas ordenados por firmado_at
 * @returns {Promise<Buffer>}
 */
export function generarPdfActa(acta, firmas) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100;

    // ── Encabezado ──
    doc.fontSize(22).fillColor(BRAND).font('Helvetica-Bold').text('Siesa', 50, 50);
    doc.fontSize(16).fillColor(INK).text('Acta de Entrega de Cargo', 50, 80);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
      .text('Paz y Salvo con Sistemas de Información Empresarial – SIESA', 50, 102);

    doc.fontSize(8).fillColor(MUTED)
      .text(`Código: ${acta.codigo}`, 400, 55, { align: 'right' })
      .text(`Generado: ${fmtFecha(new Date())}`, 400, 67, { align: 'right' })
      .text(`Estado: ${acta.estado.toUpperCase()}`, 400, 79, { align: 'right' });

    doc.moveTo(50, 120).lineTo(doc.page.width - 50, 120).lineWidth(2).strokeColor(BRAND).stroke();

    // ── Sección 1: Datos del colaborador ──
    let y = 140;
    y = seccionTitulo(doc, '01 · Datos del Colaborador', y);

    const datos = [
      ['Nombre completo', acta.colaborador_nombre],
      ['Cédula de Ciudadanía', acta.colaborador_cc],
      ['Cargo', acta.cargo || '—'],
      ['Área / Unidad', acta.area || '—'],
      ['Ciudad', acta.ciudad || '—'],
      ['Tipo de retiro', acta.tipo_retiro || '—'],
      ['Fecha de retiro', acta.fecha_retiro ? fmtFecha(new Date(acta.fecha_retiro)) : '—'],
      ['Correo', acta.colaborador_email || '—'],
    ];

    doc.fontSize(9);
    for (const [k, v] of datos) {
      doc.fillColor(MUTED).font('Helvetica-Bold').text(k, 50, y, { width: 160 });
      doc.fillColor(INK).font('Helvetica').text(String(v), 220, y, { width: pageWidth - 170 });
      y += 18;
    }

    // ── Sección 2: Firmas ──
    y += 14;
    y = seccionTitulo(doc, '02 · Firmas Registradas', y);

    // header tabla
    doc.rect(50, y, pageWidth, 20).fillColor(BRAND).fill();
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    doc.text('ÁREA', 56, y + 6, { width: 130 });
    doc.text('RESPONSABLE', 190, y + 6, { width: 140 });
    doc.text('FECHA Y HORA', 334, y + 6, { width: 110 });
    doc.text('HASH (8)', 448, y + 6, { width: 110 });
    y += 20;

    doc.fontSize(8).font('Helvetica');
    for (const f of firmas) {
      if (y > doc.page.height - 120) { doc.addPage(); y = 50; }
      doc.rect(50, y, pageWidth, 22).strokeColor(RULE).lineWidth(0.5).stroke();
      doc.fillColor(MUTED).text(f.area, 56, y + 7, { width: 130, ellipsis: true });
      doc.fillColor(INK).text(f.usuario_nombre, 190, y + 7, { width: 140, ellipsis: true });
      doc.fillColor(MUTED).text(fmtFechaHora(new Date(f.firmado_at)), 334, y + 7, { width: 110 });
      doc.fillColor(SUCCESS).font('Helvetica-Bold').text(`✓ ${f.hash_firma.slice(0, 8)}…`, 448, y + 7, { width: 110 });
      doc.font('Helvetica');
      y += 22;
    }

    // ── Sección 3: Declaración ──
    y += 20;
    if (y > doc.page.height - 180) { doc.addPage(); y = 50; }
    y = seccionTitulo(doc, '03 · Declaración de Paz y Salvo', y);

    doc.rect(50, y, pageWidth, 64).fillColor('#F0F7FF').fill();
    doc.rect(50, y, 3, 64).fillColor(BRAND).fill();
    doc.fillColor(INK).fontSize(9.5).font('Helvetica').text(
      `Teniendo en cuenta la gestión de los requerimientos enunciados en la presente acta, se declara a ` +
      `${acta.colaborador_nombre}, C.C. ${acta.colaborador_cc}, a PAZ Y SALVO con Sistemas de Información ` +
      `Empresarial – SIESA, el día ${acta.finalizada_at ? fmtFecha(new Date(acta.finalizada_at)) : fmtFecha(new Date())}.`,
      62, y + 10, { width: pageWidth - 24, lineGap: 2 }
    );
    y += 76;

    // Sello
    doc.roundedRect(50, y, 130, 28, 4).lineWidth(1.5).strokeColor(SUCCESS).stroke();
    doc.fillColor(SUCCESS).fontSize(11).font('Helvetica-Bold').text('✓ PAZ Y SALVO', 60, y + 8);

    // ── Pie con hash del acta ──
    y += 48;
    doc.fontSize(7).fillColor(MUTED).font('Helvetica')
      .text(`Hash SHA-256 del acta: ${acta.hash_contenido}`, 50, y, { width: pageWidth })
      .text(`Documento generado electrónicamente. Las firmas están encadenadas criptográficamente y son verificables en el sistema.`, 50, y + 12, { width: pageWidth })
      .text(`Retención: Historia Laboral — Microfilmación`, 50, y + 24, { width: pageWidth });

    doc.end();
  });
}

function seccionTitulo(doc, texto, y) {
  doc.fontSize(11).fillColor(BRAND).font('Helvetica-Bold').text(texto, 50, y);
  doc.moveTo(50, y + 16).lineTo(doc.page.width - 50, y + 16).lineWidth(0.5).strokeColor('#0E79FD').stroke();
  return y + 26;
}

function fmtFecha(d) {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtFechaHora(d) {
  return d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
