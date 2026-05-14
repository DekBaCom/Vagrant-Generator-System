// Form section components for Boxsmith config panel.

const { useState: useS, useEffect: useE, useRef: useR } = React;

// ── Templates rail ────────────────────────────────────────────────────────
function TemplateRail({ templates, selectedId, onPick }) {
  const singles = Object.values(templates).filter((t) => !t.solution);
  const solutions = Object.values(templates).filter((t) => t.solution);
  const renderItem = (t) => {
    const active = t.id === selectedId;
    return (
      <button
        key={t.id}
        className={`tmpl ${active ? 'tmpl--active' : ''}`}
        onClick={() => onPick(t.id)}
      >
        <span className="tmpl-glyph">{t.glyph}</span>
        <span className="tmpl-body">
          <span className="tmpl-name">{t.name}</span>
          <span className="tmpl-tag">{t.tagline}</span>
        </span>
        {active && <span className="tmpl-check">●</span>}
      </button>
    );
  };
  return (
    <aside className="rail">
      <div className="rail-head">
        <div className="rail-eyebrow">01 · Template</div>
        <div className="rail-title">Start from a recipe</div>
      </div>
      <div className="rail-list">
        {singles.map(renderItem)}
        <div className="rail-divider">
          <span>Solutions</span>
        </div>
        {solutions.map(renderItem)}
      </div>
      <div className="rail-foot">
        <div className="rail-foot-line">
          <span className="rail-kbd">⌘</span>
          <span className="rail-kbd">K</span>
          <span>Quick switch</span>
        </div>
        <div className="rail-foot-line">
          <span className="rail-kbd">⌘</span>
          <span className="rail-kbd">D</span>
          <span>Download Vagrantfile</span>
        </div>
      </div>
    </aside>
  );
}

// ── Section primitive ────────────────────────────────────────────────────
function Section({ n, title, hint, children, right }) {
  return (
    <section className="sect">
      <header className="sect-head">
        <div className="sect-num">{n}</div>
        <div className="sect-titles">
          <h3 className="sect-title">{title}</h3>
          {hint && <p className="sect-hint">{hint}</p>}
        </div>
        {right && <div className="sect-right">{right}</div>}
      </header>
      <div className="sect-body">{children}</div>
    </section>
  );
}

// ── Field primitives ─────────────────────────────────────────────────────
function Field({ label, hint, error, children, wide }) {
  return (
    <label className={`fld ${wide ? 'fld--wide' : ''} ${error ? 'fld--err' : ''}`}>
      <div className="fld-lbl">
        <span>{label}</span>
        {error ? <span className="fld-err">{error}</span> : hint ? <span className="fld-hint">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, mono, ...rest }) {
  return (
    <input
      className={`inp ${mono ? 'inp--mono' : ''}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck="false"
      autoComplete="off"
      {...rest}
    />
  );
}

function NumberStepper({ value, onChange, min, max, step = 1, suffix }) {
  const dec = () => onChange(Math.max(min, Number(value) - step));
  const inc = () => onChange(Math.min(max, Number(value) + step));
  return (
    <div className="step">
      <button className="step-btn" onClick={dec} type="button" aria-label="decrement">−</button>
      <input
        className="step-val"
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/[^\d]/g, '');
          onChange(v === '' ? '' : Math.min(max, Math.max(min, Number(v))));
        }}
      />
      {suffix && <span className="step-suf">{suffix}</span>}
      <button className="step-btn" onClick={inc} type="button" aria-label="increment">+</button>
    </div>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={`seg-opt ${o.value === value ? 'seg-opt--on' : ''}`}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.glyph && <span className="seg-glyph">{o.glyph}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      className={`tog ${value ? 'tog--on' : ''}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
    >
      <span className="tog-knob"></span>
      <span className="tog-label">{label}</span>
    </button>
  );
}

// ── Box selector ──────────────────────────────────────────────────────────
function BoxSelect({ value, onChange, boxes }) {
  const [open, setOpen] = useS(false);
  const [q, setQ] = useS('');
  const wrapRef = useR(null);
  const current = boxes.find((b) => b.id === value);

  useE(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = boxes.filter(
    (b) =>
      !q ||
      b.id.toLowerCase().includes(q.toLowerCase()) ||
      b.label.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="bx" ref={wrapRef}>
      <button className="bx-trig" onClick={() => setOpen((v) => !v)} type="button">
        <span className={`bx-fam bx-fam--${current?.family || 'linux'}`}>
          {current?.family === 'windows' ? '⊞' : '◐'}
        </span>
        <span className="bx-trig-body">
          <span className="bx-trig-label">{current?.label || 'Pick a box'}</span>
          <span className="bx-trig-id">{current?.id}</span>
        </span>
        <span className="bx-trig-chev">▾</span>
      </button>
      {open && (
        <div className="bx-pop">
          <div className="bx-search">
            <span className="bx-search-icon">⌕</span>
            <input
              autoFocus
              placeholder="Search Vagrant Cloud…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="bx-search-meta">{filtered.length}</span>
          </div>
          <div className="bx-list">
            {filtered.map((b) => (
              <button
                key={b.id}
                className={`bx-row ${b.id === value ? 'bx-row--on' : ''}`}
                onClick={() => {
                  onChange(b.id);
                  setOpen(false);
                  setQ('');
                }}
                type="button"
              >
                <span className={`bx-fam bx-fam--${b.family}`}>
                  {b.family === 'windows' ? '⊞' : '◐'}
                </span>
                <span className="bx-row-body">
                  <span className="bx-row-label">{b.label}</span>
                  <span className="bx-row-id">{b.id}</span>
                </span>
                <span className="bx-row-meta">
                  <span>{b.arch}</span>
                  <span>{b.size}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="bx-foot">
            <span className="bx-foot-dot"></span>
            <span>Synced from Vagrant Cloud · 2 min ago</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Port forwarding list ──────────────────────────────────────────────────
function ForwardingList({ forwards, onChange, errors }) {
  const update = (i, patch) =>
    onChange(forwards.map((f, j) => (i === j ? { ...f, ...patch } : f)));
  const remove = (i) => onChange(forwards.filter((_, j) => j !== i));
  const add = () =>
    onChange([...forwards, { guest: 80, host: 8080 + forwards.length, protocol: 'tcp' }]);

  return (
    <div className="fwd">
      <div className="fwd-head">
        <span className="fwd-col fwd-col--lbl">Guest port</span>
        <span className="fwd-col fwd-col--arr"></span>
        <span className="fwd-col fwd-col--lbl">Host port</span>
        <span className="fwd-col fwd-col--proto">Proto</span>
        <span className="fwd-col fwd-col--x"></span>
      </div>
      {forwards.length === 0 && (
        <div className="fwd-empty">No port forwards. VM will be reachable on private IP only.</div>
      )}
      {forwards.map((f, i) => (
        <div key={i} className="fwd-row">
          <input
            className={`inp inp--mono inp--sm ${errors[`fw-${i}-g`] ? 'inp--err' : ''}`}
            value={f.guest}
            onChange={(e) =>
              update(i, { guest: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })
            }
          />
          <span className="fwd-arrow">→</span>
          <input
            className={`inp inp--mono inp--sm ${errors[`fw-${i}-h`] ? 'inp--err' : ''}`}
            value={f.host}
            onChange={(e) =>
              update(i, { host: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })
            }
          />
          <select
            className="inp inp--sm inp--select"
            value={f.protocol}
            onChange={(e) => update(i, { protocol: e.target.value })}
          >
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
          </select>
          <button className="fwd-x" onClick={() => remove(i)} type="button" aria-label="Remove">
            ✕
          </button>
        </div>
      ))}
      <button className="fwd-add" onClick={add} type="button">
        <span>+</span> Add forward
      </button>
    </div>
  );
}

// ── Provisioner picker ────────────────────────────────────────────────────
function ProvisionerPicker({ selected, onChange, catalog }) {
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="prov-grid">
      {Object.values(catalog).map((p) => {
        const on = selected.includes(p.id);
        return (
          <button
            key={p.id}
            className={`prov ${on ? 'prov--on' : ''}`}
            onClick={() => toggle(p.id)}
            type="button"
          >
            <span className="prov-check">
              {on ? <svg width="11" height="11" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none"><path d="M4 12l5 5L20 6"/></svg> : null}
            </span>
            <span className="prov-body">
              <span className="prov-label">{p.label}</span>
              <span className="prov-inline">{p.inline}</span>
              {p.platform && (
                <span className={`prov-platform prov-platform--${p.platform}`}>
                  {p.platform === 'windows' ? '⊞ win' : '◐ linux'}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Compute summary + meter ───────────────────────────────────────────────
function ComputeSummary({ cpus, memory }) {
  const gb = (memory / 1024).toFixed(memory % 1024 === 0 ? 0 : 1);
  return (
    <div className="cmp-summary">
      <div className="cmp-pill">
        <span className="cmp-pill-n">{cpus}</span>
        <span className="cmp-pill-u">vCPU</span>
      </div>
      <div className="cmp-pill">
        <span className="cmp-pill-n">{gb}</span>
        <span className="cmp-pill-u">GB RAM</span>
      </div>
    </div>
  );
}

function MemoryMeter({ memory }) {
  const max = 16384;
  const pct = Math.min(100, (memory / max) * 100);
  const ticks = [512, 2048, 4096, 8192, 16384];
  return (
    <div className="mm">
      <div className="mm-track">
        <div className="mm-fill" style={{ width: `${pct}%` }}></div>
        {ticks.map((tk) => (
          <div key={tk} className="mm-tick" style={{ left: `${(tk / max) * 100}%` }}>
            <span className="mm-tick-lbl">{tk >= 1024 ? `${tk / 1024}G` : `${tk}M`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Security note ─────────────────────────────────────────────────────────
function SecurityNote() {
  return (
    <div className="sec-note">
      <div className="sec-note-glyph">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>
      </div>
      <div className="sec-note-body">
        <div className="sec-note-title">Secrets stay out of the file</div>
        <div className="sec-note-text">
          Boxsmith never bakes passwords, SSH private keys, or cloud credentials into the generated
          Vagrantfile. Reference them via environment variables (<code>ENV["VAULT_TOKEN"]</code>) or
          a separate <code>.env</code> after download.
        </div>
      </div>
    </div>
  );
}

// ── Solution editor (editable accordion) ─────────────────────────────────
function SolutionEditor({ tmpl, vms, onChange }) {
  const { PROVISIONERS, OS_BOXES } = window.Boxsmith;
  const [openIdx, setOpenIdx] = useS(0);

  const updateVm = (i, patch) =>
    onChange(vms.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const updateSync = (i, patch) =>
    onChange(vms.map((v, j) => (j === i ? { ...v, sync: { ...v.sync, ...patch } } : v)));

  return (
    <div className="sol-editor">
      <div className="bs-form-head">
        <div className="bs-form-eyebrow">
          <span className="bs-form-glyph">{tmpl.glyph}</span>
          <span>{tmpl.name}</span>
          <span className="bs-form-tag sol-badge">Multi-VM · {vms.length} VMs</span>
        </div>
        <h1 className="bs-form-title">{tmpl.name}</h1>
        <p className="bs-form-lede">
          คลิกที่ VM เพื่อแก้ไขค่า — Vagrantfile อัปเดต Real-time ทางขวา กด <span className="bs-kbd">⌘D</span> เพื่อดาวน์โหลด
        </p>
      </div>

      <div className="sol-vms">
        {vms.map((vm, i) => (
          <div key={vm.name} className={`sol-vm sol-acc ${openIdx === i ? 'sol-acc--open' : ''}`}>
            <button
              className="sol-acc-head"
              type="button"
              onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
            >
              <span className="sol-vm-idx">VM {i + 1}</span>
              <span className="sol-vm-role">{vm.role}</span>
              <span className="sol-acc-meta">
                {vm.cpus} vCPU · {vm.memory >= 1024 ? `${vm.memory / 1024} GB` : `${vm.memory} MB`}
              </span>
              <span className="sol-vm-name">{vm.name}</span>
              <span className="sol-acc-chev">{openIdx === i ? '▴' : '▾'}</span>
            </button>

            {openIdx === i && (
              <div className="sol-acc-body">
                <Section n="A" title="OS Box" hint="Image from Vagrant Cloud">
                  <BoxSelect
                    value={vm.box}
                    onChange={(v) => updateVm(i, { box: v })}
                    boxes={OS_BOXES}
                  />
                </Section>

                <Section n="B" title="Provider">
                  <Segmented
                    value={vm.provider}
                    onChange={(v) => updateVm(i, { provider: v })}
                    options={[
                      { value: 'virtualbox', label: 'VirtualBox', glyph: '▣' },
                      { value: 'hyperv', label: 'Hyper-V', glyph: '⊞' },
                      { value: 'vmware_desktop', label: 'VMware', glyph: '◈' },
                      { value: 'libvirt', label: 'libvirt', glyph: '◇' },
                    ]}
                  />
                </Section>

                <Section
                  n="C"
                  title="Compute"
                  hint="Resources for this VM"
                  right={<ComputeSummary cpus={vm.cpus} memory={vm.memory} />}
                >
                  <div className="fld-grid fld-grid--2">
                    <Field label="vCPUs" hint="1 – 32">
                      <NumberStepper
                        value={vm.cpus}
                        onChange={(v) => updateVm(i, { cpus: v })}
                        min={1} max={32}
                      />
                    </Field>
                    <Field label="Memory" hint="512 – 65 536 MB">
                      <NumberStepper
                        value={vm.memory}
                        onChange={(v) => updateVm(i, { memory: v })}
                        min={512} max={65536} step={512} suffix="MB"
                      />
                    </Field>
                  </div>
                  <MemoryMeter memory={vm.memory} />
                </Section>

                <Section n="D" title="Network" hint="IP and port forwards">
                  <div className="fld-grid fld-grid--2">
                    <Field label="Private network IP" hint="Host-only network">
                      <TextInput
                        value={vm.privateIp}
                        onChange={(v) => updateVm(i, { privateIp: v })}
                        placeholder="192.168.56.10"
                        mono
                      />
                    </Field>
                    <Field label="Public network" hint="Bridge to host LAN">
                      <Toggle
                        value={vm.publicNetwork}
                        onChange={(v) => updateVm(i, { publicNetwork: v })}
                        label={vm.publicNetwork ? 'Bridged to host network' : 'Host-only'}
                      />
                    </Field>
                  </div>
                  <Field label="Port forwarding" wide hint="Map host ports to guest services">
                    <ForwardingList
                      forwards={vm.forwards}
                      onChange={(v) => updateVm(i, { forwards: v })}
                      errors={{}}
                    />
                  </Field>
                </Section>

                <Section n="E" title="Synced Folder" hint="Share files between host and guest">
                  <div className="fld-grid fld-grid--3">
                    <Field label="Host path">
                      <TextInput value={vm.sync.host} onChange={(v) => updateSync(i, { host: v })} mono />
                    </Field>
                    <Field label="Guest path">
                      <TextInput value={vm.sync.guest} onChange={(v) => updateSync(i, { guest: v })} mono />
                    </Field>
                    <Field label="Sync type">
                      <select
                        className="inp inp--select"
                        value={vm.sync.type}
                        onChange={(e) => updateSync(i, { type: e.target.value })}
                      >
                        <option value="default">Default (VirtualBox shared)</option>
                        <option value="nfs">NFS</option>
                        <option value="rsync">rsync</option>
                        <option value="smb">SMB</option>
                      </select>
                    </Field>
                  </div>
                </Section>

                <Section
                  n="F"
                  title="Provisioning"
                  hint="Run on first up"
                  right={
                    <div className="sect-pill">
                      {vm.provisioners.length}/{Object.keys(PROVISIONERS).length}
                    </div>
                  }
                >
                  <ProvisionerPicker
                    selected={vm.provisioners}
                    onChange={(v) => updateVm(i, { provisioners: v })}
                    catalog={PROVISIONERS}
                  />
                </Section>
              </div>
            )}
          </div>
        ))}
      </div>

      <SecurityNote />
    </div>
  );
}

Object.assign(window, {
  TemplateRail, Section, Field, TextInput, NumberStepper, Segmented, Toggle,
  BoxSelect, ForwardingList, ProvisionerPicker,
  ComputeSummary, MemoryMeter, SecurityNote,
  SolutionEditor,
});
