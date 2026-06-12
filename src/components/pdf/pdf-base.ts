// Fondasi semua PDF: header kop perusahaan, judul, footer, tanda tangan, watermark.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DocTypeDef } from '@/lib/doc-types';

export interface PdfCompany {
  name: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  emailOps?: string | null;
  website?: string | null;
  npwp?: string | null;
  logoData?: string | null;
  signerName?: string | null;
  signerTitle?: string | null;
}

export const L = (lang: string, id: string, en: string) => (lang === 'id' ? id : en);

export const nUsd = (n: number) =>
  (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const nIdr = (n: number) => (n || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });

// Tema tabel konsisten: header navy, teks putih
export const tableTheme = {
  theme: 'grid' as const,
  styles: { fontSize: 9, textColor: [30, 30, 30] as [number, number, number], cellPadding: 2 },
  headStyles: {
    fillColor: [10, 22, 40] as [number, number, number],
    textColor: 255 as const,
    fontSize: 8.5,
    fontStyle: 'bold' as const,
  },
  margin: { left: 14, right: 14 },
};

export function drawHeader(doc: jsPDF, company: PdfCompany, financial = false): number {
  let x = 14;
  if (company.logoData) {
    try {
      const fmt = company.logoData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(company.logoData, fmt, 14, 9, 22, 22);
      x = 40;
    } catch {
      // Logo tidak valid → lanjut tanpa logo
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(10, 22, 40);
  doc.text(company.name.toUpperCase(), x, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const lines: string[] = [];
  const addr = [company.address, company.city, company.province].filter(Boolean).join(', ');
  if (addr) lines.push(addr);
  const contact = [
    company.phone ? `Tel: ${company.phone}` : null,
    company.emailOps,
    company.website,
  ]
    .filter(Boolean)
    .join('  ·  ');
  if (contact) lines.push(contact);
  if (financial && company.npwp) lines.push(`NPWP: ${company.npwp}`);
  lines.forEach((l, i) => doc.text(l, x, 20 + i * 4));

  doc.setDrawColor(10, 22, 40);
  doc.setLineWidth(0.6);
  doc.line(14, 35, 196, 35);
  return 43;
}

export function drawTitle(doc: jsPDF, y: number, title: string, number: string, dateStr?: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 22, 40);
  doc.text(title, 105, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`No: ${number}${dateStr ? `    ·    ${dateStr}` : ''}`, 105, y + 5.5, { align: 'center' });
  return y + 13;
}

export function infoTable(doc: jsPDF, y: number, rows: [string, string][]): number {
  autoTable(doc, {
    startY: y,
    body: rows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.2, textColor: [30, 30, 30] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });
  return (doc as any).lastAutoTable.finalY + 4;
}

export function signatureBlock(
  doc: jsPDF,
  y: number,
  labels: string[],
  signer?: { name?: string | null; title?: string | null }
): number {
  if (y > 235) {
    doc.addPage();
    y = 25;
  }
  const w = 182 / labels.length;
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  labels.forEach((lab, i) => {
    const cx = 14 + w * i + w / 2;
    doc.setFont('helvetica', 'normal');
    doc.text(lab, cx, y, { align: 'center' });
    doc.setDrawColor(100);
    doc.line(cx - 26, y + 24, cx + 26, y + 24);
    // Penandatangan default perusahaan di kolom terakhir
    if (i === labels.length - 1 && signer?.name) {
      doc.setFont('helvetica', 'bold');
      doc.text(signer.name, cx, y + 28.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      if (signer.title) doc.text(signer.title, cx, y + 32.5, { align: 'center' });
    }
  });
  return y + 38;
}

export function finishDoc(doc: jsPDF, company: PdfCompany, status: string, filename: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${company.name}  —  Page ${i} / ${pages}`, 105, 290, { align: 'center' });
    if (status === 'DRAFT') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(72);
      doc.setTextColor(228, 228, 228);
      doc.text('DRAFT', 105, 180, { align: 'center', angle: 40 });
      doc.setFont('helvetica', 'normal');
    }
  }
  doc.save(filename);
}

// "2026-06-11T08:30" → "2026-06-11 08:30"
export const dtStr = (s?: string) => (s ? s.replace('T', ' ') : '-');

// Render tabel kustom dari registry (def.table) — dipakai template 'sheet' & 'letter'.
// Data diambil dari array dataJson sesuai def.table.store (items/log/crew).
export function defTable(doc: jsPDF, y: number, def: DocTypeDef, data: any, lang: string): number {
  const t = def.table;
  if (!t) return y;
  const rows: any[] = data[t.store] || [];
  if (!rows.length) return y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(10, 22, 40);
  doc.text(lang === 'id' ? t.title.id : t.title.en, 14, y);
  doc.setFont('helvetica', 'normal');

  autoTable(doc, {
    ...tableTheme,
    startY: y + 2.5,
    head: [['#', ...t.cols.map((c) => (lang === 'id' ? c.id : c.en))]],
    body: rows.map((r, i) => [i + 1, ...t.cols.map((c) => r[c.key] ?? '')]),
    styles: { ...tableTheme.styles, fontSize: 8 },
    columnStyles: { 0: { cellWidth: 8 } },
  });
  return (doc as any).lastAutoTable.finalY + 6;
}
