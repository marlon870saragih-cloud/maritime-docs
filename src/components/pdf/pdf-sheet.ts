// Template generik: semua field registry sebagai tabel info + tabel items opsional.
// Dipakai SOA, Mate's Receipt, Delivery Order, Ship Particulars — dan tipe baru
// apa pun yang strukturnya "lembar data" tanpa layout khusus.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawHeader, drawTitle, infoTable, signatureBlock, finishDoc, defTable, dtStr, tableTheme, L, nUsd, nIdr } from './pdf-base';
import type { PdfPayload } from './index';

const TITLES: Record<string, { id: string; en: string }> = {
  SOA: { id: 'STATEMENT OF ACCOUNT', en: 'STATEMENT OF ACCOUNT' },
  MR: { id: "MATE'S RECEIPT", en: "MATE'S RECEIPT" },
  DO: { id: 'DELIVERY ORDER', en: 'DELIVERY ORDER' },
  SHIP: { id: 'SHIP PARTICULARS', en: 'SHIP PARTICULARS' },
  FAL1: { id: 'IMO FAL FORM 1 — GENERAL DECLARATION', en: 'IMO FAL FORM 1 — GENERAL DECLARATION' },
  FAL3: { id: "IMO FAL FORM 3 — SHIP'S STORES DECLARATION", en: "IMO FAL FORM 3 — SHIP'S STORES DECLARATION" },
  FAL4: { id: "IMO FAL FORM 4 — CREW'S EFFECTS DECLARATION", en: "IMO FAL FORM 4 — CREW'S EFFECTS DECLARATION" },
  FAL6: { id: 'IMO FAL FORM 6 — PASSENGER LIST', en: 'IMO FAL FORM 6 — PASSENGER LIST' },
  FAL7: { id: 'IMO FAL FORM 7 — DANGEROUS GOODS MANIFEST', en: 'IMO FAL FORM 7 — DANGEROUS GOODS MANIFEST' },
};

const SIGNERS: Record<string, string[]> = {
  MR: ['Chief Officer'],
  DO: ['Agent'],
  SHIP: ['Agent'],
  FAL1: ['Master', 'Agent'],
  FAL3: ['Master', 'Agent'],
  FAL4: ['Master', 'Agent'],
  FAL6: ['Master', 'Agent'],
  FAL7: ['Master', 'Agent'],
};

export function sheetPdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const items: any[] = p.data.items || [];
  const lang = p.data.lang || 'id';
  const doc = new jsPDF();

  const title = TITLES[p.def.code];
  let y = drawHeader(doc, p.company, !!p.def.financial);
  y = drawTitle(doc, y, title ? L(lang, title.id, title.en) : p.def.en.toUpperCase(), p.number, fields.docDate);

  // Semua field (selain tanggal yang sudah tampil di judul) jadi baris info
  const rows: [string, string][] = p.def.fields
    .filter((f) => f.key !== 'docDate')
    .map((f) => {
      const raw = String(fields[f.key] ?? '');
      const val = f.kind === 'datetime' && raw ? dtStr(raw) : raw;
      return [lang === 'id' ? f.id : f.en, val || '-'] as [string, string];
    });
  y = infoTable(doc, y, rows);

  // Tabel rincian (mis. SOA): Uraian / USD / IDR + total
  if (p.def.blocks.includes('items') && items.length) {
    const totUsd = items.reduce((s, it) => s + (+it.usd || 0), 0);
    const totIdr = items.reduce((s, it) => s + (+it.idr || 0), 0);
    autoTable(doc, {
      ...tableTheme,
      startY: y,
      head: [['#', L(lang, 'Uraian', 'Description'), 'USD', 'IDR']],
      body: items.map((it, i) => [i + 1, it.description || '', nUsd(+it.usd || 0), nIdr(+it.idr || 0)]),
      foot: [['', 'TOTAL', nUsd(totUsd), nIdr(totIdr)]],
      footStyles: { fillColor: [244, 196, 48], textColor: [10, 22, 40], fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 9 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 38 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Tabel kustom dari registry (mis. daftar perbekalan FAL3, barang berbahaya FAL7)
  y = defTable(doc, y, p.def, p.data, lang);

  signatureBlock(doc, y + 6, SIGNERS[p.def.code] ?? [L(lang, 'Hormat kami', 'Yours faithfully')], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
