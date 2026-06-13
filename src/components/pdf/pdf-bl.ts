// Bill of Lading — layout kotak-kotak standar internasional (versi sederhana)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawHeader, signatureBlock, finishDoc, tableTheme, primary } from './pdf-base';
import type { PdfPayload } from './index';

function box(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value?: string) {
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h);
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text(label.toUpperCase(), x + 1.5, y + 3.2);
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  const lines = doc.splitTextToSize(value || '-', w - 4);
  doc.text(lines.slice(0, Math.floor((h - 6) / 3.6)), x + 2, y + 7);
}

export function blPdf(p: PdfPayload) {
  const f = p.data.fields || {};
  const doc = new jsPDF();

  let y = drawHeader(doc, p.company);

  const pc = primary();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(pc[0], pc[1], pc[2]);
  doc.text('BILL OF LADING', 105, y, { align: 'center' });
  y += 7;

  const LX = 14, MID = 105, W2 = 91, RW = 91;

  // Baris kiri: shipper/consignee/notify — kanan: B/L no, vessel, ports
  box(doc, LX, y, W2, 24, 'Shipper', f.shipper);
  box(doc, MID, y, RW, 12, 'B/L Number', f.blNumber || p.number);
  box(doc, MID, y + 12, RW, 12, 'No. of Original B/L', f.originals);
  y += 24;

  box(doc, LX, y, W2, 22, 'Consignee', f.consignee);
  box(doc, MID, y, RW, 11, 'Vessel', f.vesselName);
  box(doc, MID, y + 11, RW, 11, 'Voyage No.', f.voyageNumber);
  y += 22;

  box(doc, LX, y, W2, 20, 'Notify Party', f.notifyParty);
  box(doc, MID, y, RW, 10, 'Port of Loading', f.portOfLoading);
  box(doc, MID, y + 10, RW, 10, 'Port of Discharge', f.portOfDischarge);
  y += 24;

  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [['Marks & Numbers', 'Description of Goods', 'Quantity', 'Gross Weight', 'Measurement']],
    body: [[f.marks || '-', f.goods || '-', f.quantity || '-', f.grossWeight || '-', f.measurement || '-']],
    styles: { ...tableTheme.styles, fontSize: 8.5, minCellHeight: 28, valign: 'top' },
    columnStyles: { 0: { cellWidth: 34 }, 2: { cellWidth: 24 }, 3: { cellWidth: 28 }, 4: { cellWidth: 28 } },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  box(doc, LX, y, W2, 11, 'Freight', f.freight);
  box(doc, MID, y, RW, 11, 'Place & Date of Issue', f.placeDateIssue);
  y += 17;

  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  const clause =
    'SHIPPED on board in apparent good order and condition. Weight, measure, marks, numbers, quality, contents and value unknown. ' +
    'IN WITNESS whereof the number of original Bills of Lading stated above have been signed, one of which being accomplished, the others to stand void.';
  const cl = doc.splitTextToSize(clause, 182);
  doc.text(cl, 14, y);
  y += cl.length * 3.4 + 6;

  signatureBlock(doc, y, ['As Agent for the Carrier'], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${f.blNumber || p.number}.pdf`);
}
