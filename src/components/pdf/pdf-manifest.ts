// Cargo Manifest — daftar muatan per B/L untuk bea cukai & otoritas pelabuhan
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawHeader, drawTitle, infoTable, signatureBlock, finishDoc, tableTheme, L } from './pdf-base';
import type { PdfPayload } from './index';

export function manifestPdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const items: any[] = p.data.items || [];
  const lang = p.data.lang || 'id';
  const doc = new jsPDF();

  let y = drawHeader(doc, p.company);
  y = drawTitle(doc, y, 'CARGO MANIFEST', p.number, fields.docDate);

  y = infoTable(doc, y, [
    [L(lang, 'Kapal', 'Vessel'), fields.vesselName || '-'],
    ['Voyage', fields.voyageNumber || '-'],
    ['Port of Loading', fields.portOfLoading || '-'],
    ['Port of Discharge', fields.portOfDischarge || '-'],
  ]);

  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [['#', 'B/L No.', 'Shipper', 'Consignee', L(lang, 'Uraian Barang', 'Description of Goods'), 'Qty', L(lang, 'Berat', 'Weight')]],
    body: items.map((it, i) => [
      i + 1,
      it.bl || '',
      it.shipper || '',
      it.consignee || '',
      it.goods || '',
      it.qty || '',
      it.weight || '',
    ]),
    styles: { ...tableTheme.styles, fontSize: 7.5 },
    columnStyles: { 0: { cellWidth: 7 }, 1: { cellWidth: 24 }, 5: { cellWidth: 16 }, 6: { cellWidth: 20 } },
  });
  const yy = (doc as any).lastAutoTable.finalY + 8;

  signatureBlock(doc, yy, ['Agent'], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
