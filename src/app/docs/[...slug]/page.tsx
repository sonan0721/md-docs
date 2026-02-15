import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { DocumentView } from "@/components/content/DocumentView";
import {
  getDocumentBySlug,
  getAllDocuments,
  getDocumentTree,
} from "@/lib/content";
import { parseMarkdown } from "@/lib/markdown";

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

  // Parse the markdown content
  const parsedDocument = await parseMarkdown(document.content);

  // Get document tree for sidebar
  const tree = await getDocumentTree();

  // Get all documents to find child documents and extract tags
  const allDocuments = await getAllDocuments();

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

  return (
    <Shell
      tree={tree}
      tags={allTags}
      toc={parsedDocument.toc}
      backlinks={[]}
      showRightPanel={true}
    >
      <DocumentView document={parsedDocument} childDocs={childDocs} />
    </Shell>
  );
}
