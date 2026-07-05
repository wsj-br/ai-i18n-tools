---
title: test-markdown-stress-test (MDX placeholder fixture)
description: >-
  Synthetic examples for every construct that becomes ADM, HTM, ANC, HDG, MDX,
  URL, BLD, ILC, or emphasis placeholders during doc translation.
sidebar_position: 999
---

{/*
  Fixture-only front matter above is intentionally boring.
  This MDX file exercises extraction + PlaceholderHandler for manual or scripted checks.
*/}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

export const FixtureBadge = ({ children }) => (
  <span className="fixture-badge">{children}</span>
);

<!-- Fixture: HTML comment before prose (HTM). -->

<a id="fixture-html-anchor-top"></a>

## All placeholder kinds {fixture-heading-id}

### Legacy heading id {#legacy-explicit-id}

### MDX heading id comment form {/* #mdx-explicit-id */}

### CommonMark-style explicit id (HTML comment) <!-- #html-comment-id -->

Here is a paragraph with **bold**, _italic_, and ~~strikethrough~~ that map to emphasis placeholders when emphasis protection is on.

Plain inline code uses backticks: `npm install` and `PATH/to/file`.

Bold-wrapped inline code is one token: **`TRANSLATION_KEY`**.

Markdown links keep destinations opaque: see [the docs](https://example.com/docs/page?query=1) and [same-site](/intro/getting-started).

Images keep URLs and alt handling: ![Diagram alt text](https://example.com/static/diagram.png).

Lowercase HTML from the allowlist: use <small>fine print</small> and a line break here<br /> before more text.

HTML comment mid-sentence: <!-- toc-anchor --> continues here.

<a id="fixture-inline-anchor"></a> Anchor-only line above may precede headings in doctoc-style sources.

---

## Admonitions

:::note Title text for admonition

Admonition body with a [link inside](https://example.com/note).

:::

:::tip

Tip body using `inline code` and **bold**.

:::

:::note[Your Title **with** some _Markdown_ `syntax`!]

Bracketed-title body: the title text above is translated while `:::note[` and `]` stay protected.

:::

:::tip[Pro tip]{.text--italic #my-tip}

Bracketed title followed by attributes: `]{.text--italic #my-tip}` is protected, only `Pro tip` is translated.

:::

:::::info[Parent]

Parent content with **bold** and a [link](https://example.com/parent).

::::danger[Child]

Child content using `inline code`.

:::tip[Deep Child]

Deep child content.

:::

::::

:::::

> [!NOTE]
> GitHub-style alert opener line is masked as an admonition placeholder; following `> ` lines stay as written until you rely on `:::note` for whole-block splitting.

## Tables (structure preserved in prompts)

| Column A | Column B |
| --- | --- |
| Cell one | Cell two |

## MDX comments (MDX)

Comment-only line: {/* prettier-ignore */}

Inline {/* short MDX comment */} between words.

## Capitalized JSX tags (MDX)

Use <Highlight color="#25c2a0">Docusaurus green</Highlight> in running text.

Self-closing: <TOCInline toc={toc} /> (expression props become MDX brace placeholders when not inside a tag the regex consumes).


## Tabs

<Tabs>
<TabItem value="a" label="First tab label">
Tab panel prose with {frontMatter.title} reference.
</TabItem>
</Tabs>


## Tabs without `label`, just `value`

<Tabs className="unique-tabs">
  <TabItem value="Apple">This is an apple 🍎</TabItem>
  <TabItem value="Orange">This is an orange 🍊</TabItem>
  <TabItem value="Banana">This is a banana 🍌</TabItem>
</Tabs>


## Tabs with defaultValue and values

<Tabs
  defaultValue="apple"
  values={[
    {label: 'Apple', value: 'apple'},
    {label: 'Orange', value: 'orange'},
    {label: 'Banana', value: 'banana'},
  ]}>
  <TabItem value="apple">This is an apple 🍎</TabItem>
  <TabItem value="orange">This is an orange 🍊</TabItem>
  <TabItem value="banana">This is a banana 🍌</TabItem>
</Tabs>

## MDX brace expressions (MDX)

Values: {version}, {frontMatter.description}, and nested props like <Box style={{ padding: 8, margin: 0 }}>inner</Box>.

## Fenced code (not translated as prose — extractor treats as `code` segment)

```tsx
// This block should not be sent as a translatable paragraph segment.
export function ignoredInFence() {
  return <code>{{not_a_placeholder}}</code>;
}
```

## Lists

- Bullet with `code` and [link](https://example.com/list).
1. Ordered item with **bold** and *italic*.

> Blockquote with **strong** and a [citation](https://example.com/quote).

## Docusaurus example 

Source: [docusarus-react](https://docusaurus.io/docs/markdown-features/react)

export const Highlight = ({children, color}) => (
  <span
    style={{
      backgroundColor: color,
      borderRadius: '2px',
      color: '#fff',
      padding: '0.2rem',
    }}>
    {children}
  </span>
);

<Highlight color="#25c2a0">Docusaurus green</Highlight> and <Highlight color="#1877F2">Facebook blue</Highlight> are my favorite colors.

I can write **Markdown** alongside my _JSX_!

## Docusarus - Importing components

<!-- Docusaurus theme component -->
import TOCInline from '@theme/TOCInline';
<!-- External component -->
import Button from '@mui/material/Button';
<!-- Custom component -->
import BrowserWindow from '@site/src/components/BrowserWindow';

---

_End of fixture — add new cases above this line when placeholder behavior expands._
