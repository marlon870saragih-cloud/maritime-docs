// Surat resmi generik: kop + tujuan + perihal + isi + tabel data + tabel kustom + ttd.
// Dipakai semua dokumen kategori "Surat & Formalitas" (APPT, PKK, RKBM, SPB, OKTB, LOP)
// — tipe surat baru cukup didaftarkan di registry tanpa kode PDF tambahan.
import jsPDF from 'jspdf';
import { drawHeader, drawTitle, infoTable, signatureBlock, finishDoc, defTable, dtStr, L } from './pdf-base';
import type { PdfPayload } from './index';

const TITLES: Record<string, { id: string; en: string }> = {
  APPT: { id: 'SURAT PENUNJUKAN KEAGENAN', en: 'LETTER OF APPOINTMENT' },
  PKK: { id: 'PEMBERITAHUAN KEDATANGAN KAPAL (PKK)', en: 'NOTICE OF VESSEL ARRIVAL (PKK)' },
  RKBM: { id: 'RENCANA KEGIATAN BONGKAR MUAT (RKBM)', en: 'CARGO OPERATIONS PLAN (RKBM)' },
  SPB: { id: 'PERMOHONAN SURAT PERSETUJUAN BERLAYAR', en: 'PORT CLEARANCE APPLICATION (SPB)' },
  OKTB: { id: 'SURAT JAMINAN AGEN (OK TO BOARD)', en: 'LETTER OF GUARANTEE (OK TO BOARD)' },
  LOP: { id: 'LETTER OF PROTEST', en: 'LETTER OF PROTEST' },
};

const SIGNERS: Record<string, string[]> = {
  LOP: ['Master', 'Agent'],
};

// Field yang tampil sebagai bagian surat, bukan baris tabel data
const NON_TABLE = new Set(['toParty', 'subject', 'body', 'docDate']);

export function letterPdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const lang = p.data.lang || 'id';
  const doc = new jsPDF();

  const title = TITLES[p.def.code];
  let y = drawHeader(doc, p.company);
  y = drawTitle(doc, y, title ? L(lang, title.id, title.en) : p.def.en.toUpperCase(), p.number, fields.docDate);

  doc.setTextColor(30, 30, 30);

  // Blok tujuan (Kepada Yth.)
  if (fields.toParty) {
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(String(fields.toParty), 90);
    doc.text(lines, 14, y);
    y += lines.length * 4.4 + 5;
  }

  // Perihal (mis. Letter of Protest)
  if (fields.subject) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`${L(lang, 'Perihal', 'Subject')}: ${fields.subject}`, 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  }

  // Isi surat
  if (fields.body) {
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(String(fields.body), 182);
    doc.text(lines, 14, y);
    y += lines.length * 4.4 + 5;
  }

  // Data kapal/dokumen: hanya field yang terisi
  const rows: [string, string][] = p.def.fields
    .filter((f) => !NON_TABLE.has(f.key))
    .map((f) => {
      const raw = String(fields[f.key] ?? '');
      const val = f.kind === 'datetime' && raw ? dtStr(raw) : raw;
      return [lang === 'id' ? f.id : f.en, val] as [string, string];
    })
    .filter(([, v]) => v !== '');
  if (rows.length) y = infoTable(doc, y, rows);

  // Tabel kustom dari registry (mis. daftar crew OKTB, rincian kegiatan RKBM)
  y = defTable(doc, y, p.def, p.data, lang);

  signatureBlock(doc, y + 6, SIGNERS[p.def.code] ?? ['Agent'], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
