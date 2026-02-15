import { notFound } from "next/navigation";
import { getDocumentBySlug, getAllDocuments } from "@/lib/content";
import { EditorPage } from "@/components/editor/EditorPage";
import matter from "gray-matter";

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

export default async function EditPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  // Fetch document by slug
  const document = await getDocumentBySlug(slugPath);

  if (!document) {
    notFound();
  }

  // Get the raw content with frontmatter
  // We need to reconstruct it since document.content is just the body
  const { data: frontmatter } = matter(document.content);

  // Reconstruct full content with frontmatter
  const fullContent = matter.stringify(document.content, document.frontmatter);

  return (
    <EditorPage
      slug={slugPath}
      initialContent={fullContent}
      title={document.title}
    />
  );
}
