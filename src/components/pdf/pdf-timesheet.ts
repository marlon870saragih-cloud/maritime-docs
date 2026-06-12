// Time Sheet — jam kerja bongkar/muat dengan total jam (dasar laytime)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawHeader, drawTitle, infoTable, signatureBlock, finishDoc, tableTheme, L, dtStr } from './pdf-base';
import type { PdfPayload } from './index';

// "08:30"–"17:00" → jam desimal; lewat tengah malam dianggap +24 jam
function hours(from?: string, to?: string): number {
  if (!from || !to) return 0;
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  if ([fh, fm, th, tm].some(Number.isNaN)) return 0;
  let h = th + tm / 60 - (fh + fm / 60);
  if (h < 0) h += 24;
  return h;
}

const fmtH = (h: number) => (h ? h.toFixed(2) : '-');

export function timesheetPdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const log: any[] = p.data.log || [];
  const lang = p.data.lang || 'id';
  const doc = new jsPDF();

  let y = drawHeader(doc, p.company);
  y = drawTitle(doc, y, 'TIME SHEET', p.number);

  y = infoTable(doc, y, [
    [L(lang, 'Kapal', 'Vessel'), fields.vesselName || '-'],
    ['Voyage', fields.voyageNumber || '-'],
    [L(lang, 'Pelabuhan', 'Port'), `${fields.portName || '-'}${fields.berth ? ` · ${fields.berth}` : ''}`],
    [L(lang, 'Kargo', 'Cargo'), fields.cargo || '-'],
    ['NOR Tendered', dtStr(fields.norTendered)],
  ]);

  const total = log.reduce((s, r) => s + hours(r.from, r.to), 0);

  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [['#', L(lang, 'Tanggal', 'Date'), L(lang, 'Dari', 'From'), L(lang, 'Sampai', 'To'), L(lang, 'Kegiatan', 'Description'), L(lang, 'Jam', 'Hours')]],
    body: log.map((r, i) => [i + 1, r.d || '', r.from || '', r.to || '', r.e || '', fmtH(hours(r.from, r.to))]),
    foot: [['', '', '', '', L(lang, 'TOTAL JAM', 'TOTAL HOURS'), fmtH(total)]],
    footStyles: { fillColor: [244, 196, 48], textColor: [10, 22, 40], fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 9 },
      1: { cellWidth: 26 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      5: { cellWidth: 16, halign: 'right' },
    },
  });
  let yy = (doc as any).lastAutoTable.finalY + 6;

  if (fields.remarks) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(`${L(lang, 'Keterangan', 'Remarks')}: ${fields.remarks}`, 182);
    doc.text(lines, 14, yy);
    yy += lines.length * 4.2 + 4;
  }

  signatureBlock(doc, yy + 6, ['Master', 'Agent'], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
