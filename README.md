# remark-unravel-mdx

**[remark][]** plugin to unwrap paragraph elements that only contain [MDX][] JSX elements and paragraphs inside MDX components.

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Install](#install)
- [Use](#use)
- [API](#api)
  - [`unified().use(remarkUnravelJsx)`](#unifieduseremarkUnravelJsx)
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
  import {remarkUnravelJsx} from 'https://esm.sh/remark-unravel-mdx@1?bundle'
</script>
```

## Use

`example.mdx`:

```md
This is a regular paragraph.

<CustomComponent />

This paragraph has a <InlineComponent /> inside it.

<Card>
  This content will be unwrapped from its paragraph.
</Card>
```

`example.ts`:

```js
import {readFileSync} from 'node:fs'
import {remark} from 'remark'
import remarkMdx from 'remark-mdx'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import {remarkUnravelJsx} from 'remark-unravel-mdx'

const file = readFileSync('example.mdx')

const result = await remark()
  .use(remarkMdx)
  .use(remarkUnravelJsx)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(file)

console.log(String(result))
```

Running `example.ts` produces an HTML string with the following content:

```html
<p>This is a regular paragraph.</p>
<CustomComponent />
<p>This paragraph has a <InlineComponent /> inside it.</p>
<Card>
  This content will be unwrapped from its paragraph.
</Card>
```

## API

### `remarkUnravelJsx()`

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

- [`remark-mdx`][remark-mdx] — support MDX syntax
- [`remark-rehype`][remark-rehype] — transform remark to rehype
- [`rehype-sanitize`][rehype-sanitize] — sanitize HTML

## License

[MIT][license] © [Tim Etler][author]

[npm]: https://docs.npmjs.com/cli/install
[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[esmsh]: https://esm.sh
[license]: license
[author]: https://etler.dev
[unified]: https://github.com/unifiedjs/unified
[unified-transformer]: https://github.com/unifiedjs/unified#transformer
[remark]: https://github.com/remarkjs/remark
[remark-mdx]: https://github.com/mdx-js/mdx/tree/main/packages/remark-mdx
[remark-rehype]: https://github.com/remarkjs/remark-rehype
[rehype-sanitize]: https://github.com/rehypejs/rehype-sanitize
[mdast]: https://github.com/syntax-tree/mdast
[mdx]: https://mdxjs.com
[mdx-security]: https://mdxjs.com/docs/troubleshooting-mdx/#security
[api-remarkUnravelJsx]: #unifieduseremarkUnravelJsx
