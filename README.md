# remark-unravel-mdx

**[remark][]** plugin to unwrap paragraph elements that only contain [MDX][] JSX elements.

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

This package is a [unified][] ([remark][]) plugin that removes paragraph wrappers around MDX JSX elements when they are the only content (aside from whitespace) in a paragraph.

When working with MDX, markdown paragraphs that contain only JSX components get wrapped in `<p>` tags, which is often undesirable. This plugin removes those unnecessary paragraph wrappers.

## When should I use this?

This plugin is useful when you're using MDX and want to prevent JSX components from being wrapped in paragraph elements. This is particularly important when:

- Your JSX components are block-level elements that shouldn't be inside paragraphs
- You want cleaner HTML output without unnecessary `<p>` wrapper elements
- You're building a content pipeline where paragraph wrapping interferes with your component styling

This plugin only affects paragraphs that contain exclusively MDX JSX elements and whitespace. Regular text content and mixed content paragraphs remain unchanged.

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

<div>
  <p>Nested content</p>
</div>
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
<div>
  <p>Nested content</p>
</div>
```

`<CustomComponent />` is no longer wrapped in a `<p>` element, but the mixed content paragraph with `<InlineComponent />` remains wrapped.

## API

### `remarkUnravelJsx()`

Remove paragraph wrappers around MDX JSX elements.

###### Returns

Transform ([`Transformer`][unified-transformer]).

## Syntax tree

This plugin modifies the [mdast][] syntax tree by:

1. Finding paragraph nodes that contain only MDX JSX text elements and whitespace
2. Replacing those paragraph nodes with their children directly
3. Preserving the original position and structure of the JSX elements

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
