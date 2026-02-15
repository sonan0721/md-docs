"use client";

import { Shell } from "@/components/layout/Shell";

// Sample data for demonstration
const sampleFolders = [
  {
    name: "Getting Started",
    type: "folder" as const,
    children: [
      { name: "Introduction", type: "file" as const, slug: "getting-started/introduction" },
      { name: "Installation", type: "file" as const, slug: "getting-started/installation" },
    ],
  },
  {
    name: "Guides",
    type: "folder" as const,
    children: [
      { name: "Basic Usage", type: "file" as const, slug: "guides/basic-usage" },
      { name: "Advanced Topics", type: "file" as const, slug: "guides/advanced-topics" },
    ],
  },
];

const sampleTags = ["documentation", "wiki", "markdown", "notes"];

const sampleToc = [
  { id: "introduction", text: "Introduction", level: 1 },
  { id: "getting-started", text: "Getting Started", level: 2 },
  { id: "features", text: "Features", level: 2 },
  { id: "design-system", text: "Design System", level: 2 },
];

const sampleBacklinks = [
  { slug: "getting-started/introduction", title: "Introduction", context: "This page links to..." },
];

export default function Home() {
  return (
    <Shell
      folders={sampleFolders}
      tags={sampleTags}
      toc={sampleToc}
      backlinks={sampleBacklinks}
      showRightPanel={true}
    >
      <h1 id="introduction" className="text-3xl font-bold text-text mb-4">
        Personal Wiki
      </h1>
      <p className="text-muted mb-8">
        A clean, minimal documentation system.
      </p>

      <section id="getting-started" className="mb-8">
        <h2 className="text-xl font-semibold text-text mb-4">Getting Started</h2>
        <p className="text-text mb-4">
          Welcome to your personal wiki. This is a Notion/Outline-style documentation system
          with a 3-column layout.
        </p>
      </section>

      <section id="features" className="mb-8">
        <h2 className="text-xl font-semibold text-text mb-4">Features</h2>
        <ul className="list-disc list-inside text-text space-y-2">
          <li>Left sidebar for navigation (240px)</li>
          <li>Center content area (max 720px, centered)</li>
          <li>Right panel for ToC and backlinks (200px)</li>
          <li>Sticky header with search</li>
        </ul>
      </section>

      {/* Design System Preview */}
      <section id="design-system" className="bg-surface p-6 rounded-lg border border-border">
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
    </Shell>
  );
}
