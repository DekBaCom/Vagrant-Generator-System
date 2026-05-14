// Code preview pane: line numbers, syntax tokens, diff highlight.

const { useEffect, useMemo, useRef, useState } = React;

function CodePreview({ lines, changedKeys, fontSize = 13, onDownload, onCopy, copied }) {
  const text = window.Boxsmith.linesToString(lines);
  const scrollRef = useRef(null);

  // After re-render, briefly scroll the most-recently-changed line into view.
  const firstChangedIdx = useMemo(() => {
    if (!changedKeys || !changedKeys.size) return -1;
    return lines.findIndex((l) => l.key && changedKeys.has(l.key));
  }, [lines, changedKeys]);

  useEffect(() => {
    if (firstChangedIdx < 0 || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-ln="${firstChangedIdx}"]`);
    if (el) {
      const c = scrollRef.current;
      const rel = el.offsetTop - c.scrollTop;
      if (rel < 60 || rel > c.clientHeight - 80) {
        c.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      }
    }
  }, [firstChangedIdx]);

  return (
    <div className="cp-root">
      <div className="cp-head">
        <div className="cp-tabs">
          <div className="cp-tab cp-tab--active">
            <span className="cp-tab-dot"></span>
            <span>Vagrantfile</span>
            <span className="cp-tab-meta">{lines.length} lines</span>
          </div>
        </div>
        <div className="cp-tools">
          <button className="cp-btn" onClick={onCopy} title="Copy to clipboard">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button className="cp-btn cp-btn--primary" onClick={onDownload}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M5 21h14"/></svg>
            <span>Download Vagrantfile</span>
          </button>
        </div>
      </div>

      <div className="cp-body" ref={scrollRef} style={{ fontSize }}>
        <div className="cp-gutter">
          {lines.map((_, i) => (
            <div key={i} className="cp-ln">{i + 1}</div>
          ))}
        </div>
        <div className="cp-code">
          {lines.map((line, i) => {
            const changed = line.key && changedKeys && changedKeys.has(line.key);
            return (
              <div
                key={i}
                data-ln={i}
                className={`cp-line cp-line--${line.kind} ${changed ? 'cp-line--changed' : ''}`}
              >
                {line.text === '' ? (
                  <span className="cp-empty">&nbsp;</span>
                ) : line.kind === 'comment' ? (
                  <span className="tok-c">{line.text}</span>
                ) : (
                  window.Boxsmith.tokenize(line.text).map((t, j) => (
                    <span key={j} className={`tok-${t.t}`}>{t.v}</span>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="cp-foot">
        <div className="cp-foot-left">
          <span className="cp-dot cp-dot--ok"></span>
          <span>Valid · ready to download</span>
        </div>
        <div className="cp-foot-right">
          <span>UTF-8</span>
          <span className="cp-sep">·</span>
          <span>Ruby</span>
          <span className="cp-sep">·</span>
          <span>LF</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CodePreview });
