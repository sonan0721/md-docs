"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Lock, Globe, Share2, Check, Copy } from "lucide-react";
import type { ParsedDocument } from "@/lib/markdown";

interface ChildDoc {
  slug: string;
  title: string;
}

interface DocumentViewProps {
  document: ParsedDocument;
  slug: string;
  childDocs?: ChildDoc[];
  isPublic?: boolean;
}

export function DocumentView({
  document,
  slug,
  childDocs = [],
  isPublic = false,
}: DocumentViewProps) {
  const { frontmatter, html } = document;
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${slug}`
      : `/p/${slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <article className="w-full">
      {/* Document Title */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text">
                {frontmatter.title}
              </h1>
              {/* Visibility Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isPublic
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
                title={
                  isPublic
                    ? "This document is publicly accessible"
                    : "This document requires authentication"
                }
              >
                {isPublic ? <Globe size={12} /> : <Lock size={12} />}
                <span>{isPublic ? "Public" : "Private"}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Share Button (only for public docs) */}
            {isPublic && (
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-text bg-surface hover:bg-border rounded-md transition-colors"
                title="Copy public link"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>Share</span>
                  </>
                )}
              </button>
            )}

            {/* Edit Button */}
            <Link
              href={`/edit/${slug}`}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-text bg-surface hover:bg-border rounded-md transition-colors"
              title="Edit document"
            >
              <Pencil size={14} />
              <span>Edit</span>
            </Link>
          </div>
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
