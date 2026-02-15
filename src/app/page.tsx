export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-content mx-auto">
        <h1 className="text-3xl font-bold text-text mb-4">Personal Wiki</h1>
        <p className="text-muted mb-8">
          A clean, minimal documentation system.
        </p>

        {/* Design System Preview */}
        <section className="bg-surface p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-text mb-4">Design System Colors</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="p-4 bg-background border border-border rounded">
              <span className="text-text">Background</span>
            </div>
            <div className="p-4 bg-surface border border-border rounded">
              <span className="text-text">Surface</span>
            </div>
            <div className="p-4 bg-accent rounded">
              <span className="text-white">Accent</span>
            </div>
          </div>

          <h3 className="text-lg font-medium text-text mt-6 mb-2">Typography</h3>
          <p className="text-text mb-2">This is regular text.</p>
          <p className="text-muted mb-2">This is muted text.</p>
          <code className="font-mono text-accent bg-surface px-2 py-1 rounded">
            Monospace font
          </code>
        </section>
      </div>
    </main>
  );
}
