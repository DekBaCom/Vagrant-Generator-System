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

// ── Solution view ─────────────────────────────────────────────────────────
function SolutionView({ tmpl }) {
  const { PROVISIONERS, PROVIDER_LABEL } = window.Boxsmith;
  return (
    <div className="sol-root">
      <div className="bs-form-head">
        <div className="bs-form-eyebrow">
          <span className="bs-form-glyph">{tmpl.glyph}</span>
          <span>{tmpl.name}</span>
          <span className="bs-form-tag sol-badge">Multi-VM Solution · {tmpl.vms.length} VMs</span>
        </div>
        <h1 className="bs-form-title">{tmpl.name}</h1>
        <p className="bs-form-lede">
          {tmpl.tagline}. ดาวน์โหลด Vagrantfile แล้วรัน <code className="sol-code">vagrant up</code> เพื่อสร้าง VM ทั้งหมดพร้อมกัน
        </p>
      </div>

      <div className="sol-vms">
        {tmpl.vms.map((vm, i) => {
          const provLabels = (vm.provisioners || [])
            .map((id) => PROVISIONERS[id]?.label)
            .filter(Boolean);
          return (
            <div key={vm.name} className="sol-vm">
              <div className="sol-vm-head">
                <span className="sol-vm-idx">VM {i + 1}</span>
                <span className="sol-vm-role">{vm.role}</span>
                <span className="sol-vm-name">{vm.name}</span>
              </div>
              <div className="sol-vm-body">
                <div className="sol-row">
                  <span className="sol-key">Box</span>
                  <span className="sol-val sol-mono">{vm.box}</span>
                </div>
                <div className="sol-row">
                  <span className="sol-key">Provider</span>
                  <span className="sol-val">{PROVIDER_LABEL[vm.provider] || vm.provider}</span>
                </div>
                <div className="sol-row">
                  <span className="sol-key">Compute</span>
                  <span className="sol-val sol-mono">{vm.cpus} vCPU · {vm.memory >= 1024 ? `${vm.memory / 1024} GB` : `${vm.memory} MB`} RAM</span>
                </div>
                <div className="sol-row">
                  <span className="sol-key">Private IP</span>
                  <span className="sol-val sol-mono">{vm.privateIp || '—'}</span>
                </div>
                {vm.forwards?.length > 0 && (
                  <div className="sol-row">
                    <span className="sol-key">Ports</span>
                    <span className="sol-val sol-mono">
                      {vm.forwards.map((f) => `${f.guest}→${f.host}`).join('  ')}
                    </span>
                  </div>
                )}
                {provLabels.length > 0 && (
                  <div className="sol-row sol-row--provs">
                    <span className="sol-key">Provisions</span>
                    <span className="sol-val">
                      {provLabels.map((l) => (
                        <span key={l} className="sol-prov-chip">{l}</span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sol-note">
        <div className="sec-note-glyph">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        </div>
        <div className="sec-note-body">
          <div className="sec-note-title">วิธีใช้งาน Solution นี้</div>
          <div className="sec-note-text">
            1. ดาวน์โหลด Vagrantfile แล้ววางในโฟลเดอร์ใหม่<br/>
            2. รัน <code>vagrant up</code> เพื่อสร้างทุก VM (DC จะถูก provision ก่อน)<br/>
            3. เชื่อมต่อด้วย <code>vagrant rdp dc-01</code> หรือ <code>vagrant rdp win-client</code><br/>
            4. รอให้ DC รีบูตหลัง AD install เสร็จ จากนั้น Client จะ join domain อัตโนมัติ
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TemplateRail, Section, Field, TextInput, NumberStepper, Segmented, Toggle,
  BoxSelect, ForwardingList, ProvisionerPicker, SolutionView,
});
