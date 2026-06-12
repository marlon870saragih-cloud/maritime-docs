'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DOC_CATEGORIES, getDocType, type DocTypeDef, canWriteDoc } from '@/lib/doc-types-client';
import { downloadPdf } from '@/components/pdf';

interface Props {
  company: any;
  vessels: any[];
  portCalls: any[];
  fromDoc: any | null;
  role: string;
}

export function DocumentHub({ company, vessels, portCalls, fromDoc, role }: Props) {
  const locale = useLocale();
  const t = useTranslations('doc');
  const tm = useTranslations('msg');

  const init = (fromDoc?.dataJson as any) || {};
  const [code, setCode] = useState<string>(fromDoc?.documentType || '');
  const [portCallId, setPortCallId] = useState<string>(fromDoc?.portCallId || '');
  const [vesselId, setVesselId] = useState<string>(fromDoc?.vesselId || '');
  const [fields, setFields] = useState<any>(init.fields || {});
  const [items, setItems] = useState<any[]>(init.items || []);
  const [log, setLog] = useState<any[]>(init.log || []);
  const [crew, setCrew] = useState<any[]>(init.crew || []);
  const [saved, setSaved] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // Picker tipe dokumen: terbuka selama belum ada tipe terpilih
  const [pickerOpen, setPickerOpen] = useState(!fromDoc?.documentType);
  const [q, setQ] = useState('');

  const def = getDocType(code);
  const label = (f: { id: string; en: string }) => (locale === 'id' ? f.id : f.en);

  // Filter pencarian: cocokkan tiap kata dengan kode + nama + deskripsi (kedua bahasa)
  const matchType = (d: DocTypeDef) => {
    const hay = [d.code, d.id, d.en, d.desc.id, d.desc.en].join(' ').toLowerCase();
    return q.trim().toLowerCase().split(/\s+/).every((w) => hay.includes(w));
  };
  const groups = DOC_CATEGORIES
    .map((g) => ({ cat: g.cat, types: g.types.filter(matchType) }))
    .filter((g) => g.types.length > 0);

  function autofill(pc: any | null, v: any | null, d: DocTypeDef | undefined, base: any) {
    if (!d) return base;
    const next = { ...base };
    for (const f of d.fields) {
      if (!f.auto) continue;
      let val = '';
      if (f.auto === 'vesselName') val = v?.vesselName ?? pc?.vessel?.vesselName ?? '';
      else if (f.auto === 'imo') val = v?.imoNumber ?? pc?.vessel?.imoNumber ?? '';
      else if (f.auto === 'voyage') val = pc?.voyageNumber ?? '';
      else if (f.auto === 'portName') val = pc?.port?.portName ?? '';
      else if (f.auto === 'shipper') val = pc?.shipper ?? '';
      else if (f.auto === 'consignee') val = pc?.consignee ?? '';
      else if (f.auto === 'principal') val = pc?.principal ?? '';
      else if (f.auto === 'berth') val = pc?.berthName ?? '';
      else if (f.auto === 'cargo')
        val = pc
          ? [pc.cargoType, pc.cargoQuantity ? `${pc.cargoQuantity} ${pc.cargoUnit || ''}`.trim() : null]
              .filter(Boolean)
              .join(', ')
          : '';
      else if (f.auto.startsWith('v:')) {
        // 'v:<kolom>' membaca kolom apa pun dari model Vessel
        const k = f.auto.slice(2);
        const raw = v?.[k] ?? pc?.vessel?.[k];
        val = raw == null ? '' : String(raw);
      }
      if (val) next[f.key] = val;
    }
    return next;
  }

  function fillCrew(v: any) {
    setCrew(
      (v?.crewMembers || []).map((c: any) => ({
        name: c.fullName,
        rank: c.rank || '',
        nationality: c.nationality || '',
        passport: c.passportNumber || '',
        seamanBook: c.seamanBook || '',
        signOn: c.signOnDate ? String(c.signOnDate).slice(0, 10) : '',
      }))
    );
  }

  const hasCrewBlock = (d?: DocTypeDef) =>
    !!d &&
    (d.blocks.includes('crew') ||
      d.blocks.includes('crewChange') ||
      (d.table?.store === 'crew' && !!d.table.prefillCrew));

  // Preset (mis. kalimat pembuka surat) diterapkan ulang setiap ganti tipe —
  // teks template milik tipe lama tidak terbawa ke tipe baru.
  function applyPresets(d: DocTypeDef | undefined, base: any) {
    if (!d) return base;
    const next = { ...base };
    for (const f of d.fields) {
      if (f.preset) next[f.key] = locale === 'id' ? f.preset.id : f.preset.en;
    }
    return next;
  }

  function selectType(c: string) {
    setCode(c);
    setSaved(null);
    setErr('');
    const d = getDocType(c);
    const pc = portCalls.find((p) => p.id === portCallId) || null;
    const v = vessels.find((x) => x.id === (pc?.vesselId || vesselId)) || null;
    setFields(applyPresets(d, autofill(pc, v, d, fields)));
    if (hasCrewBlock(d) && v) fillCrew(v);
  }

  function selectPortCall(id: string) {
    setPortCallId(id);
    const pc = portCalls.find((p) => p.id === id) || null;
    if (pc) {
      setVesselId(pc.vesselId);
      const v = vessels.find((x) => x.id === pc.vesselId) || null;
      setFields(autofill(pc, v, def, fields));
      if (hasCrewBlock(def) && v) fillCrew(v);
    }
  }

  function selectVessel(id: string) {
    setVesselId(id);
    const v = vessels.find((x) => x.id === id) || null;
    setFields(autofill(null, v, def, fields));
    if (hasCrewBlock(def) && v) fillCrew(v);
  }

  // Saat IDR baris diedit dan kurs tersedia, USD diturunkan dari kurs (masih bisa ditimpa manual)
  function setItemsFx(next: any[]) {
    const rate = +fields.usdRate || 0;
    if (rate > 0) {
      next = next.map((row, i) => {
        const prev = items[i];
        if (prev && row.idr !== prev.idr && row.usd === prev.usd) {
          const idr = +row.idr || 0;
          return { ...row, usd: idr ? String(Math.round((idr / rate) * 100) / 100) : '' };
        }
        return row;
      });
    }
    setItems(next);
  }

  async function save(status: 'DRAFT' | 'FINAL') {
    if (!def) return;
    setBusy(true);
    setErr('');
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentType: def.code,
        portCallId: portCallId || null,
        vesselId: vesselId || null,
        status,
        dataJson: { lang: locale, fields, items, log, crew },
      }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(j.error === 'subscription_expired' ? tm('subExpired') : j.error || tm('error'));
      return;
    }
    setSaved(j);
  }

  function pdf() {
    if (!def) return;
    downloadPdf({
      company,
      banks: company?.bankAccounts || [],
      def,
      data: { lang: locale, fields, items, log, crew },
      number: saved?.documentNumber || 'DRAFT',
      status: saved?.status || 'DRAFT',
    });
  }

  const writable = canWriteDoc(role, def);

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-serif text-2xl font-semibold">{t('new')}</h1>

      {/* Picker tipe dokumen: kartu per dokumen (kode + nama + fungsi) + pencarian */}
      {pickerOpen || !def ? (
        <div className="card space-y-5">
          <div>
            <label className="label">{t('type')}</label>
            <input
              className="input"
              type="search"
              placeholder={t('searchType')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>
          {groups.length === 0 && <p className="text-sm text-mute font-mono">{t('noResults')}</p>}
          {groups.map((g) => (
            <div key={g.cat.id}>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-mute mb-2">
                {locale === 'id' ? g.cat.id : g.cat.en}
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                {g.types.map((d) => (
                  <button
                    key={d.code}
                    onClick={() => {
                      selectType(d.code);
                      setPickerOpen(false);
                      setQ('');
                    }}
                    className={`text-left border p-3 transition-colors hover:border-signal ${
                      d.code === code ? 'border-signal' : 'border-line'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 border border-signal text-signal shrink-0">
                        {d.code}
                      </span>
                      <span className="text-sm font-medium">{label(d)}</span>
                    </div>
                    <p className="text-xs text-mute mt-1.5 leading-relaxed">
                      {locale === 'id' ? d.desc.id : d.desc.en}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] px-1.5 py-0.5 border border-signal text-signal shrink-0">
            {def.code}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{label(def)}</div>
            <div className="text-xs text-mute">{locale === 'id' ? def.desc.id : def.desc.en}</div>
          </div>
          <button className="btn-ghost !py-1.5 !px-3" onClick={() => setPickerOpen(true)}>
            {t('changeType')}
          </button>
        </div>
      )}

      {/* Konteks: port call & kapal (opsional — untuk auto-fill) */}
      <div className="card grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">{t('portCall')}</label>
          <select className="input" value={portCallId} onChange={(e) => selectPortCall(e.target.value)}>
            <option value="">{t('noPortCall')}</option>
            {portCalls.map((pc) => (
              <option key={pc.id} value={pc.id}>
                {pc.callReference} · {pc.vessel.vesselName} · {pc.port.portName}
              </option>
            ))}
          </select>
          {portCalls.length === 0 && (
            <p className="text-xs text-mute mt-1.5">
              {t('noPortCallsHint')}{' '}
              <a className="text-signal underline" href={`/${locale}/dashboard/port-calls`}>
                Port Call →
              </a>
            </p>
          )}
        </div>
        <div>
          <label className="label">{t('vessel')}</label>
          <select className="input" value={vesselId} onChange={(e) => selectVessel(e.target.value)}>
            <option value="">{t('noVessel')}</option>
            {vessels.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vesselName}
              </option>
            ))}
          </select>
          {vessels.length === 0 && (
            <p className="text-xs text-mute mt-1.5">
              {t('noVesselsHint')}{' '}
              <a className="text-signal underline" href={`/${locale}/dashboard/vessels`}>
                {locale === 'id' ? 'Armada Kapal' : 'Vessels'} →
              </a>
            </p>
          )}
        </div>
      </div>

      {def && (
        <>
          {/* Field dinamis dari registry */}
          <div className="card">
            <h2 className="font-serif text-lg font-medium mb-4">{label(def)}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {def.fields.map((f) => (
                <div key={f.key} className={f.span2 ? 'md:col-span-2' : ''}>
                  <label className="label">{label(f)}</label>
                  {f.kind === 'textarea' ? (
                    <textarea
                      className="input"
                      rows={2}
                      value={fields[f.key] || ''}
                      onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                    />
                  ) : f.kind === 'select' ? (
                    <select
                      className="input"
                      value={fields[f.key] || ''}
                      onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                    >
                      <option value="">{locale === 'id' ? '— pilih —' : '— select —'}</option>
                      {(f.options || []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input"
                      type={f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : f.kind === 'datetime' ? 'datetime-local' : 'text'}
                      value={fields[f.key] || ''}
                      onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {def.blocks.includes('items') && (
            <RowsEditor
              title={t('items')}
              addLabel={t('addRow')}
              rows={items}
              setRows={setItemsFx}
              cols={[
                { key: 'description', label: locale === 'id' ? 'Uraian Biaya' : 'Description', grow: true },
                ...(fields.currency !== 'IDR' ? [{ key: 'usd', label: 'USD', type: 'number' as const }] : []),
                ...(fields.currency !== 'USD' ? [{ key: 'idr', label: 'IDR', type: 'number' as const }] : []),
              ]}
            />
          )}

          {def.blocks.includes('invoiceItems') && (
            <RowsEditor
              title={t('items')}
              addLabel={t('addRow')}
              rows={items}
              setRows={setItems}
              cols={[
                { key: 'description', label: locale === 'id' ? 'Uraian' : 'Description', grow: true },
                { key: 'qty', label: 'Qty', type: 'number' },
                { key: 'unit', label: 'Unit' },
                { key: 'priceIdr', label: fields.currency === 'USD' ? 'Price (USD)' : (locale === 'id' ? 'Harga (IDR)' : 'Price (IDR)'), type: 'number' },
              ]}
            />
          )}

          {def.blocks.includes('log') && (
            <RowsEditor
              title={t('log')}
              addLabel={t('addRow')}
              rows={log}
              setRows={setLog}
              cols={[
                { key: 't', label: locale === 'id' ? 'Waktu' : 'Time', type: 'datetime-local' },
                { key: 'e', label: locale === 'id' ? 'Kejadian' : 'Event', grow: true },
              ]}
            />
          )}

          {def.blocks.includes('crew') && (
            <RowsEditor
              title={t('crew')}
              addLabel={t('addRow')}
              rows={crew}
              setRows={setCrew}
              cols={[
                { key: 'name', label: locale === 'id' ? 'Nama' : 'Name', grow: true },
                { key: 'rank', label: 'Rank' },
                { key: 'nationality', label: locale === 'id' ? 'Negara' : 'Nationality' },
                { key: 'passport', label: 'Passport' },
                { key: 'seamanBook', label: 'Seaman Book' },
                { key: 'signOn', label: 'Sign On', type: 'date' },
              ]}
            />
          )}

          {def.blocks.includes('crewChange') && (
            <RowsEditor
              title={t('crew')}
              addLabel={t('addRow')}
              rows={crew}
              setRows={setCrew}
              cols={[
                { key: 'name', label: locale === 'id' ? 'Nama' : 'Name', grow: true },
                { key: 'rank', label: 'Rank' },
                { key: 'nationality', label: locale === 'id' ? 'Negara' : 'Nationality' },
                { key: 'passport', label: 'Passport' },
                { key: 'status', label: 'Status', options: ['Sign On', 'Sign Off'] },
                { key: 'date', label: locale === 'id' ? 'Tanggal' : 'Date', type: 'date' },
              ]}
            />
          )}

          {def.blocks.includes('timesheet') && (
            <RowsEditor
              title={t('hours')}
              addLabel={t('addRow')}
              rows={log}
              setRows={setLog}
              cols={[
                { key: 'd', label: locale === 'id' ? 'Tanggal' : 'Date', type: 'date' },
                { key: 'from', label: locale === 'id' ? 'Dari' : 'From', type: 'time' },
                { key: 'to', label: locale === 'id' ? 'Sampai' : 'To', type: 'time' },
                { key: 'e', label: locale === 'id' ? 'Kegiatan' : 'Description', grow: true },
              ]}
            />
          )}

          {def.blocks.includes('manifest') && (
            <RowsEditor
              title={t('manifestItems')}
              addLabel={t('addRow')}
              rows={items}
              setRows={setItems}
              cols={[
                { key: 'bl', label: 'B/L No.' },
                { key: 'shipper', label: 'Shipper' },
                { key: 'consignee', label: 'Consignee' },
                { key: 'goods', label: locale === 'id' ? 'Uraian Barang' : 'Goods', grow: true },
                { key: 'qty', label: 'Qty' },
                { key: 'weight', label: locale === 'id' ? 'Berat' : 'Weight' },
              ]}
            />
          )}

          {/* Tabel kustom dari registry — kolom & judul didefinisikan per tipe dokumen */}
          {def.table && (
            <RowsEditor
              title={locale === 'id' ? def.table.title.id : def.table.title.en}
              addLabel={t('addRow')}
              rows={def.table.store === 'items' ? items : def.table.store === 'log' ? log : crew}
              setRows={def.table.store === 'items' ? setItems : def.table.store === 'log' ? setLog : setCrew}
              cols={def.table.cols.map((c) => ({
                key: c.key,
                label: locale === 'id' ? c.id : c.en,
                type: c.kind,
                grow: c.grow,
                options: c.options,
              }))}
            />
          )}

          {/* Aksi */}
          <div className="card flex flex-wrap items-center gap-3">
            {writable && (
              <>
                <button className="btn-ghost" disabled={busy} onClick={() => save('DRAFT')}>
                  {t('saveDraft')}
                </button>
                <button className="btn-primary" disabled={busy} onClick={() => save('FINAL')}>
                  {t('finalize')}
                </button>
              </>
            )}
            <button className="btn-ghost border-signal text-signal" onClick={pdf}>
              ⬇ {t('downloadPdf')}
            </button>
            {saved && (
              <span className="font-mono text-xs text-good">
                ✓ {t('savedAs')} {saved.documentNumber} ({saved.status})
              </span>
            )}
            {err && <span className="font-mono text-xs text-port">{err}</span>}
          </div>
        </>
      )}
    </div>
  );
}

// Editor baris generik untuk items / log / crew
function RowsEditor({
  title,
  addLabel,
  rows,
  setRows,
  cols,
}: {
  title: string;
  addLabel: string;
  rows: any[];
  setRows: (r: any[]) => void;
  cols: { key: string; label: string; type?: string; grow?: boolean; options?: string[] }[];
}) {
  const update = (i: number, k: string, v: string) => {
    const next = rows.slice();
    next[i] = { ...next[i], [k]: v };
    setRows(next);
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-medium">{title}</h2>
        <button className="btn-ghost !py-1.5 !px-3" onClick={() => setRows([...rows, {}])}>
          + {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="font-mono text-[10px] text-mute w-5 shrink-0">{i + 1}</span>
            {cols.map((c) =>
              c.options ? (
                <select
                  key={c.key}
                  className={`input !py-2 ${c.grow ? 'flex-1' : 'w-36 shrink-0'}`}
                  value={row[c.key] || ''}
                  onChange={(e) => update(i, c.key, e.target.value)}
                >
                  <option value="">{c.label}</option>
                  {c.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  key={c.key}
                  className={`input !py-2 ${c.grow ? 'flex-1' : 'w-36 shrink-0'}`}
                  type={c.type || 'text'}
                  placeholder={c.label}
                  value={row[c.key] || ''}
                  onChange={(e) => update(i, c.key, e.target.value)}
                />
              )
            )}
            <button
              className="text-port font-mono text-xs px-2 shrink-0"
              onClick={() => setRows(rows.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
