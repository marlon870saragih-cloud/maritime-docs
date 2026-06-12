// Statement of Facts — tabel kronologis kejadian
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawHeader, drawTitle, infoTable, signatureBlock, finishDoc, tableTheme, L, dtStr } from './pdf-base';
import type { PdfPayload } from './index';

export function sofPdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const log: any[] = p.data.log || [];
  const lang = p.data.lang || 'id';
  const doc = new jsPDF();

  let y = drawHeader(doc, p.company);
  y = drawTitle(doc, y, 'STATEMENT OF FACTS', p.number);

  y = infoTable(doc, y, [
    [L(lang, 'Kapal', 'Vessel'), fields.vesselName || '-'],
    ['Voyage', fields.voyageNumber || '-'],
    [L(lang, 'Pelabuhan', 'Port'), `${fields.portName || '-'}${fields.berth ? ` · ${fields.berth}` : ''}`],
    [L(lang, 'Kargo', 'Cargo'), fields.cargo || '-'],
  ]);

  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [['#', L(lang, 'Tanggal & Waktu', 'Date & Time'), L(lang, 'Kejadian', 'Event')]],
    body: log.map((row, i) => [i + 1, dtStr(row.t), row.e || '']),
    columnStyles: { 0: { cellWidth: 9 }, 1: { cellWidth: 42 } },
  });
  let yy = (doc as any).lastAutoTable.finalY + 6;

  if (fields.remarks) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(`${L(lang, 'Keterangan', 'Remarks')}: ${fields.remarks}`, 182);
    doc.text(lines, 14, yy);
    yy += lines.length * 4.2 + 4;
  }

  signatureBlock(doc, yy + 6, ['Master', 'Terminal', 'Agent'], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
