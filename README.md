# remark-unravel-mdx

**[remark][]** plugin to unwrap paragraph elements that only contain [MDX][] JSX elements and paragraphs inside MDX components.

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Install](#install)
- [Use](#use)
- [API](#api)
  - [`remarkUnravelMdx()`](#remarkUnravelMdx)
- [Examples](#examples)
- [Syntax tree](#syntax-tree)
- [Compatibility](#compatibility)
- [Security](#security)
- [Related](#related)
- [Contribute](#contribute)
- [License](#license)

## What is this?

This package is a [unified][] ([remark][]) plugin that removes paragraph wrappers in two scenarios:

1. **Paragraphs containing only JSX elements**: When a paragraph contains only MDX JSX elements (and whitespace), the paragraph wrapper is removed.
2. **Single paragraph inside MDX components**: When MDX components have exactly one paragraph child, that paragraph is unwrapped to prevent styling conflicts. Components with multiple children preserve their paragraph structure for safety.

## When should I use this?

This plugin is useful when you're using MDX and want to prevent unnecessary paragraph wrapping. This is particularly important when:

- Your JSX components are block-level elements that shouldn't be inside paragraphs
- You want cleaner HTML output without unnecessary `<p>` wrapper elements
- You're building a content pipeline where paragraph wrapping interferes with your component styling
- You want content inside JSX components to render without a paragraph wrapper for better styling control

Regular text content and mixed content paragraphs remain unchanged.

## Install

This package is [ESM only][esm].

```sh
npm install remark-unravel-mdx
```

```sh
yarn add remark-unravel-mdx
```

```html
<script type="module">
  import {remarkUnravelMdx} from 'https://esm.sh/remark-unravel-mdx?bundle'
</script>
```

## Use

`example.mdx`:

```md
This is a regular paragraph.

This paragraph has an <InlineComponent>inline component</InlineComponent> inside it.

<CustomComponent>
  This content will be unwrapped from its paragraph.
</CustomComponent>
```

`example.ts`:

```js
import {readFileSync} from 'node:fs'
import {remark} from 'remark'
import remarkMdx from 'remark-mdx'
import {remarkUnravelMdx} from 'remark-unravel-mdx'
import remarkRehype from 'remark-rehype'
import {rehypeMdxElements} from "rehype-mdx-elements";
import rehypeStringify from 'rehype-stringify'

const file = readFileSync('example.mdx')

const result = await remark()
  .use(remarkMdx)
  .use(remarkUnravelMdx)
  .use(remarkRehype, {
    passThrough: ["mdxJsxFlowElement", "mdxJsxTextElement"],
  })
  .use(rehypeMdxElements)
  .use(rehypeStringify)
  .process(file)

console.log(String(result))

```

Running `example.ts` produces an HTML string with the following content:

```html
<p>This is a regular paragraph.</p>
<CustomComponent>This component is on one line.</CustomComponent>
<CustomComponent>This component spans multiple lines</CustomComponent>
```

If `remarkUnravelMdx` is not used it will produce the following content with paragraph wrappers:

```html
<p>This is a regular paragraph.</p>
<p><CustomComponent>This component is on one line.</CustomComponent></p>
<CustomComponent><p>This component spans multiple lines</p></CustomComponent>
```

## API

### `remarkUnravelMdx()`

Remove paragraph wrappers around MDX JSX elements and inside MDX components.

###### Returns

Transform ([`Transformer`][unified-transformer]).

## Syntax tree

This plugin modifies the [mdast][] syntax tree by:

1. Finding paragraph nodes that contain only MDX JSX text elements and whitespace
2. Replacing those paragraph nodes with their children directly
3. Finding single paragraphs that are the sole child of MDX JSX elements
4. Unwrapping those single paragraphs by replacing them with their children
5. Preserving the original position and structure of all elements

For example, this paragraph node:

```js
{
  type: 'paragraph',
  children: [
    {type: 'mdxJsxTextElement', name: 'MyComponent', children: []}
  ]
}
```

Becomes:

```js
{type: 'mdxJsxTextElement', name: 'MyComponent', children: []}
```

## Related

- [`remark-mdx`][remark-mdx] — adds support for MDX syntax parsing
- [`remark-parse`][remark-parse] — parses markdown to remark AST
- [`remark-rehype`][remark-rehype] — transform remark to rehype

## License

[MIT][license] © [Tim Etler][author]

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[license]: license
[author]: https://timetler.com
[unified]: https://github.com/unifiedjs/unified
[unified-transformer]: https://github.com/unifiedjs/unified#transformer
[remark]: https://github.com/remarkjs/remark
[remark-mdx]: https://github.com/mdx-js/mdx/tree/main/packages/remark-mdx
[remark-rehype]: https://github.com/remarkjs/remark-rehype
[remark-parse]: https://github.com/remarkjs/remark/tree/main/packages/remark-parse
[mdast]: https://github.com/syntax-tree/mdast
[mdx]: https://mdxjs.com
