// Dispatcher PDF — dipanggil dari client component (dynamic import)
import type { DocTypeDef } from '@/lib/doc-types';
import type { PdfCompany } from './pdf-base';
import { epdaPdf } from './pdf-epda';
import { invoicePdf } from './pdf-invoice';
import { norPdf } from './pdf-nor';
import { sofPdf } from './pdf-sof';
import { crewPdf } from './pdf-crew';
import { blPdf } from './pdf-bl';
import { receiptPdf } from './pdf-receipt';
import { sheetPdf } from './pdf-sheet';
import { timesheetPdf } from './pdf-timesheet';
import { manifestPdf } from './pdf-manifest';
import { letterPdf } from './pdf-letter';

export interface PdfPayload {
  company: PdfCompany;
  banks: any[];
  def: DocTypeDef;
  data: any; // dataJson: { lang, fields, items, log, crew }
  number: string;
  status: string;
}

export function downloadPdf(p: PdfPayload) {
  switch (p.def.pdf) {
    case 'epda': return epdaPdf(p);
    case 'invoice': return invoicePdf(p);
    case 'nor': return norPdf(p);
    case 'sof': return sofPdf(p);
    case 'crew': return crewPdf(p);
    case 'bl': return blPdf(p);
    case 'receipt': return receiptPdf(p);
    case 'sheet': return sheetPdf(p);
    case 'timesheet': return timesheetPdf(p);
    case 'manifest': return manifestPdf(p);
    case 'letter': return letterPdf(p);
  }
}
