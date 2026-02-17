import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { DocumentView } from "@/components/content/DocumentView";
import {
  getDocumentBySlug,
  getAllDocuments,
  getDocumentTree,
} from "@/lib/content";
import { parseMarkdown } from "@/lib/markdown";
import { getBacklinksForDocument } from "@/lib/backlinks";
import { isDocumentPublic } from "@/lib/visibility";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// Generate static params for SSG
export async function generateStaticParams() {
  const documents = await getAllDocuments();

  return documents.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
}

export default async function DocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  // Fetch document by slug
  const document = await getDocumentBySlug(slugPath);

  if (!document) {
    notFound();
  }

  // Get document tree for sidebar
  const tree = await getDocumentTree();

  // Get all documents to find child documents, extract tags, and compute backlinks
  const allDocuments = await getAllDocuments();

  // Create document list for backlink resolution
  const docList = allDocuments.map((d) => ({ slug: d.slug, title: d.title }));

  // Parse the markdown content with BBCode and backlink processing
  const parsedDocument = await parseMarkdown(document.content, {
    allDocs: docList,
    processBBCode: true,
    processBacklinks: true,
  });

  // Find child documents (documents that start with current slug + /)
  const childDocs = allDocuments
    .filter(
      (doc) => doc.slug.startsWith(slugPath + "/") && doc.slug !== slugPath
    )
    .map((doc) => ({
      slug: doc.slug,
      title: doc.title,
    }));

  // Extract unique tags from all documents
  const allTags = Array.from(
    new Set(allDocuments.flatMap((doc) => doc.frontmatter.tags || []))
  );

  // Compute backlinks for this document (which other docs link to this one)
  const backlinks = getBacklinksForDocument(slugPath, allDocuments);

  // Check document visibility
  const isPublic = isDocumentPublic(document);

  return (
    <Shell
      tree={tree}
      tags={allTags}
      toc={parsedDocument.toc}
      backlinks={backlinks}
      showRightPanel={true}
      documents={allDocuments}
    >
      <DocumentView
        document={parsedDocument}
        slug={slugPath}
        childDocs={childDocs}
        isPublic={isPublic}
      />
    </Shell>
  );
}
