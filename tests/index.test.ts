import { describe, it, expect } from "vitest";
import type { Root, Paragraph, Text } from "mdast";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";
import { remarkUnravelJsx } from "@/index.js";

const createParagraph = (children: Paragraph["children"]): Paragraph => ({
  type: "paragraph",
  children,
});

const createText = (value: string): Text => ({
  type: "text",
  value,
});

const createMdxJsxTextElement = (name: string): MdxJsxTextElement => ({
  type: "mdxJsxTextElement",
  name,
  attributes: [],
  children: [],
});

const createRoot = (children: Root["children"]): Root => ({
  type: "root",
  children,
});

describe("remarkUnravelJsx", () => {
  describe("basic unwrapping", () => {
    it("unwraps paragraphs containing only JSX elements", () => {
      const tree: Root = createRoot([createParagraph([createMdxJsxTextElement("MyComponent")])]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toEqual({
        type: "mdxJsxTextElement",
        name: "MyComponent",
        attributes: [],
        children: [],
      });
    });

    it("unwraps paragraphs with JSX elements and whitespace", () => {
      const tree: Root = createRoot([
        createParagraph([createText("  "), createMdxJsxTextElement("MyComponent"), createText("  ")]),
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toEqual({ type: "text", value: "  " });
      expect(tree.children[1]).toEqual({
        type: "mdxJsxTextElement",
        name: "MyComponent",
        attributes: [],
        children: [],
      });
      expect(tree.children[2]).toEqual({ type: "text", value: "  " });
    });

    it("unwraps paragraphs with multiple JSX elements", () => {
      const tree: Root = createRoot([
        createParagraph([createMdxJsxTextElement("ComponentA"), createMdxJsxTextElement("ComponentB")]),
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(2);
      expect(tree.children[0]).toEqual({
        type: "mdxJsxTextElement",
        name: "ComponentA",
        attributes: [],
        children: [],
      });
      expect(tree.children[1]).toEqual({
        type: "mdxJsxTextElement",
        name: "ComponentB",
        attributes: [],
        children: [],
      });
    });
  });

  describe("preservation of mixed content", () => {
    it("does NOT unwrap paragraphs with mixed content (JSX + text)", () => {
      const originalParagraph = createParagraph([
        createText("Here is "),
        createMdxJsxTextElement("MyComponent"),
        createText(" with text."),
      ]);
      const tree: Root = createRoot([originalParagraph]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toBe(originalParagraph);
      expect(tree.children[0]).toMatchObject({
        type: "paragraph",
        children: [
          { type: "text", value: "Here is " },
          { type: "mdxJsxTextElement", name: "MyComponent" },
          { type: "text", value: " with text." },
        ],
      });
    });

    it("does NOT unwrap paragraphs with text only", () => {
      const originalParagraph = createParagraph([createText("This is just regular text.")]);
      const tree: Root = createRoot([originalParagraph]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toBe(originalParagraph);
      expect(tree.children[0]).toMatchObject({
        type: "paragraph",
        children: [{ type: "text", value: "This is just regular text." }],
      });
    });

    it("does NOT unwrap paragraphs with other markdown elements", () => {
      const originalParagraph = createParagraph([
        { type: "strong", children: [createText("Bold text")] },
        createText(" with emphasis."),
      ]);
      const tree: Root = createRoot([originalParagraph]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toBe(originalParagraph);
      expect(tree.children[0]).toMatchObject({
        type: "paragraph",
      });
    });

    it("does NOT unwrap when JSX is mixed with inline elements", () => {
      const originalParagraph = createParagraph([
        { type: "emphasis", children: [createText("Italic")] },
        createText(" "),
        createMdxJsxTextElement("MyComponent"),
      ]);
      const tree: Root = createRoot([originalParagraph]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toBe(originalParagraph);
      expect(tree.children[0]).toMatchObject({
        type: "paragraph",
      });
    });

    it("does NOT unwrap when there are non-whitespace text nodes", () => {
      const originalParagraph = createParagraph([
        createText("\n    Some text "),
        createMdxJsxTextElement("MyComponent"),
        createText("\n    "),
      ]);
      const tree: Root = createRoot([originalParagraph]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toBe(originalParagraph);
      expect(tree.children[0]).toMatchObject({
        type: "paragraph",
      });
    });
  });

  describe("whitespace handling", () => {
    it("handles only whitespace text nodes correctly", () => {
      const tree: Root = createRoot([
        createParagraph([createText("\n    "), createMdxJsxTextElement("MyComponent"), createText("\n    ")]),
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toEqual({ type: "text", value: "\n    " });
      expect(tree.children[1]).toEqual({
        type: "mdxJsxTextElement",
        name: "MyComponent",
        attributes: [],
        children: [],
      });
      expect(tree.children[2]).toEqual({ type: "text", value: "\n    " });
    });

    it("treats empty text nodes as whitespace", () => {
      const tree: Root = createRoot([
        createParagraph([createText(""), createMdxJsxTextElement("MyComponent"), createText("")]),
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toEqual({ type: "text", value: "" });
      expect(tree.children[1]).toEqual({
        type: "mdxJsxTextElement",
        name: "MyComponent",
        attributes: [],
        children: [],
      });
      expect(tree.children[2]).toEqual({ type: "text", value: "" });
    });

    it("handles tabs and spaces as whitespace", () => {
      const tree: Root = createRoot([
        createParagraph([createText("\t  "), createMdxJsxTextElement("MyComponent"), createText("  \t")]),
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toEqual({ type: "text", value: "\t  " });
      expect(tree.children[1]).toEqual({
        type: "mdxJsxTextElement",
        name: "MyComponent",
        attributes: [],
        children: [],
      });
      expect(tree.children[2]).toEqual({ type: "text", value: "  \t" });
    });
  });

  describe("multiple paragraphs", () => {
    it("handles multiple paragraphs correctly", () => {
      const textParagraph = createParagraph([createText("Regular paragraph with text.")]);
      const tree: Root = createRoot([
        createParagraph([createMdxJsxTextElement("ComponentA")]),
        textParagraph,
        createParagraph([createMdxJsxTextElement("ComponentB")]),
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(3);
      // First should be unwrapped JSX
      expect(tree.children[0]).toEqual({
        type: "mdxJsxTextElement",
        name: "ComponentA",
        attributes: [],
        children: [],
      });
      // Second should be wrapped paragraph (unchanged)
      expect(tree.children[1]).toBe(textParagraph);
      expect(tree.children[1]).toMatchObject({ type: "paragraph" });
      // Third should be unwrapped JSX
      expect(tree.children[2]).toEqual({
        type: "mdxJsxTextElement",
        name: "ComponentB",
        attributes: [],
        children: [],
      });
    });
  });

  describe("edge cases", () => {
    it("handles empty tree", () => {
      const tree: Root = createRoot([]);

      const transform = remarkUnravelJsx();
      expect(() => {
        transform(tree);
      }).not.toThrow();
      expect(tree.children).toHaveLength(0);
    });

    it("handles tree with no paragraphs", () => {
      const tree: Root = createRoot([
        createText("Direct text"),
        { type: "heading", depth: 1 as const, children: [createText("Heading")] },
        createMdxJsxTextElement("DirectJSX"),
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toMatchObject({ type: "text" });
      expect(tree.children[1]).toMatchObject({ type: "heading" });
      expect(tree.children[2]).toMatchObject({ type: "mdxJsxTextElement" });
    });

    it("handles empty paragraphs", () => {
      const emptyParagraph = createParagraph([]);
      const tree: Root = createRoot([emptyParagraph]);

      const transform = remarkUnravelJsx();
      transform(tree);

      // Empty paragraphs satisfy "only JSX and whitespace" (vacuously true), so they get unwrapped to nothing
      expect(tree.children).toHaveLength(0);
    });

    it("handles paragraphs with only whitespace", () => {
      const tree: Root = createRoot([createParagraph([createText("   "), createText("\n\t")])]);

      const transform = remarkUnravelJsx();
      transform(tree);

      // Whitespace-only paragraphs satisfy "only JSX and whitespace", so they get unwrapped to just the text nodes
      expect(tree.children).toHaveLength(2);
      expect(tree.children[0]).toMatchObject({ type: "text", value: "   " });
      expect(tree.children[1]).toMatchObject({ type: "text", value: "\n\t" });
    });

    it("preserves non-paragraph nodes", () => {
      const headingNode = { type: "heading" as const, depth: 1 as const, children: [createText("Title")] };
      const textNode = createText("Direct text");
      const tree: Root = createRoot([headingNode, textNode, createParagraph([createMdxJsxTextElement("Component")])]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toBe(headingNode);
      expect(tree.children[1]).toBe(textNode);
      expect(tree.children[2]).toEqual({
        type: "mdxJsxTextElement",
        name: "Component",
        attributes: [],
        children: [],
      });
    });
  });

  describe("nested structures", () => {
    it("handles nested paragraphs within other elements", () => {
      const nestedParagraph = createParagraph([createMdxJsxTextElement("NestedComponent")]);
      const tree: Root = createRoot([
        {
          type: "blockquote",
          children: [nestedParagraph],
        },
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      const [blockquote] = tree.children;
      expect(blockquote).toMatchObject({
        type: "blockquote",
        children: [
          {
            type: "mdxJsxTextElement",
            name: "NestedComponent",
            attributes: [],
            children: [],
          },
        ],
      });
    });

    it("handles deeply nested structures", () => {
      const deeplyNestedParagraph = createParagraph([createMdxJsxTextElement("DeepComponent")]);
      const tree: Root = createRoot([
        {
          type: "blockquote",
          children: [
            {
              type: "list",
              ordered: false,
              children: [
                {
                  type: "listItem",
                  children: [deeplyNestedParagraph],
                },
              ],
            },
          ],
        },
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children[0]).toMatchObject({
        type: "blockquote",
        children: [
          {
            type: "list",
            children: [
              {
                type: "listItem",
                children: [
                  {
                    type: "mdxJsxTextElement",
                    name: "DeepComponent",
                    attributes: [],
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  describe("complex JSX elements", () => {
    it("handles JSX elements with attributes", () => {
      const jsxElement: MdxJsxTextElement = {
        type: "mdxJsxTextElement",
        name: "MyComponent",
        attributes: [
          { type: "mdxJsxAttribute", name: "prop", value: "value" },
          { type: "mdxJsxAttribute", name: "className", value: "test" },
        ],
        children: [],
      };
      const tree: Root = createRoot([createParagraph([jsxElement])]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toBe(jsxElement);
      expect(tree.children[0]).toEqual({
        type: "mdxJsxTextElement",
        name: "MyComponent",
        attributes: [
          { type: "mdxJsxAttribute", name: "prop", value: "value" },
          { type: "mdxJsxAttribute", name: "className", value: "test" },
        ],
        children: [],
      });
    });

    it("handles JSX elements with children", () => {
      const jsxElement: MdxJsxTextElement = {
        type: "mdxJsxTextElement",
        name: "div",
        attributes: [],
        children: [
          { type: "text", value: "Nested content" },
          {
            type: "mdxJsxTextElement",
            name: "span",
            attributes: [],
            children: [{ type: "text", value: "Deep nested" }],
          },
        ],
      };
      const tree: Root = createRoot([createParagraph([jsxElement])]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toBe(jsxElement);
      expect(tree.children[0]).toMatchObject({
        type: "mdxJsxTextElement",
        name: "div",
        children: [
          { type: "text", value: "Nested content" },
          {
            type: "mdxJsxTextElement",
            name: "span",
            children: [{ type: "text", value: "Deep nested" }],
          },
        ],
      });
    });
  });

  describe("paragraphs inside MDX components", () => {
    it("unwraps single paragraph child of MDX flow elements", () => {
      const jsxElement: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Card",
        attributes: [],
        children: [createParagraph([createText("Content inside card")])],
      };
      const tree: Root = createRoot([jsxElement]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      const [card] = tree.children;
      expect(card?.type).toBe("mdxJsxFlowElement");
      if (card?.type === "mdxJsxFlowElement") {
        expect(card.children).toHaveLength(1);
        // Single paragraph should be unwrapped to just text
        expect(card.children[0]).toMatchObject({ type: "text", value: "Content inside card" });
      }
    });

    it("preserves multiple paragraph children in MDX flow elements", () => {
      const jsxElement: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Card",
        attributes: [],
        children: [createParagraph([createText("First paragraph")]), createParagraph([createText("Second paragraph")])],
      };
      const tree: Root = createRoot([jsxElement]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      const [card] = tree.children;
      expect(card?.type).toBe("mdxJsxFlowElement");
      if (card?.type === "mdxJsxFlowElement") {
        expect(card.children).toHaveLength(2);
        // Multiple paragraphs should remain wrapped for safety
        expect(card.children[0]).toMatchObject({ type: "paragraph" });
        expect(card.children[1]).toMatchObject({ type: "paragraph" });
      }
    });

    it("handles nested JSX elements with single paragraphs", () => {
      const nestedJsx: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Card",
        attributes: [],
        children: [
          {
            type: "mdxJsxFlowElement",
            name: "Header",
            attributes: [],
            children: [createParagraph([createText("Card Title")])],
          },
        ],
      };
      const tree: Root = createRoot([nestedJsx]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      const [card] = tree.children;
      expect(card?.type).toBe("mdxJsxFlowElement");
      if (card?.type === "mdxJsxFlowElement") {
        expect(card.children).toHaveLength(1);

        // Header should have paragraph unwrapped (single child)
        const [header] = card.children;
        expect(header?.type).toBe("mdxJsxFlowElement");
        if (header?.type === "mdxJsxFlowElement") {
          expect(header.children).toHaveLength(1);
          expect(header.children[0]).toMatchObject({ type: "text", value: "Card Title" });
        }
      }
    });

    it("preserves paragraphs when JSX element has mixed children", () => {
      const jsxElement: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Card",
        attributes: [],
        children: [
          createParagraph([createText("Paragraph content")]),
          { type: "heading", depth: 2 as const, children: [createText("Heading")] },
        ],
      };
      const tree: Root = createRoot([jsxElement]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(1);
      const [card] = tree.children;
      expect(card?.type).toBe("mdxJsxFlowElement");
      if (card?.type === "mdxJsxFlowElement") {
        expect(card.children).toHaveLength(2);
        // Paragraph should remain wrapped when there are multiple children
        expect(card.children[0]).toMatchObject({ type: "paragraph" });
        expect(card.children[1]).toMatchObject({ type: "heading" });
      }
    });

    it("preserves non-paragraph children in JSX elements", () => {
      const jsxElement: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Container",
        attributes: [],
        children: [
          { type: "heading", depth: 2 as const, children: [createText("Heading")] },
          {
            type: "list",
            ordered: false,
            children: [
              {
                type: "listItem",
                children: [createParagraph([createText("List item")])],
              },
            ],
          },
        ],
      };
      const tree: Root = createRoot([jsxElement]);

      const transform = remarkUnravelJsx();
      transform(tree);

      const [container] = tree.children;
      expect(container?.type).toBe("mdxJsxFlowElement");
      if (container?.type === "mdxJsxFlowElement") {
        expect(container.children).toHaveLength(2);
        // Heading should remain unchanged
        expect(container.children[0]).toMatchObject({ type: "heading" });
        // List should remain unchanged (paragraph inside list item is not immediate child of JSX)
        expect(container.children[1]).toMatchObject({ type: "list" });
      }
    });
  });

  describe("integration scenarios", () => {
    it("processes complex document structure", () => {
      const tree: Root = createRoot([
        { type: "heading", depth: 1 as const, children: [createText("Title")] },
        createParagraph([createMdxJsxTextElement("HeaderComponent")]),
        createParagraph([createText("Regular paragraph text.")]),
        createParagraph([
          createMdxJsxTextElement("CardComponent"),
          createText("   "),
          createMdxJsxTextElement("ButtonComponent"),
        ]),
        {
          type: "blockquote",
          children: [createParagraph([createMdxJsxTextElement("QuoteComponent")])],
        },
      ]);

      const transform = remarkUnravelJsx();
      transform(tree);

      expect(tree.children).toHaveLength(7);
      // Heading unchanged
      expect(tree.children[0]).toMatchObject({ type: "heading" });
      // First paragraph unwrapped
      expect(tree.children[1]).toMatchObject({
        type: "mdxJsxTextElement",
        name: "HeaderComponent",
      });
      // Text paragraph unchanged
      expect(tree.children[2]).toMatchObject({ type: "paragraph" });
      // Multi-JSX paragraph unwrapped to multiple elements
      expect(tree.children[3]).toMatchObject({
        type: "mdxJsxTextElement",
        name: "CardComponent",
      });
      expect(tree.children[4]).toMatchObject({ type: "text", value: "   " });
      expect(tree.children[5]).toMatchObject({
        type: "mdxJsxTextElement",
        name: "ButtonComponent",
      });
      // Nested paragraph in blockquote unwrapped
      expect(tree.children[6]).toMatchObject({
        type: "blockquote",
        children: [
          {
            type: "mdxJsxTextElement",
            name: "QuoteComponent",
          },
        ],
      });
    });
  });
});
