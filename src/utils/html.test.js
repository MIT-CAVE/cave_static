import { describe, expect, it } from 'vitest'

import { escapeHtml, markup, safeHtml } from './html'

describe('escapeHtml', () => {
  it('escapes the characters that can start markup or break attributes', () => {
    expect(escapeHtml(`<img src="x" onerror='a()'> & co`)).toBe(
      '&lt;img src=&quot;x&quot; onerror=&#39;a()&#39;&gt; &amp; co'
    )
  })

  it('keeps plain text and numbers as they are', () => {
    expect(escapeHtml('Total cost')).toBe('Total cost')
    expect(escapeHtml(12.5)).toBe('12.5')
  })
})

describe('markup', () => {
  it('escapes the interpolated values', () => {
    expect(String(markup`<b>${'<script>x</script>'}</b>`)).toBe(
      '<b>&lt;script&gt;x&lt;/script&gt;</b>'
    )
  })

  it('does not escape the markup of the template itself', () => {
    expect(String(markup`<div style="color: red">${'a'}</div>`)).toBe(
      '<div style="color: red">a</div>'
    )
  })

  it('does not escape nested markup or trusted markup twice', () => {
    const row = (name) => markup`<li>${name}</li>`
    expect(String(markup`<ul>${row('<a>')}</ul>`)).toBe(
      '<ul><li>&lt;a&gt;</li></ul>'
    )
    expect(String(markup`${safeHtml('<span style="x"></span>')} ${'<'}`)).toBe(
      '<span style="x"></span> &lt;'
    )
  })

  it('joins arrays and ignores empty values, so lists need no join', () => {
    expect(String(markup`<p>${['a', false, null, undefined, '<b>']}</p>`)).toBe(
      '<p>a&lt;b&gt;</p>'
    )
    expect(
      String(markup`${[markup`<i>${'x'}</i>`, markup`<i>${'y'}</i>`]}`)
    ).toBe('<i>x</i><i>y</i>')
  })

  it('shows zero', () => {
    expect(String(markup`${0}`)).toBe('0')
  })
})
