// Registry tipe dokumen — form & PDF dirender dari definisi ini.
// Menambah tipe dokumen baru = menambah entri di sini + (opsional) template PDF baru.

export type FieldKind = 'text' | 'textarea' | 'date' | 'datetime' | 'number';
// auto = kunci auto-fill dari port call / vessel terpilih.
// Bentuk 'v:<kolom>' membaca kolom apa pun dari model Vessel (mis. 'v:grossTonnage').
export type AutoKey =
  | 'vesselName' | 'imo' | 'voyage' | 'portName'
  | 'shipper' | 'consignee' | 'cargo' | 'berth' | 'master' | 'principal'
  | `v:${string}`;

export interface FieldDef {
  key: string;
  id: string; // label Bahasa Indonesia
  en: string; // label English
  kind: FieldKind;
  auto?: AutoKey;
  span2?: boolean; // lebar 2 kolom di form
  preset?: { id: string; en: string }; // teks awal (mis. kalimat pembuka surat) — diisi saat tipe dipilih
}

// Tabel kustom per tipe dokumen — alternatif blok bawaan, didefinisikan penuh di registry
// sehingga tipe baru tidak butuh kode form/PDF tambahan.
export interface DocTableDef {
  store: 'items' | 'log' | 'crew'; // array dataJson yang dipakai
  prefillCrew?: boolean; // true = baris diisi awal dari crew kapal terpilih
  title: { id: string; en: string };
  cols: {
    key: string;
    id: string;
    en: string;
    kind?: 'text' | 'date' | 'time' | 'datetime' | 'number';
    grow?: boolean;
    options?: string[];
  }[];
}

export type Block = 'items' | 'invoiceItems' | 'log' | 'crew' | 'timesheet' | 'manifest' | 'crewChange';
export type PdfKind = 'epda' | 'invoice' | 'nor' | 'sof' | 'crew' | 'bl' | 'receipt' | 'sheet' | 'timesheet' | 'manifest' | 'letter';

export interface DocTypeDef {
  code: string;
  id: string;
  en: string;
  desc: { id: string; en: string }; // 1 kalimat fungsi dokumen — tampil di picker
  cat: { id: string; en: string };
  financial?: boolean;
  pdf: PdfKind;
  fields: FieldDef[];
  blocks: Block[];
  table?: DocTableDef;
}

const CAT_DISBURSE = { id: 'Port Disbursement', en: 'Port Disbursement' };
const CAT_FINANCE = { id: 'Invoice & Keuangan', en: 'Invoice & Finance' };
const CAT_PORTOPS = { id: 'Kapal Masuk/Keluar', en: 'Arrival / Departure' };
const CAT_CARGO = { id: 'Dokumen Kargo', en: 'Cargo Documents' };
const CAT_CREW = { id: 'Dokumen Crew', en: 'Crew Documents' };
const CAT_VESSEL = { id: 'Data Kapal', en: 'Vessel Data' };
const CAT_LETTERS = { id: 'Surat & Formalitas', en: 'Letters & Formalities' };
const CAT_FAL = { id: 'IMO FAL Forms', en: 'IMO FAL Forms' };

// Field umum yang dipakai banyak dokumen
const F_VESSEL: FieldDef = { key: 'vesselName', id: 'Nama Kapal', en: 'Vessel Name', kind: 'text', auto: 'vesselName' };
const F_VOYAGE: FieldDef = { key: 'voyageNumber', id: 'Nomor Voyage', en: 'Voyage Number', kind: 'text', auto: 'voyage' };
const F_PORT: FieldDef = { key: 'portName', id: 'Pelabuhan', en: 'Port', kind: 'text', auto: 'portName' };
const F_DATE: FieldDef = { key: 'docDate', id: 'Tanggal', en: 'Date', kind: 'date' };

const EPDA_FIELDS: FieldDef[] = [
  F_VESSEL, F_VOYAGE, F_PORT, F_DATE,
  { key: 'usdRate', id: 'Kurs USD (IDR)', en: 'USD Rate (IDR)', kind: 'number' },
  { key: 'principal', id: 'Principal / Kepada', en: 'Principal / To', kind: 'text' },
  { key: 'notes', id: 'Catatan', en: 'Notes', kind: 'textarea', span2: true },
];

export const DOC_TYPES: DocTypeDef[] = [
  {
    code: 'EPDA', id: 'EPDA — Estimated Port Disbursement Account', en: 'EPDA — Estimated Port Disbursement Account',
    desc: {
      id: 'Rincian estimasi biaya pelabuhan untuk persetujuan principal sebelum kapal tiba.',
      en: 'Estimated port cost breakdown for principal approval before the vessel arrives.',
    },
    cat: CAT_DISBURSE, financial: true, pdf: 'epda',
    fields: EPDA_FIELDS, blocks: ['items'],
  },
  {
    code: 'FPDA', id: 'FPDA — Final Port Disbursement Account', en: 'FPDA — Final Port Disbursement Account',
    desc: {
      id: 'Rincian biaya final setelah kapal selesai, dibandingkan dengan estimasi EPDA.',
      en: 'Final cost statement after the port call, compared against the EPDA estimate.',
    },
    cat: CAT_DISBURSE, financial: true, pdf: 'epda',
    fields: [
      ...EPDA_FIELDS,
      { key: 'estimatedTotalUsd', id: 'Total Estimasi EPDA (USD)', en: 'EPDA Estimated Total (USD)', kind: 'number' },
    ],
    blocks: ['items'],
  },
  {
    code: 'PRODA', id: 'Proforma DA', en: 'Proforma DA',
    desc: {
      id: 'DA sementara untuk permintaan dana awal (advance) dari principal.',
      en: 'Provisional DA for requesting advance funds from the principal.',
    },
    cat: CAT_DISBURSE, financial: true, pdf: 'epda',
    fields: EPDA_FIELDS, blocks: ['items'],
  },
  {
    code: 'INV', id: 'Invoice', en: 'Invoice',
    desc: {
      id: 'Tagihan resmi ke klien dengan PPN 11% dan rekening pembayaran.',
      en: 'Official bill to the client with 11% VAT and payment details.',
    },
    cat: CAT_FINANCE, financial: true, pdf: 'invoice',
    fields: [
      { key: 'billTo', id: 'Ditagihkan Kepada (To)', en: 'Bill To', kind: 'textarea', span2: true },
      F_VESSEL, F_VOYAGE, F_DATE,
      { key: 'terms', id: 'Terms of Payment', en: 'Terms of Payment', kind: 'text' },
      { key: 'notes', id: 'Catatan', en: 'Notes', kind: 'textarea', span2: true },
    ],
    blocks: ['invoiceItems'],
  },
  {
    code: 'NOR', id: 'NOR — Notice of Readiness', en: 'NOR — Notice of Readiness',
    desc: {
      id: 'Pemberitahuan resmi Master bahwa kapal siap muat/bongkar — penentu mulainya laytime.',
      en: "Master's formal notice that the vessel is ready to load/discharge — starts laytime.",
    },
    cat: CAT_PORTOPS, pdf: 'nor',
    fields: [
      F_VESSEL,
      { key: 'imo', id: 'Nomor IMO', en: 'IMO Number', kind: 'text', auto: 'imo' },
      F_VOYAGE, F_PORT,
      { key: 'berth', id: 'Berth / Anchorage', en: 'Berth / Anchorage', kind: 'text', auto: 'berth' },
      { key: 'arrivalTime', id: 'Waktu Tiba (ATA)', en: 'Arrival Time (ATA)', kind: 'datetime' },
      { key: 'norTendered', id: 'NOR Tendered', en: 'NOR Tendered', kind: 'datetime' },
      { key: 'cargo', id: 'Deskripsi Kargo', en: 'Cargo Description', kind: 'text', auto: 'cargo' },
      { key: 'masterName', id: 'Nama Master', en: 'Master Name', kind: 'text', auto: 'master' },
      { key: 'toParty', id: 'Ditujukan Kepada', en: 'Addressed To', kind: 'text' },
    ],
    blocks: [],
  },
  {
    code: 'SOF', id: 'SOF — Statement of Facts', en: 'SOF — Statement of Facts',
    desc: {
      id: 'Kronologi kejadian selama kapal di pelabuhan — dasar perhitungan laytime.',
      en: 'Chronology of events during the port stay — basis for laytime calculation.',
    },
    cat: CAT_PORTOPS, pdf: 'sof',
    fields: [
      F_VESSEL, F_VOYAGE, F_PORT,
      { key: 'berth', id: 'Berth', en: 'Berth', kind: 'text', auto: 'berth' },
      { key: 'cargo', id: 'Kargo', en: 'Cargo', kind: 'text', auto: 'cargo' },
      { key: 'remarks', id: 'Keterangan', en: 'Remarks', kind: 'textarea', span2: true },
    ],
    blocks: ['log'],
  },
  {
    code: 'CREWLIST', id: 'Crew List', en: 'Crew List',
    desc: {
      id: 'Daftar awak kapal untuk imigrasi, bea cukai, dan formalitas pelabuhan.',
      en: 'Crew roster for immigration, customs, and port formalities.',
    },
    cat: CAT_CREW, pdf: 'crew',
    fields: [F_VESSEL, F_VOYAGE, F_PORT, F_DATE],
    blocks: ['crew'],
  },
  {
    code: 'BL', id: 'B/L — Bill of Lading', en: 'B/L — Bill of Lading',
    desc: {
      id: 'Dokumen pengangkutan sekaligus bukti kepemilikan barang.',
      en: 'Contract of carriage and document of title for the cargo.',
    },
    cat: CAT_CARGO, pdf: 'bl',
    fields: [
      { key: 'blNumber', id: 'Nomor B/L', en: 'B/L Number', kind: 'text' },
      { key: 'originals', id: 'Jumlah Original (mis. 3/3)', en: 'No. of Originals (e.g. 3/3)', kind: 'text' },
      { key: 'shipper', id: 'Shipper', en: 'Shipper', kind: 'textarea', auto: 'shipper' },
      { key: 'consignee', id: 'Consignee', en: 'Consignee', kind: 'textarea', auto: 'consignee' },
      { key: 'notifyParty', id: 'Notify Party', en: 'Notify Party', kind: 'textarea', span2: true },
      F_VESSEL, F_VOYAGE,
      { key: 'portOfLoading', id: 'Port of Loading', en: 'Port of Loading', kind: 'text', auto: 'portName' },
      { key: 'portOfDischarge', id: 'Port of Discharge', en: 'Port of Discharge', kind: 'text' },
      { key: 'goods', id: 'Description of Goods', en: 'Description of Goods', kind: 'textarea', span2: true, auto: 'cargo' },
      { key: 'marks', id: 'Marks & Numbers', en: 'Marks & Numbers', kind: 'text' },
      { key: 'quantity', id: 'Quantity', en: 'Quantity', kind: 'text' },
      { key: 'grossWeight', id: 'Gross Weight', en: 'Gross Weight', kind: 'text' },
      { key: 'measurement', id: 'Measurement', en: 'Measurement', kind: 'text' },
      { key: 'freight', id: 'Freight', en: 'Freight', kind: 'text' },
      { key: 'placeDateIssue', id: 'Tempat & Tanggal Terbit', en: 'Place & Date of Issue', kind: 'text' },
    ],
    blocks: [],
  },

  // ===== Keuangan tambahan =====
  {
    code: 'DN', id: 'Debit Note', en: 'Debit Note',
    desc: {
      id: 'Penagihan biaya tambahan / reimbursement di luar invoice utama (tanpa PPN).',
      en: 'Charge for extra costs or reimbursements outside the main invoice (no VAT).',
    },
    cat: CAT_FINANCE, financial: true, pdf: 'invoice',
    fields: [
      { key: 'billTo', id: 'Ditagihkan Kepada (To)', en: 'Bill To', kind: 'textarea', span2: true },
      F_VESSEL, F_VOYAGE, F_DATE,
      { key: 'refInvoice', id: 'Referensi Invoice / DA', en: 'Invoice / DA Reference', kind: 'text' },
      { key: 'terms', id: 'Terms of Payment', en: 'Terms of Payment', kind: 'text' },
      { key: 'notes', id: 'Catatan', en: 'Notes', kind: 'textarea', span2: true },
    ],
    blocks: ['invoiceItems'],
  },
  {
    code: 'CN', id: 'Credit Note', en: 'Credit Note',
    desc: {
      id: 'Pengurangan / koreksi atas tagihan yang sudah diterbitkan sebelumnya.',
      en: 'Reduction or correction of a previously issued bill.',
    },
    cat: CAT_FINANCE, financial: true, pdf: 'invoice',
    fields: [
      { key: 'billTo', id: 'Kepada (To)', en: 'To', kind: 'textarea', span2: true },
      F_VESSEL, F_VOYAGE, F_DATE,
      { key: 'refInvoice', id: 'Referensi Invoice yang Dikoreksi', en: 'Corrected Invoice Reference', kind: 'text' },
      { key: 'notes', id: 'Alasan / Catatan', en: 'Reason / Notes', kind: 'textarea', span2: true },
    ],
    blocks: ['invoiceItems'],
  },
  {
    code: 'RCPT', id: 'Kwitansi (Official Receipt)', en: 'Official Receipt',
    desc: {
      id: 'Bukti penerimaan pembayaran resmi, lengkap dengan terbilang.',
      en: 'Official proof of payment received, with the amount in words.',
    },
    cat: CAT_FINANCE, financial: true, pdf: 'receipt',
    fields: [
      { key: 'receivedFrom', id: 'Telah Terima Dari', en: 'Received From', kind: 'text', span2: true },
      { key: 'amountIdr', id: 'Jumlah (IDR)', en: 'Amount (IDR)', kind: 'number' },
      F_DATE,
      { key: 'forPayment', id: 'Untuk Pembayaran', en: 'For Payment Of', kind: 'textarea', span2: true },
      { key: 'payMethod', id: 'Cara Pembayaran (Tunai/Transfer)', en: 'Payment Method (Cash/Transfer)', kind: 'text' },
      { key: 'refInvoice', id: 'Referensi Invoice', en: 'Invoice Reference', kind: 'text' },
    ],
    blocks: [],
  },
  {
    code: 'SOA', id: 'Statement of Account', en: 'Statement of Account',
    desc: {
      id: 'Rekap seluruh tagihan & pembayaran per principal dalam satu periode.',
      en: 'Summary of all bills and payments per principal for a period.',
    },
    cat: CAT_FINANCE, financial: true, pdf: 'sheet',
    fields: [
      { key: 'billTo', id: 'Kepada (Principal)', en: 'To (Principal)', kind: 'textarea', span2: true },
      { key: 'periodFrom', id: 'Periode Dari', en: 'Period From', kind: 'date' },
      { key: 'periodTo', id: 'Periode Sampai', en: 'Period To', kind: 'date' },
      F_VESSEL, F_DATE,
      { key: 'notes', id: 'Catatan', en: 'Notes', kind: 'textarea', span2: true },
    ],
    blocks: ['items'],
  },

  // ===== Operasional pelabuhan tambahan =====
  {
    code: 'TS', id: 'Time Sheet', en: 'Time Sheet',
    desc: {
      id: 'Rekap jam kerja bongkar/muat — dasar perhitungan demurrage/despatch.',
      en: 'Working-time summary for demurrage/despatch calculation.',
    },
    cat: CAT_PORTOPS, pdf: 'timesheet',
    fields: [
      F_VESSEL, F_VOYAGE, F_PORT,
      { key: 'berth', id: 'Berth', en: 'Berth', kind: 'text', auto: 'berth' },
      { key: 'cargo', id: 'Kargo', en: 'Cargo', kind: 'text', auto: 'cargo' },
      { key: 'norTendered', id: 'NOR Tendered', en: 'NOR Tendered', kind: 'datetime' },
      { key: 'remarks', id: 'Keterangan', en: 'Remarks', kind: 'textarea', span2: true },
    ],
    blocks: ['timesheet'],
  },

  // ===== Kargo tambahan =====
  {
    code: 'MAN', id: 'Cargo Manifest', en: 'Cargo Manifest',
    desc: {
      id: 'Daftar seluruh muatan kapal per B/L untuk bea cukai & otoritas pelabuhan.',
      en: 'List of all cargo on board per B/L for customs and port authorities.',
    },
    cat: CAT_CARGO, pdf: 'manifest',
    fields: [
      F_VESSEL, F_VOYAGE,
      { key: 'portOfLoading', id: 'Port of Loading', en: 'Port of Loading', kind: 'text', auto: 'portName' },
      { key: 'portOfDischarge', id: 'Port of Discharge', en: 'Port of Discharge', kind: 'text' },
      F_DATE,
    ],
    blocks: ['manifest'],
  },
  {
    code: 'MR', id: "Mate's Receipt", en: "Mate's Receipt",
    desc: {
      id: 'Tanda terima muatan di atas kapal oleh Mualim I — dasar penerbitan B/L.',
      en: "Chief Officer's receipt of cargo on board — basis for issuing the B/L.",
    },
    cat: CAT_CARGO, pdf: 'sheet',
    fields: [
      { key: 'shipper', id: 'Shipper', en: 'Shipper', kind: 'textarea', auto: 'shipper', span2: true },
      F_VESSEL, F_VOYAGE,
      { key: 'portOfLoading', id: 'Port of Loading', en: 'Port of Loading', kind: 'text', auto: 'portName' },
      { key: 'portOfDischarge', id: 'Port of Discharge', en: 'Port of Discharge', kind: 'text' },
      { key: 'goods', id: 'Description of Goods', en: 'Description of Goods', kind: 'textarea', span2: true, auto: 'cargo' },
      { key: 'marks', id: 'Marks & Numbers', en: 'Marks & Numbers', kind: 'text' },
      { key: 'quantity', id: 'Quantity', en: 'Quantity', kind: 'text' },
      { key: 'grossWeight', id: 'Gross Weight', en: 'Gross Weight', kind: 'text' },
      F_DATE,
      { key: 'condition', id: 'Keterangan Kondisi Muatan', en: 'Cargo Condition Remarks', kind: 'textarea', span2: true },
    ],
    blocks: [],
  },
  {
    code: 'DO', id: 'Delivery Order (D/O)', en: 'Delivery Order (D/O)',
    desc: {
      id: 'Perintah penyerahan barang ke consignee setelah B/L asli ditukar.',
      en: 'Release order for cargo to the consignee after the original B/L is surrendered.',
    },
    cat: CAT_CARGO, pdf: 'sheet',
    fields: [
      { key: 'consignee', id: 'Consignee', en: 'Consignee', kind: 'textarea', auto: 'consignee', span2: true },
      { key: 'blNumber', id: 'Referensi No. B/L', en: 'B/L Reference No.', kind: 'text' },
      F_VESSEL, F_VOYAGE,
      { key: 'portOfDischarge', id: 'Port of Discharge', en: 'Port of Discharge', kind: 'text', auto: 'portName' },
      { key: 'goods', id: 'Description of Goods', en: 'Description of Goods', kind: 'textarea', span2: true, auto: 'cargo' },
      { key: 'quantity', id: 'Quantity', en: 'Quantity', kind: 'text' },
      { key: 'validUntil', id: 'Berlaku Sampai', en: 'Valid Until', kind: 'date' },
      F_DATE,
      { key: 'notes', id: 'Catatan', en: 'Notes', kind: 'textarea', span2: true },
    ],
    blocks: [],
  },

  // ===== Crew tambahan =====
  {
    code: 'CCL', id: 'Crew Change List', en: 'Crew Change List',
    desc: {
      id: 'Daftar awak naik/turun (sign on/off) untuk imigrasi saat pergantian crew.',
      en: 'Sign-on/sign-off list for immigration during a crew change.',
    },
    cat: CAT_CREW, pdf: 'crew',
    fields: [F_VESSEL, F_VOYAGE, F_PORT, F_DATE],
    blocks: ['crewChange'],
  },

  // ===== Data kapal =====
  {
    code: 'SHIP', id: 'Ship Particulars', en: 'Ship Particulars',
    desc: {
      id: 'Lembar data teknis kapal untuk pelabuhan, PBM, dan pihak ketiga.',
      en: "The vessel's technical data sheet for ports, stevedores, and third parties.",
    },
    cat: CAT_VESSEL, pdf: 'sheet',
    fields: [
      F_VESSEL,
      { key: 'imo', id: 'Nomor IMO', en: 'IMO Number', kind: 'text', auto: 'imo' },
      { key: 'callSign', id: 'Call Sign', en: 'Call Sign', kind: 'text', auto: 'v:callSign' },
      { key: 'mmsi', id: 'MMSI', en: 'MMSI', kind: 'text', auto: 'v:mmsi' },
      { key: 'flag', id: 'Bendera', en: 'Flag', kind: 'text', auto: 'v:flag' },
      { key: 'vesselType', id: 'Tipe Kapal', en: 'Vessel Type', kind: 'text', auto: 'v:vesselType' },
      { key: 'grossTonnage', id: 'Gross Tonnage (GT)', en: 'Gross Tonnage (GT)', kind: 'text', auto: 'v:grossTonnage' },
      { key: 'netTonnage', id: 'Net Tonnage (NT)', en: 'Net Tonnage (NT)', kind: 'text', auto: 'v:netTonnage' },
      { key: 'deadweight', id: 'Deadweight (DWT)', en: 'Deadweight (DWT)', kind: 'text', auto: 'v:deadweight' },
      { key: 'loa', id: 'LOA (m)', en: 'LOA (m)', kind: 'text', auto: 'v:loa' },
      { key: 'beam', id: 'Beam (m)', en: 'Beam (m)', kind: 'text', auto: 'v:beam' },
      { key: 'draft', id: 'Draft (m)', en: 'Draft (m)', kind: 'text', auto: 'v:draft' },
      { key: 'builtYear', id: 'Tahun Pembuatan', en: 'Year Built', kind: 'text', auto: 'v:builtYear' },
      { key: 'classification', id: 'Klasifikasi', en: 'Classification', kind: 'text', auto: 'v:classification' },
      { key: 'ownerName', id: 'Pemilik', en: 'Owner', kind: 'text', auto: 'v:ownerName' },
      { key: 'operatorName', id: 'Operator', en: 'Operator', kind: 'text', auto: 'v:operatorName' },
      { key: 'pAndIClub', id: 'P&I Club', en: 'P&I Club', kind: 'text', auto: 'v:pAndIClub' },
      F_DATE,
    ],
    blocks: [],
  },

  // ===== Surat & formalitas pelabuhan Indonesia (template 'letter') =====
  {
    code: 'APPT', id: 'Surat Penunjukan Keagenan', en: 'Letter of Appointment',
    desc: {
      id: 'Dasar legal agen bertindak atas nama principal untuk satu port call.',
      en: 'Legal basis for the agent to act on behalf of the principal for a port call.',
    },
    cat: CAT_LETTERS, pdf: 'letter',
    fields: [
      {
        key: 'toParty', id: 'Kepada', en: 'To', kind: 'textarea', span2: true,
        preset: { id: 'Kepada Yth.\nSeluruh pihak terkait', en: 'To whom it may concern' },
      },
      { key: 'principal', id: 'Principal', en: 'Principal', kind: 'text', auto: 'principal' },
      F_VESSEL, F_VOYAGE, F_PORT,
      { key: 'eta', id: 'ETA', en: 'ETA', kind: 'datetime' },
      { key: 'cargo', id: 'Kargo', en: 'Cargo', kind: 'text', auto: 'cargo' },
      {
        key: 'body', id: 'Isi Surat', en: 'Letter Body', kind: 'textarea', span2: true,
        preset: {
          id: 'Dengan ini kami beritahukan bahwa kami telah ditunjuk sebagai agen umum untuk kapal tersebut di atas selama berada di pelabuhan ini. Mohon dukungan dan kerja sama dari semua pihak terkait.',
          en: 'We hereby advise that we have been appointed as general agents for the above vessel during her call at this port. We kindly request the support and cooperation of all parties concerned.',
        },
      },
      F_DATE,
    ],
    blocks: [],
  },
  {
    code: 'PKK', id: 'PKK — Pemberitahuan Kedatangan Kapal', en: 'PKK — Notice of Vessel Arrival',
    desc: {
      id: 'Pemberitahuan rencana kedatangan kapal kepada KSOP/Syahbandar.',
      en: 'Notice of vessel arrival to the harbour master (KSOP).',
    },
    cat: CAT_LETTERS, pdf: 'letter',
    fields: [
      {
        key: 'toParty', id: 'Kepada', en: 'To', kind: 'textarea', span2: true,
        preset: { id: 'Kepada Yth.\nKepala KSOP Pelabuhan', en: 'To: The Harbour Master (KSOP)' },
      },
      F_VESSEL,
      { key: 'imo', id: 'Nomor IMO', en: 'IMO Number', kind: 'text', auto: 'imo' },
      { key: 'flag', id: 'Bendera', en: 'Flag', kind: 'text', auto: 'v:flag' },
      { key: 'grossTonnage', id: 'Gross Tonnage (GT)', en: 'Gross Tonnage (GT)', kind: 'text', auto: 'v:grossTonnage' },
      { key: 'loa', id: 'LOA (m)', en: 'LOA (m)', kind: 'text', auto: 'v:loa' },
      F_VOYAGE, F_PORT,
      { key: 'lastPort', id: 'Pelabuhan Asal', en: 'Last Port', kind: 'text' },
      { key: 'nextPort', id: 'Pelabuhan Tujuan', en: 'Next Port', kind: 'text' },
      { key: 'eta', id: 'ETA', en: 'ETA', kind: 'datetime' },
      { key: 'cargo', id: 'Kargo', en: 'Cargo', kind: 'text', auto: 'cargo' },
      {
        key: 'body', id: 'Isi Surat', en: 'Letter Body', kind: 'textarea', span2: true,
        preset: {
          id: 'Bersama ini kami sampaikan pemberitahuan rencana kedatangan kapal dengan data sebagai berikut:',
          en: 'We hereby give notice of the planned arrival of the following vessel:',
        },
      },
      F_DATE,
    ],
    blocks: [],
  },
  {
    code: 'RKBM', id: 'RKBM — Rencana Kegiatan Bongkar Muat', en: 'RKBM — Cargo Operations Plan',
    desc: {
      id: 'Rencana kegiatan bongkar muat untuk diajukan ke KSOP.',
      en: 'Cargo operations plan submitted to the port authority (KSOP).',
    },
    cat: CAT_LETTERS, pdf: 'letter',
    fields: [
      {
        key: 'toParty', id: 'Kepada', en: 'To', kind: 'textarea', span2: true,
        preset: { id: 'Kepada Yth.\nKepala KSOP Pelabuhan', en: 'To: The Harbour Master (KSOP)' },
      },
      F_VESSEL, F_VOYAGE, F_PORT,
      { key: 'berth', id: 'Berth', en: 'Berth', kind: 'text', auto: 'berth' },
      { key: 'eta', id: 'ETA', en: 'ETA', kind: 'datetime' },
      { key: 'stevedore', id: 'PBM / Stevedore', en: 'Stevedore (PBM)', kind: 'text' },
      { key: 'startPlan', id: 'Rencana Mulai', en: 'Planned Start', kind: 'date' },
      { key: 'endPlan', id: 'Rencana Selesai', en: 'Planned Completion', kind: 'date' },
      {
        key: 'body', id: 'Isi Surat', en: 'Letter Body', kind: 'textarea', span2: true,
        preset: {
          id: 'Bersama ini kami sampaikan Rencana Kegiatan Bongkar Muat (RKBM) untuk kapal tersebut di atas dengan rincian sebagai berikut:',
          en: 'We hereby submit the cargo operations plan (RKBM) for the above vessel as follows:',
        },
      },
      F_DATE,
    ],
    blocks: [],
    table: {
      store: 'items',
      title: { id: 'Rincian Kegiatan', en: 'Activity Details' },
      cols: [
        { key: 'activity', id: 'Kegiatan', en: 'Activity', options: ['Bongkar / Discharge', 'Muat / Load'] },
        { key: 'goods', id: 'Komoditi', en: 'Commodity', grow: true },
        { key: 'qty', id: 'Jumlah', en: 'Quantity' },
        { key: 'unit', id: 'Satuan', en: 'Unit' },
        { key: 'shift', id: 'Gilir Kerja', en: 'Shift' },
      ],
    },
  },
  {
    code: 'SPB', id: 'Permohonan SPB', en: 'SPB — Port Clearance Application',
    desc: {
      id: 'Permohonan penerbitan Surat Persetujuan Berlayar ke Syahbandar.',
      en: 'Application for port clearance (SPB) to the harbour master.',
    },
    cat: CAT_LETTERS, pdf: 'letter',
    fields: [
      {
        key: 'toParty', id: 'Kepada', en: 'To', kind: 'textarea', span2: true,
        preset: { id: 'Kepada Yth.\nSyahbandar Pelabuhan', en: 'To: The Harbour Master' },
      },
      F_VESSEL,
      { key: 'imo', id: 'Nomor IMO', en: 'IMO Number', kind: 'text', auto: 'imo' },
      { key: 'flag', id: 'Bendera', en: 'Flag', kind: 'text', auto: 'v:flag' },
      { key: 'grossTonnage', id: 'Gross Tonnage (GT)', en: 'Gross Tonnage (GT)', kind: 'text', auto: 'v:grossTonnage' },
      F_VOYAGE, F_PORT,
      { key: 'nextPort', id: 'Pelabuhan Tujuan', en: 'Port of Destination', kind: 'text' },
      { key: 'etd', id: 'ETD', en: 'ETD', kind: 'datetime' },
      { key: 'crewCount', id: 'Jumlah Awak', en: 'Crew on Board', kind: 'text' },
      { key: 'cargo', id: 'Muatan', en: 'Cargo', kind: 'text', auto: 'cargo' },
      {
        key: 'body', id: 'Isi Surat', en: 'Letter Body', kind: 'textarea', span2: true,
        preset: {
          id: 'Dengan hormat, bersama ini kami mengajukan permohonan penerbitan Surat Persetujuan Berlayar (SPB) untuk kapal tersebut di atas dengan data sebagai berikut:',
          en: 'We hereby request the issuance of a Port Clearance (SPB) for the above vessel with the following particulars:',
        },
      },
      F_DATE,
    ],
    blocks: [],
  },
  {
    code: 'OKTB', id: 'Surat Jaminan Agen (OK to Board)', en: 'Letter of Guarantee (OK to Board)',
    desc: {
      id: 'Jaminan agen ke Imigrasi untuk crew yang akan naik kapal.',
      en: "Agent's guarantee to Immigration for crew joining the vessel.",
    },
    cat: CAT_LETTERS, pdf: 'letter',
    fields: [
      {
        key: 'toParty', id: 'Kepada', en: 'To', kind: 'textarea', span2: true,
        preset: { id: 'Kepada Yth.\nKepala Kantor Imigrasi', en: 'To: The Immigration Office' },
      },
      F_VESSEL, F_PORT,
      { key: 'signOnDate', id: 'Rencana Naik Kapal', en: 'Planned Sign On', kind: 'date' },
      {
        key: 'body', id: 'Isi Surat', en: 'Letter Body', kind: 'textarea', span2: true,
        preset: {
          id: 'Dengan ini kami menjamin crew berikut yang akan bergabung (sign on) dengan kapal tersebut di atas. Segala biaya dan tanggung jawab selama proses keimigrasian menjadi tanggungan kami selaku agen.',
          en: 'We hereby guarantee the following crew members joining the above vessel. All costs and responsibilities during immigration formalities shall be borne by us as agents.',
        },
      },
      F_DATE,
    ],
    blocks: [],
    table: {
      store: 'crew',
      prefillCrew: true,
      title: { id: 'Daftar Crew', en: 'Crew List' },
      cols: [
        { key: 'name', id: 'Nama', en: 'Name', grow: true },
        { key: 'rank', id: 'Jabatan', en: 'Rank' },
        { key: 'nationality', id: 'Negara', en: 'Nationality' },
        { key: 'passport', id: 'Paspor', en: 'Passport' },
        { key: 'flight', id: 'Penerbangan', en: 'Flight' },
      ],
    },
  },
  {
    code: 'LOP', id: 'Letter of Protest', en: 'Letter of Protest',
    desc: {
      id: 'Protes resmi Master atas kejadian (cuaca, keterlambatan, kerusakan).',
      en: "Master's formal protest over an incident (weather, delay, damage).",
    },
    cat: CAT_LETTERS, pdf: 'letter',
    fields: [
      {
        key: 'toParty', id: 'Kepada', en: 'To', kind: 'textarea', span2: true,
        preset: { id: 'Kepada Yth.', en: 'To:' },
      },
      { key: 'subject', id: 'Perihal', en: 'Subject', kind: 'text', span2: true },
      F_VESSEL, F_VOYAGE, F_PORT,
      { key: 'berth', id: 'Berth', en: 'Berth', kind: 'text', auto: 'berth' },
      { key: 'eventTime', id: 'Waktu Kejadian', en: 'Time of Occurrence', kind: 'datetime' },
      { key: 'masterName', id: 'Nama Master', en: 'Master Name', kind: 'text', auto: 'master' },
      {
        key: 'body', id: 'Uraian Protes', en: 'Protest Details', kind: 'textarea', span2: true,
        preset: {
          id: 'Dengan ini kami, atas nama Nakhoda, menyampaikan protes resmi atas kejadian berikut:',
          en: 'On behalf of the Master, we hereby lodge a formal protest regarding the following:',
        },
      },
      F_DATE,
    ],
    blocks: [],
  },

  // ===== IMO FAL forms (template 'sheet' + tabel kustom) =====
  {
    code: 'FAL1', id: 'FAL 1 — General Declaration', en: 'FAL 1 — General Declaration',
    desc: {
      id: 'Deklarasi umum kedatangan/keberangkatan kapal — format standar IMO.',
      en: 'General declaration on arrival/departure — IMO standard format.',
    },
    cat: CAT_FAL, pdf: 'sheet',
    fields: [
      F_VESSEL,
      { key: 'imo', id: 'Nomor IMO', en: 'IMO Number', kind: 'text', auto: 'imo' },
      { key: 'callSign', id: 'Call Sign', en: 'Call Sign', kind: 'text', auto: 'v:callSign' },
      { key: 'flag', id: 'Bendera', en: 'Flag State', kind: 'text', auto: 'v:flag' },
      { key: 'masterName', id: 'Nama Master', en: 'Name of Master', kind: 'text', auto: 'master' },
      { key: 'grossTonnage', id: 'Gross Tonnage', en: 'Gross Tonnage', kind: 'text', auto: 'v:grossTonnage' },
      { key: 'netTonnage', id: 'Net Tonnage', en: 'Net Tonnage', kind: 'text', auto: 'v:netTonnage' },
      F_VOYAGE, F_PORT,
      { key: 'arrDep', id: 'Kedatangan / Keberangkatan', en: 'Arrival / Departure', kind: 'text', preset: { id: 'Kedatangan', en: 'Arrival' } },
      { key: 'lastPort', id: 'Pelabuhan Sebelumnya', en: 'Last Port', kind: 'text' },
      { key: 'nextPort', id: 'Pelabuhan Berikutnya', en: 'Next Port', kind: 'text' },
      { key: 'cargo', id: 'Deskripsi Singkat Muatan', en: 'Brief Description of Cargo', kind: 'text', auto: 'cargo' },
      { key: 'crewCount', id: 'Jumlah Crew', en: 'Number of Crew', kind: 'text' },
      { key: 'paxCount', id: 'Jumlah Penumpang', en: 'Number of Passengers', kind: 'text' },
      F_DATE,
      { key: 'notes', id: 'Keterangan', en: 'Remarks', kind: 'textarea', span2: true },
    ],
    blocks: [],
  },
  {
    code: 'FAL3', id: "FAL 3 — Ship's Stores Declaration", en: "FAL 3 — Ship's Stores Declaration",
    desc: {
      id: 'Deklarasi perbekalan kapal untuk bea cukai — format IMO.',
      en: "Declaration of ship's stores for customs — IMO format.",
    },
    cat: CAT_FAL, pdf: 'sheet',
    fields: [
      F_VESSEL,
      { key: 'imo', id: 'Nomor IMO', en: 'IMO Number', kind: 'text', auto: 'imo' },
      { key: 'flag', id: 'Bendera', en: 'Flag State', kind: 'text', auto: 'v:flag' },
      F_VOYAGE, F_PORT,
      { key: 'lastPort', id: 'Pelabuhan Sebelumnya', en: 'Last Port', kind: 'text' },
      F_DATE,
    ],
    blocks: [],
    table: {
      store: 'items',
      title: { id: 'Daftar Perbekalan', en: 'Stores' },
      cols: [
        { key: 'article', id: 'Nama Barang', en: 'Article', grow: true },
        { key: 'qty', id: 'Jumlah', en: 'Quantity' },
        { key: 'unit', id: 'Satuan', en: 'Unit' },
        { key: 'location', id: 'Lokasi Penyimpanan', en: 'Location on Board' },
      ],
    },
  },
  {
    code: 'FAL4', id: "FAL 4 — Crew's Effects Declaration", en: "FAL 4 — Crew's Effects Declaration",
    desc: {
      id: 'Deklarasi barang bawaan crew yang kena bea — format IMO.',
      en: "Declaration of crew's dutiable effects — IMO format.",
    },
    cat: CAT_FAL, pdf: 'sheet',
    fields: [
      F_VESSEL,
      { key: 'imo', id: 'Nomor IMO', en: 'IMO Number', kind: 'text', auto: 'imo' },
      { key: 'flag', id: 'Bendera', en: 'Flag State', kind: 'text', auto: 'v:flag' },
      F_VOYAGE, F_PORT, F_DATE,
    ],
    blocks: [],
    table: {
      store: 'crew',
      prefillCrew: true,
      title: { id: 'Barang Bawaan Crew', en: "Crew's Effects" },
      cols: [
        { key: 'name', id: 'Nama', en: 'Name', grow: true },
        { key: 'rank', id: 'Jabatan', en: 'Rank' },
        { key: 'effects', id: 'Barang Kena Bea/Cukai', en: 'Dutiable Effects', grow: true },
      ],
    },
  },
  {
    code: 'FAL6', id: 'FAL 6 — Passenger List', en: 'FAL 6 — Passenger List',
    desc: {
      id: 'Daftar penumpang untuk imigrasi — format IMO.',
      en: 'Passenger list for immigration — IMO format.',
    },
    cat: CAT_FAL, pdf: 'sheet',
    fields: [
      F_VESSEL,
      { key: 'flag', id: 'Bendera', en: 'Flag State', kind: 'text', auto: 'v:flag' },
      F_VOYAGE, F_PORT, F_DATE,
    ],
    blocks: [],
    table: {
      store: 'crew',
      title: { id: 'Daftar Penumpang', en: 'Passengers' },
      cols: [
        { key: 'name', id: 'Nama', en: 'Name', grow: true },
        { key: 'nationality', id: 'Negara', en: 'Nationality' },
        { key: 'passport', id: 'Paspor', en: 'Passport' },
        { key: 'embark', id: 'Naik di', en: 'Port of Embarkation' },
        { key: 'disembark', id: 'Turun di', en: 'Port of Disembarkation' },
      ],
    },
  },
  {
    code: 'FAL7', id: 'FAL 7 — Dangerous Goods Manifest', en: 'FAL 7 — Dangerous Goods Manifest',
    desc: {
      id: 'Manifest barang berbahaya di atas kapal — format IMO.',
      en: 'Manifest of dangerous goods on board — IMO format.',
    },
    cat: CAT_FAL, pdf: 'sheet',
    fields: [
      F_VESSEL,
      { key: 'imo', id: 'Nomor IMO', en: 'IMO Number', kind: 'text', auto: 'imo' },
      { key: 'callSign', id: 'Call Sign', en: 'Call Sign', kind: 'text', auto: 'v:callSign' },
      { key: 'masterName', id: 'Nama Master', en: 'Name of Master', kind: 'text', auto: 'master' },
      F_VOYAGE, F_PORT, F_DATE,
    ],
    blocks: [],
    table: {
      store: 'items',
      title: { id: 'Daftar Barang Berbahaya', en: 'Dangerous Goods' },
      cols: [
        { key: 'bl', id: 'B/L No.', en: 'B/L No.' },
        { key: 'unNo', id: 'UN No.', en: 'UN No.' },
        { key: 'imoClass', id: 'Kelas IMO', en: 'IMO Class' },
        { key: 'goods', id: 'Proper Shipping Name', en: 'Proper Shipping Name', grow: true },
        { key: 'qty', id: 'Jumlah', en: 'Quantity' },
        { key: 'weight', id: 'Berat', en: 'Weight' },
      ],
    },
  },
];

export const getDocType = (code: string) => DOC_TYPES.find((d) => d.code === code);

export const DOC_CATEGORIES = Array.from(
  new Set(DOC_TYPES.map((d) => d.cat.id))
).map((catId) => ({
  cat: DOC_TYPES.find((d) => d.cat.id === catId)!.cat,
  types: DOC_TYPES.filter((d) => d.cat.id === catId),
}));
