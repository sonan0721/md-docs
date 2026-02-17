import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, ArrowLeft } from "lucide-react";
import { getDocumentBySlug, getAllDocuments } from "@/lib/content";
import { parseMarkdown } from "@/lib/markdown";
import { getBacklinksForDocument } from "@/lib/backlinks";
import {
  isDocumentPublic,
  filterPublicDocuments,
  filterPublicBacklinks,
} from "@/lib/visibility";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// Generate static params for SSG - only public documents
export async function generateStaticParams() {
  const allDocuments = await getAllDocuments();
  const publicDocuments = filterPublicDocuments(allDocuments);

  return publicDocuments.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
}

export default async function PublicDocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  // Fetch document by slug
  const document = await getDocumentBySlug(slugPath);

  if (!document) {
    notFound();
  }

  // Check if document is public
  if (!isDocumentPublic(document)) {
    notFound();
  }

  // Get all documents for backlinks and child docs
  const allDocuments = await getAllDocuments();

  // Filter to only public documents for reference
  const publicDocuments = filterPublicDocuments(allDocuments);

  // Create document list for backlink resolution (only public docs)
  const docList = publicDocuments.map((d) => ({ slug: d.slug, title: d.title }));

  // Parse the markdown content with BBCode and backlink processing
  const parsedDocument = await parseMarkdown(document.content, {
    allDocs: docList,
    processBBCode: true,
    processBacklinks: true,
  });

  // Find public child documents
  const childDocs = publicDocuments
    .filter(
      (doc) => doc.slug.startsWith(slugPath + "/") && doc.slug !== slugPath
    )
    .map((doc) => ({
      slug: doc.slug,
      title: doc.title,
    }));

  // Compute backlinks (only from public documents)
  const allBacklinks = getBacklinksForDocument(slugPath, allDocuments);
  const backlinks = filterPublicBacklinks(allBacklinks, allDocuments);

  return (
    <div className="min-h-screen bg-bg">
      {/* Simple Header for Public View */}
      <header className="sticky top-0 z-10 bg-bg border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted">
            <Globe size={16} />
            <span className="text-sm">Public Document</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <article className="w-full">
          {/* Document Title */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-4">
              {parsedDocument.frontmatter.title}
            </h1>

            {/* Tags */}
            {parsedDocument.frontmatter.tags &&
              parsedDocument.frontmatter.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {parsedDocument.frontmatter.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface text-muted"
                    >
                      {tag}
                    </span>
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
            dangerouslySetInnerHTML={{ __html: parsedDocument.html }}
          />

          {/* Child Documents Section (only public) */}
          {childDocs.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-lg font-semibold text-text mb-4">
                Related Documents
              </h2>
              <ul className="space-y-2">
                {childDocs.map((child) => (
                  <li key={child.slug}>
                    <Link
                      href={`/p/${child.slug}`}
                      className="text-accent hover:underline"
                    >
                      {child.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Backlinks Section (only from public documents) */}
          {backlinks.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-lg font-semibold text-text mb-4">
                Linked From
              </h2>
              <ul className="space-y-3">
                {backlinks.map((backlink) => (
                  <li key={backlink.slug}>
                    <Link
                      href={`/p/${backlink.slug}`}
                      className="text-accent hover:underline font-medium"
                    >
                      {backlink.title}
                    </Link>
                    {backlink.context && (
                      <p className="text-sm text-muted mt-1">
                        {backlink.context}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-muted">
          <p>This is a public document. Some content may require authentication to access.</p>
        </div>
      </footer>
    </div>
  );
}
