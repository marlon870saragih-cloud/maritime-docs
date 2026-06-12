// Notice of Readiness — format surat standar internasional
import jsPDF from 'jspdf';
import { drawHeader, drawTitle, infoTable, signatureBlock, finishDoc, L, dtStr } from './pdf-base';
import type { PdfPayload } from './index';

export function norPdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const lang = p.data.lang || 'id';
  const doc = new jsPDF();

  let y = drawHeader(doc, p.company);
  y = drawTitle(doc, y, 'NOTICE OF READINESS', p.number);

  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`To: ${fields.toParty || '-'}`, 14, y);
  y += 8;

  // Badan surat NOR standar
  const body =
    `Dear Sirs,\n\n` +
    `Please be advised that the vessel ${fields.vesselName || '-'}` +
    `${fields.imo ? ` (IMO ${fields.imo})` : ''}, Voyage ${fields.voyageNumber || '-'}, ` +
    `arrived at ${fields.portName || '-'}${fields.berth ? ` (${fields.berth})` : ''} ` +
    `on ${dtStr(fields.arrivalTime)} and is in all respects ready to load/discharge ` +
    `her cargo of ${fields.cargo || '-'} in accordance with the terms, conditions and ` +
    `exceptions of the governing Charter Party.`;
  const lines = doc.splitTextToSize(body, 182);
  doc.text(lines, 14, y);
  y += lines.length * 4.4 + 8;

  y = infoTable(doc, y, [
    ['NOR Tendered', dtStr(fields.norTendered)],
    ['Master', fields.masterName || '-'],
  ]);

  y = signatureBlock(doc, y + 8, ['Master', L(lang, 'Diterima oleh', 'Accepted by'), 'Agent'], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
