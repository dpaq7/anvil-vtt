import { StrictMode, Suspense, lazy, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import '../kit/stageshow.css';
import '../tokens/look-anvil.css';
import { gates } from './gates';

// Every demos/<id>/index.tsx with a default export is a demo. No registry to edit.
const modules = import.meta.glob<{ default: ComponentType }>('../demos/*/index.tsx');
const demos: Record<string, ComponentType> = {};
for (const [path, load] of Object.entries(modules)) {
  const id = path.split('/')[2];
  demos[id] = lazy(load);
}

function Demo({ id }: { id: string }) {
  const C = demos[id];
  if (!C) return <p className="g-miss">No demo "{id}". Known: {Object.keys(demos).join(', ') || 'none'}</p>;
  return (
    <Suspense fallback={null}>
      <C />
    </Suspense>
  );
}

function App() {
  const q = new URLSearchParams(location.search);
  const demo = q.get('demo');
  const gate = q.get('gate');
  if (demo) return <div id="demo-root"><Demo id={demo} /></div>;
  if (gate) {
    const ids = gates[gate] ?? [];
    if (!ids.length) return <p className="g-miss">Gate {gate} has no demos yet.</p>;
    return (
      <div className="g-gate" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 720px), 1fr))', gap: 24, padding: 16, boxSizing: 'border-box', width: '100%' }}>
        {ids.map((id) => (
          <figure key={id} id={`demo-${id}`} style={{ margin: 0, minWidth: 0 }}>
            <Demo id={id} />
            <figcaption style={{ font: '14px system-ui', color: '#555', marginTop: 8 }}><a href={`?demo=${id}`}>{id}</a></figcaption>
          </figure>
        ))}
      </div>
    );
  }
  return (
    <ul style={{ font: '14px system-ui', padding: 24 }}>
      {Object.keys(demos).map((id) => (
        <li key={id}><a href={`?demo=${id}`}>{id}</a></li>
      ))}
      {Object.keys(gates).map((g) => (
        <li key={`g${g}`}><a href={`?gate=${g}`}>gate {g}</a></li>
      ))}
    </ul>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
