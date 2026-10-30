import { describe, expect, it, vi } from 'vitest'

import {
  helpLooksLikeMarkdown,
  labelText,
  mayContainRichText,
  resolveRichText,
  toPlainText,
  warnIfHelpNeedsRichText,
} from './richText'

describe('mayContainRichText', () => {
  it('skips plain labels', () => {
    expect(mayContainRichText('Total cost')).toBe(false)
    expect(mayContainRichText('')).toBe(false)
    expect(mayContainRichText(undefined)).toBe(false)
  })

  it('detects markdown and math syntax', () => {
    expect(mayContainRichText('**bold**')).toBe(true)
    expect(mayContainRichText('CO_2')).toBe(true)
    expect(mayContainRichText('$x^2$')).toBe(true)
    expect(mayContainRichText('[docs](https://example.com)')).toBe(true)
  })
})

describe('toPlainText', () => {
  it('returns plain labels untouched', () => {
    expect(toPlainText('Total cost')).toBe('Total cost')
  })

  it('strips emphasis, code and links', () => {
    expect(toPlainText('**Bold** and _italic_ and `code`')).toBe(
      'Bold and italic and code'
    )
    expect(toPlainText('See [the docs](https://example.com)')).toBe(
      'See the docs'
    )
  })

  it('keeps underscores inside words, as markdown does', () => {
    expect(toPlainText('test_units.py')).toBe('test_units.py')
    expect(toPlainText('a_b_c and CO_2')).toBe('a_b_c and CO_2')
    expect(toPlainText('my__var')).toBe('my__var')
    expect(toPlainText('x_1 and _italic_')).toBe('x_1 and italic')
    expect(toPlainText('__init__ and __bold__')).toBe('init and bold')
    expect(toPlainText('_a_ then snake_case')).toBe('a then snake_case')
    expect(toPlainText('snake_case **bold**')).toBe('snake_case bold')
  })

  it('does not treat math symbols as markers', () => {
    expect(toPlainText('Area $x_{i}^2$ and snake_case')).toBe(
      'Area x_{i}^2 and snake_case'
    )
    expect(toPlainText('$$a_1 * b_2$$')).toBe('a_1 * b_2')
    expect(toPlainText('**Bold** $E = mc^2$')).toBe('Bold E = mc^2')
  })

  it('does not pair escaped dollar signs as math', () => {
    expect(toPlainText('\\$5 and \\$6')).toBe('$5 and $6')
  })

  it('unwraps math and keeps escaped characters', () => {
    expect(toPlainText('Area $m^2$')).toBe('Area m^2')
    expect(toPlainText('Cost \\$5')).toBe('Cost $5')
    expect(toPlainText('snake\\_case')).toBe('snake_case')
  })
})

describe('resolveRichText', () => {
  it('returns the closest defined level', () => {
    expect(resolveRichText(undefined, true, false)).toBe(true)
    expect(resolveRichText(false, true)).toBe(false)
    expect(resolveRichText(null, undefined)).toBeUndefined()
  })
})

describe('labelText', () => {
  it('only strips markdown when richText is true', () => {
    expect(labelText('snake_case **x**', undefined)).toBe('snake_case **x**')
    expect(labelText('snake_case **x**', false)).toBe('snake_case **x**')
    expect(labelText('snake\\_case **x**', true)).toBe('snake_case x')
  })
})

describe('helpLooksLikeMarkdown', () => {
  it('detects common markdown syntax', () => {
    expect(helpLooksLikeMarkdown('# Title')).toBe(true)
    expect(helpLooksLikeMarkdown('Some **bold** text')).toBe(true)
    expect(helpLooksLikeMarkdown('- one\n- two')).toBe(true)
    expect(helpLooksLikeMarkdown('See [docs](https://example.com)')).toBe(true)
    expect(helpLooksLikeMarkdown('Use <b>html</b>')).toBe(true)
  })

  it('ignores plain help text', () => {
    expect(helpLooksLikeMarkdown('Sets the max number of trucks.')).toBe(false)
    expect(helpLooksLikeMarkdown('Uses snake_case ids (e.g. a_b).')).toBe(false)
    expect(helpLooksLikeMarkdown(undefined)).toBe(false)
  })
})

describe('warnIfHelpNeedsRichText', () => {
  it('warns once per prop and only when richText is not set', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnIfHelpNeedsRichText('warnMe', '# Title', undefined)
    warnIfHelpNeedsRichText('warnMe', '# Title', undefined)
    warnIfHelpNeedsRichText('explicitTrue', '# Title', true)
    warnIfHelpNeedsRichText('explicitFalse', '# Title', false)
    warnIfHelpNeedsRichText('plain', 'Plain help', undefined)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('"warnMe"')
    warn.mockRestore()
  })
})
