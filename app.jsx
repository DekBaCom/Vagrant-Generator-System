// Boxsmith — Vagrantfile Generator main app.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "midnight",
  "accent": "amber",
  "previewSide": "right",
  "density": "regular",
  "lineNumbers": true,
  "showBanner": true
}/*EDITMODE-END*/;

const ACCENTS = {
  amber:  { name: 'Amber',   c: 'oklch(0.74 0.16 60)',  cInk: 'oklch(0.20 0.05 60)' },
  ember:  { name: 'Ember',   c: 'oklch(0.66 0.18 28)',  cInk: 'oklch(0.20 0.05 28)' },
  mint:   { name: 'Mint',    c: 'oklch(0.74 0.15 165)', cInk: 'oklch(0.18 0.05 165)' },
  iris:   { name: 'Iris',    c: 'oklch(0.70 0.14 270)', cInk: 'oklch(0.20 0.05 270)' },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { TEMPLATES, OS_BOXES, PROVIDER_KEY, PROVISIONERS, generate, validate, linesToString } =
    window.Boxsmith;

  const [templateId, setTemplateId] = useState('web');
  const [cfg, setCfg] = useState(() => structuredClone(TEMPLATES.web.defaults));
  const [copied, setCopied] = useState(false);
  const [changedKeys, setChangedKeys] = useState(new Set());
  const [downloadFlash, setDownloadFlash] = useState(false);
  const changedTimerRef = useRef(null);
  const prevLinesRef = useRef(null);

  const errors = useMemo(() => validate(cfg), [cfg]);
  const errCount = Object.keys(errors).length;
  const lines = useMemo(() => generate(cfg), [cfg]);

  // Diff against previous render — flash any line whose key changed.
  useEffect(() => {
    if (!prevLinesRef.current) {
      prevLinesRef.current = lines;
      return;
    }
    const prev = new Map();
    prevLinesRef.current.forEach((l) => {
      if (l.key) prev.set(l.key + '|' + l.text, true);
    });
    const changed = new Set();
    lines.forEach((l) => {
      if (l.key && !prev.has(l.key + '|' + l.text)) changed.add(l.key);
    });
    if (changed.size) {
      setChangedKeys(changed);
      clearTimeout(changedTimerRef.current);
      changedTimerRef.current = setTimeout(() => setChangedKeys(new Set()), 1400);
    }
    prevLinesRef.current = lines;
  }, [lines]);

  const update = useCallback((patch) => setCfg((c) => ({ ...c, ...patch })), []);
  const updateSync = useCallback(
    (patch) => setCfg((c) => ({ ...c, sync: { ...c.sync, ...patch } })),
    []
  );

  const pickTemplate = (id) => {
    setTemplateId(id);
    setCfg(structuredClone(TEMPLATES[id].defaults));
  };

  const onDownload = () => {
    const text = linesToString(lines) + '\n';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Vagrantfile';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDownloadFlash(true);
    setTimeout(() => setDownloadFlash(false), 1100);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(linesToString(lines));
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } catch {}
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        onDownload();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const themeClass = `theme-${t.theme}`;
  const accent = ACCENTS[t.accent] || ACCENTS.amber;
  const layoutClass = `layout-${t.previewSide}`;
  const densityClass = `density-${t.density}`;
  const tmpl = TEMPLATES[templateId];

  return (
    <div
      className={`bs-root ${themeClass} ${layoutClass} ${densityClass}`}
      style={{
        '--ac': accent.c,
        '--ac-ink': accent.cInk,
      }}
    >
      <TopBar
        tmpl={tmpl}
        cfg={cfg}
        errCount={errCount}
        downloadFlash={downloadFlash}
        onDownload={onDownload}
      />

      <div className="bs-workbench">
        <TemplateRail templates={TEMPLATES} selectedId={templateId} onPick={pickTemplate} />

        <main className="bs-form">
          <FormHeader tmpl={tmpl} cfg={cfg} />

          <Section n="01" title="Identity" hint="What this VM calls itself">
            <div className="fld-grid fld-grid--2">
              <Field label="Hostname" error={errors.hostname} hint="DNS-safe label">
                <TextInput value={cfg.hostname} onChange={(v) => update({ hostname: v })} mono />
              </Field>
              <Field label="Provider">
                <Segmented
                  value={cfg.provider}
                  onChange={(v) => update({ provider: v })}
                  options={[
                    { value: 'virtualbox', label: 'VirtualBox', glyph: '▣' },
                    { value: 'hyperv', label: 'Hyper-V', glyph: '⊞' },
                    { value: 'vmware_desktop', label: 'VMware', glyph: '◈' },
                    { value: 'libvirt', label: 'libvirt', glyph: '◇' },
                  ]}
                />
              </Field>
            </div>
          </Section>

          <Section n="02" title="OS box" hint="Image to boot from Vagrant Cloud">
            <BoxSelect value={cfg.box} onChange={(v) => update({ box: v })} boxes={OS_BOXES} />
          </Section>

          <Section
            n="03"
            title="Compute"
            hint="Resources allocated to the guest"
            right={<ComputeSummary cpus={cfg.cpus} memory={cfg.memory} />}
          >
            <div className="fld-grid fld-grid--2">
              <Field label="vCPUs" error={errors.cpus} hint="1 – 32">
                <NumberStepper
                  value={cfg.cpus}
                  onChange={(v) => update({ cpus: v })}
                  min={1}
                  max={32}
                />
              </Field>
              <Field label="Memory" error={errors.memory} hint="512 – 65 536 MB">
                <NumberStepper
                  value={cfg.memory}
                  onChange={(v) => update({ memory: v })}
                  min={512}
                  max={65536}
                  step={512}
                  suffix="MB"
                />
              </Field>
            </div>
            <MemoryMeter memory={cfg.memory} />
          </Section>

          <Section n="04" title="Network" hint="How the guest is reachable">
            <div className="fld-grid fld-grid--2">
              <Field label="Private network IP" error={errors.privateIp} hint="Host-only network">
                <TextInput
                  value={cfg.privateIp}
                  onChange={(v) => update({ privateIp: v })}
                  placeholder="192.168.56.10"
                  mono
                />
              </Field>
              <Field label="Public network" hint="Bridge to host's LAN">
                <Toggle
                  value={cfg.publicNetwork}
                  onChange={(v) => update({ publicNetwork: v })}
                  label={cfg.publicNetwork ? 'Bridged to host network' : 'Host-only'}
                />
              </Field>
            </div>
            <Field label="Port forwarding" wide hint="Map host ports to guest services">
              <ForwardingList
                forwards={cfg.forwards}
                onChange={(v) => update({ forwards: v })}
                errors={errors}
              />
            </Field>
          </Section>

          <Section n="05" title="Synced folder" hint="Share files between host and guest">
            <div className="fld-grid fld-grid--3">
              <Field label="Host path">
                <TextInput value={cfg.sync.host} onChange={(v) => updateSync({ host: v })} mono />
              </Field>
              <Field label="Guest path">
                <TextInput value={cfg.sync.guest} onChange={(v) => updateSync({ guest: v })} mono />
              </Field>
              <Field label="Sync type">
                <select
                  className="inp inp--select"
                  value={cfg.sync.type}
                  onChange={(e) => updateSync({ type: e.target.value })}
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
            n="06"
            title="Provisioning"
            hint="Run on first up — multiple shell blocks chained in order"
            right={
              <div className="sect-pill">
                {cfg.provisioners.length}/{Object.keys(PROVISIONERS).length}
              </div>
            }
          >
            <ProvisionerPicker
              selected={cfg.provisioners}
              onChange={(v) => update({ provisioners: v })}
              catalog={PROVISIONERS}
            />
          </Section>

          <SecurityNote />
        </main>

        <section className="bs-preview">
          <CodePreview
            lines={lines}
            changedKeys={changedKeys}
            fontSize={t.density === 'compact' ? 12 : t.density === 'comfy' ? 14 : 13}
            onDownload={onDownload}
            onCopy={onCopy}
            copied={copied}
          />
        </section>
      </div>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio
          label="Mode"
          value={t.theme}
          options={['midnight', 'parchment']}
          onChange={(v) => setTweak('theme', v)}
        />
        <TweakRadio
          label="Accent"
          value={t.accent}
          options={['amber', 'ember', 'mint', 'iris']}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakSection label="Layout" />
        <TweakRadio
          label="Preview"
          value={t.previewSide}
          options={['right', 'bottom']}
          onChange={(v) => setTweak('previewSide', v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakSection label="Chrome" />
        <TweakToggle
          label="Top banner"
          value={t.showBanner}
          onChange={(v) => setTweak('showBanner', v)}
        />
      </TweaksPanel>

      {t.showBanner && <TopBanner />}
    </div>
  );
}

function TopBar({ tmpl, cfg, errCount, downloadFlash, onDownload }) {
  return (
    <header className="bs-topbar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
            <rect x="9" y="9" width="14" height="14" rx="2" fill="currentColor" />
            <circle cx="16" cy="16" r="2" fill="var(--bg-1)" />
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">Boxsmith</span>
          <span className="brand-sub">Vagrantfile Generator</span>
        </div>
      </div>

      <div className="bs-breadcrumb">
        <span>Workspace</span>
        <span className="bs-bc-sep">/</span>
        <span>{tmpl.name}</span>
        <span className="bs-bc-sep">/</span>
        <span className="bs-bc-current">{cfg.hostname || 'unnamed'}</span>
        <span className="bs-bc-edit">●</span>
      </div>

      <div className="bs-topbar-right">
        <div className={`bs-status ${errCount ? 'bs-status--err' : 'bs-status--ok'}`}>
          <span className="bs-status-dot"></span>
          <span>{errCount ? `${errCount} issue${errCount > 1 ? 's' : ''}` : 'All checks pass'}</span>
        </div>
        <button className="btn btn--ghost">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="M16 3h5v5"/><path d="M10 14L21 3"/></svg>
          Share
        </button>
        <button
          className={`btn btn--primary ${downloadFlash ? 'btn--flash' : ''}`}
          onClick={onDownload}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M5 21h14"/></svg>
          {downloadFlash ? 'Saved' : 'Download'}
        </button>
      </div>
    </header>
  );
}

function FormHeader({ tmpl, cfg }) {
  return (
    <div className="bs-form-head">
      <div>
        <div className="bs-form-eyebrow">
          <span className="bs-form-glyph">{tmpl.glyph}</span>
          <span>{tmpl.name}</span>
          <span className="bs-form-tag">{tmpl.tagline}</span>
        </div>
        <h1 className="bs-form-title">
          Configure <span className="bs-form-mono">{cfg.hostname || 'vm'}</span>
        </h1>
        <p className="bs-form-lede">
          Set the spec on the left — the Vagrantfile on the right updates instantly. Press
          <span className="bs-kbd">⌘D</span> to download when ready.
        </p>
      </div>
    </div>
  );
}

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

function TopBanner() {
  return (
    <div className="bs-banner">
      <span className="bs-banner-dot"></span>
      <span>
        <b>Phase 1</b> · client-side generation, no backend.{' '}
        <span className="bs-banner-faint">Phase 2 will add save/share + Ansible + cloud providers.</span>
      </span>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
