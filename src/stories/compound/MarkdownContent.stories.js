import { expect, waitFor, within } from 'storybook/test'

import MarkdownContent from '../../ui/compound/MarkdownContent'

const markdownContentStories = {
  title: 'Compound/MarkdownContent',
  component: MarkdownContent,
  render: (args) => <MarkdownContent {...args} />,
}

export default markdownContentStories

// The decorator wraps stories in the app, so look for the content itself
const getContent = (canvasElement, text) =>
  within(canvasElement).getByText(text).closest('.MuiBox-root')

// Payloads that are rendered unsafely when HTML is not sanitized
const ATTACKS = [
  '<script>window.__xss = "script"</script>',
  '<img src="x" onerror="window.__xss = \'onerror\'">',
  '<iframe src="https://example.com"></iframe>',
  '<svg onload="window.__xss = \'svg\'"></svg>',
  '<a href="javascript:window.__xss = \'html link\'">html link</a>',
  '[markdown link](javascript:window.__xss)',
  '<div style="position: fixed; inset: 0" onclick="window.__xss = 1">cover</div>',
  '<span class="katex-mathml">spoofed class</span>',
  '<a href="data:text/html;base64,PHNjcmlwdD48L3NjcmlwdD4=">data link</a>',
].join('\n\n')

export const SanitizesHtml = {
  args: { content: `Safe text\n\n${ATTACKS}` },
  play: async ({ canvasElement }) => {
    delete window.__xss
    const content = getContent(canvasElement, 'Safe text')
    await expect(content).toBeInTheDocument()
    await expect(content.querySelectorAll('script, iframe, svg')).toHaveLength(
      0
    )
    const all = [...content.querySelectorAll('*')]
    // No event handlers
    await expect(
      all.filter((el) =>
        el.getAttributeNames().some((name) => name.startsWith('on'))
      )
    ).toHaveLength(0)
    // No inline styles or `javascript:`/`data:` URLs
    await expect(content.querySelectorAll('[style]')).toHaveLength(0)
    await expect(
      all.filter((el) => /^(javascript|data):/i.test(el.getAttribute('href')))
    ).toHaveLength(0)
    // Authors can't use the classes that style the formulas
    await expect(content.querySelector('.katex-mathml')).toBeNull()
    // Give a rejected `<img onerror>` the time to fire if it was left in
    await new Promise((resolve) => setTimeout(resolve, 200))
    await expect(window.__xss).toBeUndefined()
  },
}

const FEATURES = `
# Heading

Some **bold**, _italic_, \`inline code\` and a [link](https://example.com).

Inline math $E = mc^2$ and display math:

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

| Name | Value |
| ---- | ----- |
| a    | 1     |

- [x] Done
- [ ] Pending

~~struck~~ <details><summary>More</summary>Hidden text</details>

\`\`\`python
print("hello")
\`\`\`
`

export const KeepsSupportedFeatures = {
  args: { content: FEATURES },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Heading' })).toBeVisible()
    await expect(canvas.getByText('bold').tagName).toBe('STRONG')
    await expect(canvas.getByRole('link', { name: 'link' })).toHaveAttribute(
      'href',
      'https://example.com'
    )
    // Formulas are rendered by KaTeX after the content is sanitized
    // The display formula is wrapped in a `.katex-display` with its own `.katex`
    await expect(canvasElement.querySelectorAll('.katex').length).toBe(2)
    await expect(canvasElement.querySelector('.katex-display')).not.toBeNull()
    // KaTeX keeps the inline styles it needs
    await expect(canvasElement.querySelector('.katex [style]')).not.toBeNull()
    await expect(canvas.getByRole('table')).toBeVisible()
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(2)
    await expect(canvasElement.querySelector('del')).not.toBeNull()
    await expect(canvasElement.querySelector('details')).not.toBeNull()
    // Code blocks keep their copy button
    await expect(canvas.getByText('print("hello")')).toBeInTheDocument()
    await expect(canvasElement.querySelector('pre code')).not.toBeNull()
  },
}

// The sanitizer prefixes ids, so links to them must be prefixed too
const expectLinkTarget = async (link, content) => {
  const targetId = decodeURIComponent(link.getAttribute('href').slice(1))
  await waitFor(() =>
    expect(content.querySelector(`[id="${targetId}"]`)).not.toBeNull()
  )
}

export const FootnotesStillLink = {
  args: { content: 'A claim[^1].\n\n[^1]: The source.' },
  play: async ({ canvasElement }) => {
    const content = getContent(canvasElement, /A claim/)
    await expectLinkTarget(
      content.querySelector('a[data-footnote-ref]'),
      content
    )
    await expectLinkTarget(
      content.querySelector('a[data-footnote-backref]'),
      content
    )
  },
}

export const InPageLinksStillWork = {
  args: { content: '<h2 id="target">Target</h2>\n\n[Go to target](#target)' },
  play: async ({ canvasElement }) => {
    const content = getContent(canvasElement, 'Target')
    await expectLinkTarget(within(content).getByRole('link'), content)
  },
}
