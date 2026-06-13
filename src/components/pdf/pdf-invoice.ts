// Invoice (PPN 11%) — juga dipakai Debit Note & Credit Note (tanpa PPN)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawHeader, drawTitle, signatureBlock, finishDoc, tableTheme, accent, accentText, L, nIdr, nUsd } from './pdf-base';
import type { PdfPayload } from './index';

const TITLES: Record<string, string> = {
  INV: 'INVOICE',
  DN: 'DEBIT NOTE',
  CN: 'CREDIT NOTE',
};

export function invoicePdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const items: any[] = p.data.items || [];
  const lang = p.data.lang || 'id';
  const currency = fields.currency || 'IDR';
  const withVat = p.def.code === 'INV' && currency === 'IDR'; // PPN hanya untuk Invoice IDR
  const nAmt = currency === 'USD' ? nUsd : nIdr;
  const currLabel = currency === 'USD' ? 'USD' : 'IDR';
  const doc = new jsPDF();

  let y = drawHeader(doc, p.company, true);
  y = drawTitle(doc, y, TITLES[p.def.code] ?? 'INVOICE', p.number, fields.docDate);

  // Blok "Bill To"
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(L(lang, 'DITAGIHKAN KEPADA', 'BILL TO'), 14, y);
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  const toLines = doc.splitTextToSize(fields.billTo || '-', 100);
  doc.text(toLines, 14, y + 4.5);

  doc.setFontSize(9);
  doc.text(`${L(lang, 'Kapal', 'Vessel')}: ${fields.vesselName || '-'}   Voyage: ${fields.voyageNumber || '-'}`, 120, y + 4.5);
  if (fields.refInvoice) doc.text(`Ref: ${fields.refInvoice}`, 120, y + 9);
  y += Math.max(toLines.length * 4.2 + 8, 16);

  const subtotal = items.reduce((s, it) => s + (+it.qty || 0) * (+it.priceIdr || 0), 0);
  const ppn = withVat ? Math.round(subtotal * 0.11) : 0;
  const total = subtotal + ppn;

  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [['#', L(lang, 'Uraian', 'Description'), 'Qty', 'Unit', `${L(lang, 'Harga Satuan', 'Unit Price')} (${currLabel})`, `Amount (${currLabel})`]],
    body: items.map((it, i) => [
      i + 1,
      it.description || '',
      it.qty || '',
      it.unit || '',
      nAmt(+it.priceIdr || 0),
      nAmt((+it.qty || 0) * (+it.priceIdr || 0)),
    ]),
    foot: withVat
      ? [
          ['', '', '', '', 'Subtotal', nIdr(subtotal)],
          ['', '', '', '', 'PPN 11%', nIdr(ppn)],
          ['', '', '', '', 'TOTAL', nIdr(total)],
        ]
      : [['', '', '', '', 'TOTAL', nAmt(total)]],
    footStyles: { fillColor: accent(), textColor: accentText(), fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 9 },
      2: { cellWidth: 14, halign: 'right' },
      3: { cellWidth: 16 },
      4: { halign: 'right', cellWidth: 36 },
      5: { halign: 'right', cellWidth: 34 },
    },
  });
  let yy = (doc as any).lastAutoTable.finalY + 6;

  if (fields.terms) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Terms of Payment: ${fields.terms}`, 14, yy);
    yy += 5;
  }
  if (fields.notes) {
    const lines = doc.splitTextToSize(`${L(lang, 'Catatan', 'Notes')}: ${fields.notes}`, 182);
    doc.text(lines, 14, yy);
    yy += lines.length * 4.2 + 3;
  }

  const banks = (p.banks || []).filter((b: any) => b.isDefault);
  if (banks.length) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(L(lang, 'Pembayaran ke:', 'Payment to:'), 14, yy + 2);
    doc.setFont('helvetica', 'normal');
    banks.forEach((b: any, i: number) => {
      doc.text(
        `${b.currency}: ${b.bankName} ${b.accountNumber} a/n ${b.holderName}${b.swiftCode ? ` · SWIFT ${b.swiftCode}` : ''}`,
        14,
        yy + 6.5 + i * 4.5
      );
    });
    yy += 6.5 + banks.length * 4.5 + 4;
  }

  signatureBlock(doc, yy + 4, [L(lang, 'Hormat kami', 'Yours faithfully')], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
