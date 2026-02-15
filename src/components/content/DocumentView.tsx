import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ParsedDocument } from "@/lib/markdown";

interface ChildDoc {
  slug: string;
  title: string;
}

interface DocumentViewProps {
  document: ParsedDocument;
  slug: string;
  childDocs?: ChildDoc[];
}

export function DocumentView({ document, slug, childDocs = [] }: DocumentViewProps) {
  const { frontmatter, html } = document;

  return (
    <article className="w-full">
      {/* Document Title */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-text mb-4">
            {frontmatter.title}
          </h1>

          {/* Edit Button */}
          <Link
            href={`/edit/${slug}`}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-text bg-surface hover:bg-border rounded-md transition-colors"
            title="Edit document"
          >
            <Pencil size={14} />
            <span>Edit</span>
          </Link>
        </div>

        {/* Tags */}
        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {frontmatter.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface text-muted hover:text-text transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Rendered Markdown Content */}
      <div
        className="prose prose-neutral dark:prose-invert max-w-none
          prose-headings:scroll-mt-20
          prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
          prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
          prose-p:my-4
          prose-a:text-accent prose-a:no-underline hover:prose-a:underline
          prose-code:bg-surface prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-surface prose-pre:border prose-pre:border-border"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Child Documents Section */}
      {childDocs.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-text mb-4">
            Related Documents
          </h2>
          <ul className="space-y-2">
            {childDocs.map((child) => (
              <li key={child.slug}>
                <Link
                  href={`/docs/${child.slug}`}
                  className="text-accent hover:underline"
                >
                  {child.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
