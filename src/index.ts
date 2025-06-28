import type { Root, Paragraph } from "mdast";
import type {} from "mdast-util-mdx-jsx";
import { visit } from "unist-util-visit";

/**
 * Remark plugin to unravel paragraphs containing only JSX elements
 *
 * This plugin finds paragraphs that contain only MDX JSX elements (and whitespace)
 * and replaces them with their children directly, preserving the original
 * element types.
 *
 * @returns A unified transformer function
 *
 * @example
 * ```js
 * unified()
 *   .use(remarkParse)
 *   .use(remarkMdx)
 *   .use(remarkUnravelJsx)
 * ```
 */
export function remarkUnravelJsx() {
  return function (tree: Root): void {
    visit(tree, "paragraph", (node: Paragraph, index, parent) => {
      // Check if paragraph contains only JSX elements and whitespace
      const hasOnlyJsxAndWhitespace = node.children.every((child) => {
        switch (child.type) {
          case "mdxJsxTextElement":
            return true;
          case "text":
            // Allow only whitespace text nodes
            return child.value.trim() === "";
          default:
            return false;
        }
      });

      if (hasOnlyJsxAndWhitespace && parent && index !== undefined) {
        // Remove the paragraph and replace it with its children
        parent.children.splice(index, 1, ...node.children);

        // Return the index adjusted for the number of new nodes
        return index + node.children.length - 1;
      }
      return;
    });
  };
}
