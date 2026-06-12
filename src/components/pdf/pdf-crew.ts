// Crew List & Crew Change List — format standar imigrasi/customs
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawHeader, drawTitle, infoTable, signatureBlock, finishDoc, tableTheme, L } from './pdf-base';
import type { PdfPayload } from './index';

export function crewPdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const crew: any[] = p.data.crew || [];
  const lang = p.data.lang || 'id';
  const isChange = p.def.code === 'CCL';
  const doc = new jsPDF();

  let y = drawHeader(doc, p.company);
  y = drawTitle(doc, y, isChange ? 'CREW CHANGE LIST' : 'CREW LIST', p.number, fields.docDate);

  y = infoTable(doc, y, [
    [L(lang, 'Kapal', 'Vessel'), fields.vesselName || '-'],
    ['Voyage', fields.voyageNumber || '-'],
    [L(lang, 'Pelabuhan', 'Port'), fields.portName || '-'],
  ]);

  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [isChange
      ? [
          '#',
          L(lang, 'Nama Lengkap', 'Full Name'),
          L(lang, 'Jabatan', 'Rank'),
          L(lang, 'Kewarganegaraan', 'Nationality'),
          L(lang, 'No. Paspor', 'Passport No.'),
          'Status',
          L(lang, 'Tanggal', 'Date'),
        ]
      : [
          '#',
          L(lang, 'Nama Lengkap', 'Full Name'),
          L(lang, 'Jabatan', 'Rank'),
          L(lang, 'Kewarganegaraan', 'Nationality'),
          L(lang, 'No. Paspor', 'Passport No.'),
          L(lang, 'Buku Pelaut', 'Seaman Book'),
          'Sign On',
        ]],
    body: crew.map((c, i) =>
      isChange
        ? [i + 1, c.name || '', c.rank || '', c.nationality || '', c.passport || '', c.status || '', c.date || '']
        : [i + 1, c.name || '', c.rank || '', c.nationality || '', c.passport || '', c.seamanBook || '', c.signOn || '']
    ),
    styles: { ...tableTheme.styles, fontSize: 8 },
    columnStyles: { 0: { cellWidth: 8 } },
  });
  const yy = (doc as any).lastAutoTable.finalY + 8;

  signatureBlock(doc, yy, ['Master', 'Agent'], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
