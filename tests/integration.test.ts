import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import { rehypeMdxElements } from "rehype-mdx-elements";
import rehypeStringify from "rehype-stringify";
import { VFile } from "vfile";
import { remarkUnravelMdx } from "@/index";

// Helper function to process MDX through the pipeline and get HTML output
function processMdxToHtml(mdxSource: string, usePlugin = true): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(
      usePlugin
        ? remarkUnravelMdx
        : function () {
            /* no-op */
          },
    )
    .use(remarkRehype, {
      allowDangerousHtml: true,
      passThrough: ["mdxJsxFlowElement", "mdxJsxTextElement"],
    })
    .use(rehypeMdxElements)
    .use(rehypeRaw)
    .use(rehypeStringify, {
      allowDangerousHtml: true,
    });

  const file = new VFile();
  file.value = mdxSource;

  const result = processor.processSync(file);
  return String(result).trim();
}

describe("remarkUnravelMdx Integration Tests", () => {
  describe("list items with JSX components", () => {
    it("unwraps JSX components from paragraphs in list items when they contain only JSX and whitespace", () => {
      const mdxSource = `- Text <button />`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // Both should be the same since this paragraph has mixed content (text + JSX)
      // The plugin should NOT unwrap mixed content
      expect(withPlugin).toBe(`<ul>\n<li>Text <button></button></li>\n</ul>`);
      expect(withoutPlugin).toBe(`<ul>\n<li>Text <button></button></li>\n</ul>`);
    });

    it("preserves paragraphs with mixed content in list items", () => {
      const mdxSource = `- Here is some text with <card /> in the middle.`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // Should be identical - mixed content paragraphs are preserved
      expect(withPlugin).toBe(`<ul>\n<li>Here is some text with <card></card> in the middle.</li>\n</ul>`);
      expect(withoutPlugin).toBe(`<ul>\n<li>Here is some text with <card></card> in the middle.</li>\n</ul>`);
    });
  });

  describe("blockquotes with JSX components", () => {
    it("preserves mixed content in blockquotes", () => {
      const mdxSource = `> This is a quote with <badge /> inside.`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // Should be identical - mixed content paragraphs are preserved
      expect(withPlugin).toBe(`<blockquote>\n<p>This is a quote with <badge></badge> inside.</p>\n</blockquote>`);
      expect(withoutPlugin).toBe(`<blockquote>\n<p>This is a quote with <badge></badge> inside.</p>\n</blockquote>`);
    });
  });

  describe("standalone JSX components", () => {
    it("handles standalone JSX components (which become flow elements)", () => {
      const mdxSource = `<widget />`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // Standalone JSX becomes mdxJsxFlowElement, not wrapped in paragraphs
      // Both should be identical since there's no paragraph to unwrap
      expect(withPlugin).toBe(`<widget></widget>`);
      expect(withoutPlugin).toBe(`<widget></widget>`);
    });

    it("unwraps JSX components with attributes when they're in paragraphs", () => {
      const mdxSource = `<button type="submit" disabled>Click me</button>`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // This particular case shows that the JSX does get wrapped in a paragraph sometimes
      // The plugin should unwrap it
      expect(withPlugin).toBe(`<button type="submit" disabled>Click me</button>`);
      expect(withoutPlugin).toBe(`<p><button type="submit" disabled>Click me</button></p>`);
    });
  });

  describe("complex document structures", () => {
    it("handles a typical documentation page with mixed content", () => {
      const mdxSource = `# API Reference

This is a regular paragraph.

<header />

Here's a paragraph with an <icon /> component inside.

<footer />`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // Flow elements (header, footer) remain unchanged
      // Mixed content paragraph with icon is preserved
      expect(withPlugin).toBe(`<h1>API Reference</h1>
<p>This is a regular paragraph.</p>
<header></header>
<p>Here's a paragraph with an <icon></icon> component inside.</p>
<footer></footer>`);

      expect(withoutPlugin).toBe(`<h1>API Reference</h1>
<p>This is a regular paragraph.</p>
<header></header>
<p>Here's a paragraph with an <icon></icon> component inside.</p>
<footer></footer>`);
    });

    it("unwraps paragraphs that are immediate children of MDX components", () => {
      const mdxSource = `<card>
  <header>
    <title>Hello World</title>
  </header>
  <content>
    Content here
  </content>
</card>`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // The plugin unwraps paragraphs inside components AND JSX elements from paragraphs
      expect(withPlugin).toBe(
        `<card><header><title>Hello World</title></header><content>Content here</content></card>`,
      );
      expect(withoutPlugin).toBe(
        `<card><header><p><title>Hello World</title></p></header><content><p>Content here</p></content></card>`,
      );
    });
  });

  describe("edge cases and whitespace handling", () => {
    it("handles empty document", () => {
      const mdxSource = ``;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      expect(withPlugin).toBe(``);
      expect(withoutPlugin).toBe(``);
    });

    it("handles text-only content", () => {
      const mdxSource = `This is just regular markdown text.`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // Should be identical - no JSX to process
      expect(withPlugin).toBe(`<p>This is just regular markdown text.</p>`);
      expect(withoutPlugin).toBe(`<p>This is just regular markdown text.</p>`);
    });

    it("handles markdown formatting with JSX", () => {
      const mdxSource = `**Bold text** with <badge /> and *emphasis*.`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // Mixed content - should be identical
      expect(withPlugin).toBe(`<p><strong>Bold text</strong> with <badge></badge> and <em>emphasis</em>.</p>`);
      expect(withoutPlugin).toBe(`<p><strong>Bold text</strong> with <badge></badge> and <em>emphasis</em>.</p>`);
    });

    it("handles inline code with JSX", () => {
      const mdxSource = `Use \`npm install\` to install <package />.`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // Mixed content - should be identical
      expect(withPlugin).toBe(`<p>Use <code>npm install</code> to install <package></package>.</p>`);
      expect(withoutPlugin).toBe(`<p>Use <code>npm install</code> to install <package></package>.</p>`);
    });
  });

  describe("real-world blog post scenario", () => {
    it("handles a typical blog post with components", () => {
      const mdxSource = `# My Blog Post

Published on **January 1, 2024**

<author name="John Doe" />

Welcome to my blog! This post demonstrates how MDX components work.

<callout type="warning">
This is an important note.
</callout>

Here's a mixed paragraph with a <highlight color="yellow">highlighted term</highlight> in the middle.

<gallery>
  <image src="photo1.jpg" alt="Photo 1" />
  <image src="photo2.jpg" alt="Photo 2" />
</gallery>

Thanks for reading!`;

      const withPlugin = processMdxToHtml(mdxSource, true);
      const withoutPlugin = processMdxToHtml(mdxSource, false);

      // All flow-level components remain unchanged
      // Mixed content paragraph with highlight is preserved
      // Paragraphs inside components should be unwrapped
      expect(withPlugin).toContain(`<author name="John Doe"></author>`);
      expect(withPlugin).toContain(`<callout type="warning">This is an important note.</callout>`);
      expect(withPlugin).toContain(`<gallery>`);
      expect(withPlugin).toContain(
        `<p>Here's a mixed paragraph with a <highlight color="yellow">highlighted term</highlight> in the middle.</p>`,
      );

      expect(withoutPlugin).toContain(`<author name="John Doe"></author>`);
      expect(withoutPlugin).toContain(`<callout type="warning"><p>This is an important note.</p></callout>`);
      expect(withoutPlugin).toContain(`<gallery>`);
      expect(withoutPlugin).toContain(
        `<p>Here's a mixed paragraph with a <highlight color="yellow">highlighted term</highlight> in the middle.</p>`,
      );
    });
  });
});
