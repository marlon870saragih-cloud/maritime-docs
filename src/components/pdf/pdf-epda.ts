// EPDA / FPDA / Proforma DA
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawHeader, drawTitle, infoTable, signatureBlock, finishDoc, tableTheme, accent, accentText, L, nUsd, nIdr } from './pdf-base';
import type { PdfPayload } from './index';

const TITLES: Record<string, string> = {
  EPDA: 'ESTIMATED PORT DISBURSEMENT ACCOUNT',
  FPDA: 'FINAL PORT DISBURSEMENT ACCOUNT',
  PRODA: 'PROFORMA DISBURSEMENT ACCOUNT',
};

export function epdaPdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const items: any[] = p.data.items || [];
  const lang = p.data.lang || 'id';
  const doc = new jsPDF();

  let y = drawHeader(doc, p.company, true);
  y = drawTitle(doc, y, TITLES[p.def.code] ?? p.def.en, p.number, fields.docDate);

  y = infoTable(doc, y, [
    [L(lang, 'Kapal', 'Vessel'), fields.vesselName || '-'],
    ['Voyage', fields.voyageNumber || '-'],
    [L(lang, 'Pelabuhan', 'Port'), fields.portName || '-'],
    [L(lang, 'Kurs USD', 'USD Rate'), fields.usdRate ? `IDR ${nIdr(+fields.usdRate)}` : '-'],
    ['Principal', fields.principal || '-'],
  ]);

  const currency = fields.currency || 'IDR';
  const totUsd = items.reduce((s, it) => s + (+it.usd || 0), 0);
  const totIdr = items.reduce((s, it) => s + (+it.idr || 0), 0);
  const amtVal = (it: any) => currency === 'USD' ? nUsd(+it.usd || 0) : nIdr(+it.idr || 0);
  const amtTotal = currency === 'USD' ? nUsd(totUsd) : nIdr(totIdr);

  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [['#', L(lang, 'Uraian Biaya', 'Description of Charges'), currency]],
    body: items.map((it, i) => [i + 1, it.description || '', amtVal(it)]),
    foot: [['', 'TOTAL', amtTotal]],
    footStyles: { fillColor: accent(), textColor: accentText(), fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 9 },
      2: { halign: 'right', cellWidth: currency === 'USD' ? 30 : 38 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // FPDA: tampilkan selisih terhadap estimasi (hanya relevan untuk USD)
  if (p.def.code === 'FPDA' && fields.estimatedTotalUsd && currency === 'USD') {
    const est = +fields.estimatedTotalUsd;
    const diff = totUsd - est;
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(
      `${L(lang, 'Estimasi EPDA', 'EPDA Estimate')}: USD ${nUsd(est)}    ${L(lang, 'Selisih', 'Variance')}: USD ${nUsd(diff)} (${est ? ((diff / est) * 100).toFixed(1) : 0}%)`,
      14,
      y
    );
    y += 7;
  }

  if (fields.notes) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(`${L(lang, 'Catatan', 'Notes')}: ${fields.notes}`, 182);
    doc.text(lines, 14, y);
    y += lines.length * 4.2 + 4;
  }

  // Rekening bank default
  const banks = (p.banks || []).filter((b: any) => b.isDefault);
  if (banks.length) {
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(L(lang, 'Pembayaran ke:', 'Payment to:'), 14, y);
    doc.setFont('helvetica', 'normal');
    banks.forEach((b: any, i: number) => {
      doc.text(
        `${b.currency}: ${b.bankName} ${b.accountNumber} a/n ${b.holderName}${b.swiftCode ? ` · SWIFT ${b.swiftCode}` : ''}`,
        14,
        y + 4.5 + i * 4.5
      );
    });
    y += 4.5 + banks.length * 4.5 + 5;
  }

  signatureBlock(doc, y + 4, [L(lang, 'Disiapkan oleh', 'Prepared by')], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
