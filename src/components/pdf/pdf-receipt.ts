// Kwitansi / Official Receipt — dengan terbilang ID/EN
import jsPDF from 'jspdf';
import { drawHeader, drawTitle, infoTable, signatureBlock, finishDoc, L, nIdr } from './pdf-base';
import type { PdfPayload } from './index';

// Terbilang bahasa Indonesia (bilangan bulat ≥ 0)
const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
function terbilangId(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${terbilangId(n - 10)} belas`;
  if (n < 100) return `${terbilangId(Math.floor(n / 10))} puluh${n % 10 ? ` ${terbilangId(n % 10)}` : ''}`;
  if (n < 200) return `seratus${n % 100 ? ` ${terbilangId(n % 100)}` : ''}`;
  if (n < 1000) return `${terbilangId(Math.floor(n / 100))} ratus${n % 100 ? ` ${terbilangId(n % 100)}` : ''}`;
  if (n < 2000) return `seribu${n % 1000 ? ` ${terbilangId(n % 1000)}` : ''}`;
  if (n < 1e6) return `${terbilangId(Math.floor(n / 1000))} ribu${n % 1000 ? ` ${terbilangId(n % 1000)}` : ''}`;
  if (n < 1e9) return `${terbilangId(Math.floor(n / 1e6))} juta${n % 1e6 ? ` ${terbilangId(n % 1e6)}` : ''}`;
  if (n < 1e12) return `${terbilangId(Math.floor(n / 1e9))} miliar${n % 1e9 ? ` ${terbilangId(n % 1e9)}` : ''}`;
  return `${terbilangId(Math.floor(n / 1e12))} triliun${n % 1e12 ? ` ${terbilangId(n % 1e12)}` : ''}`;
}

// Number to words English (non-negative integers)
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function wordsEn(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}`;
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${wordsEn(n % 100)}` : ''}`;
  if (n < 1e6) return `${wordsEn(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${wordsEn(n % 1000)}` : ''}`;
  if (n < 1e9) return `${wordsEn(Math.floor(n / 1e6))} million${n % 1e6 ? ` ${wordsEn(n % 1e6)}` : ''}`;
  if (n < 1e12) return `${wordsEn(Math.floor(n / 1e9))} billion${n % 1e9 ? ` ${wordsEn(n % 1e9)}` : ''}`;
  return `${wordsEn(Math.floor(n / 1e12))} trillion${n % 1e12 ? ` ${wordsEn(n % 1e12)}` : ''}`;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function receiptPdf(p: PdfPayload) {
  const fields = p.data.fields || {};
  const lang = p.data.lang || 'id';
  const amount = +fields.amountIdr || 0;
  const doc = new jsPDF();

  let y = drawHeader(doc, p.company, true);
  y = drawTitle(doc, y, L(lang, 'KWITANSI', 'OFFICIAL RECEIPT'), p.number, fields.docDate);

  const inWords = amount
    ? lang === 'id'
      ? `${cap(terbilangId(amount))} rupiah`
      : `${cap(wordsEn(amount))} rupiah`
    : '-';

  y = infoTable(doc, y, [
    [L(lang, 'Telah terima dari', 'Received from'), fields.receivedFrom || '-'],
    [L(lang, 'Terbilang', 'Amount in words'), inWords],
    [L(lang, 'Untuk pembayaran', 'For payment of'), fields.forPayment || '-'],
    [L(lang, 'Cara pembayaran', 'Payment method'), fields.payMethod || '-'],
    [L(lang, 'Referensi invoice', 'Invoice reference'), fields.refInvoice || '-'],
  ]);

  // Kotak jumlah menonjol
  doc.setFillColor(244, 196, 48);
  doc.rect(14, y + 2, 90, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 22, 40);
  doc.text(`Rp ${nIdr(amount)}`, 18, y + 10);
  doc.setFont('helvetica', 'normal');

  signatureBlock(doc, y + 28, [L(lang, 'Penerima', 'Received by')], {
    name: p.company.signerName,
    title: p.company.signerTitle,
  });

  finishDoc(doc, p.company, p.status, `${p.number}.pdf`);
}
