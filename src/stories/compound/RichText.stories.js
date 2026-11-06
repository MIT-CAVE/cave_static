import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import ReactMarkdown from 'react-markdown'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import MarkdownContent from '../../ui/compound/MarkdownContent'
import { PaneHeader } from '../../ui/compound/Pane'
import PropAudio from '../../ui/compound/PropAudio'
import { PropButtonFilled } from '../../ui/compound/PropButton'
import PropComboBox from '../../ui/compound/PropComboBox'
import PropComboBoxMulti from '../../ui/compound/PropComboBoxMulti'
import PropContainer from '../../ui/compound/PropContainer'
import { PropDate, PropDateTime, PropTime } from '../../ui/compound/PropDate'
import PropDropdown from '../../ui/compound/PropDropdown'
import PropDualList from '../../ui/compound/PropDualList'
import { PropHeadColumn } from '../../ui/compound/PropHead'
import PropNested from '../../ui/compound/PropNested'
import PropNumberField from '../../ui/compound/PropNumberField'
import PropNumberIcon from '../../ui/compound/PropNumberIcon'
import PropNumberIconCompact from '../../ui/compound/PropNumberIconCompact'
import PropNumberIconCompactAlt from '../../ui/compound/PropNumberIconCompactAlt'
import PropPicture from '../../ui/compound/PropPicture'
import PropRadio from '../../ui/compound/PropRadio'
import { PropText, PropTextArea } from '../../ui/compound/PropText'
import {
  PropToggleButton,
  PropToggleCheckbox,
  PropToggleSwitch,
} from '../../ui/compound/PropToggle'
import PropVideo from '../../ui/compound/PropVideo'
import RichLabel, {
  MAX_CACHE_SIZE,
  MAX_CACHE_WEIGHT,
  getRichNode,
} from '../../ui/compound/RichLabel'
import { AppModal } from '../../ui/views/common/Modal'
import OptionsPane from '../../ui/views/common/OptionsPane'
import renderAppPane from '../../ui/views/common/Pane'
import Prop from '../../ui/views/common/renderProp'

const richTextStories = {
  title: 'Compound/RichText',
  component: PropContainer,
  args: {
    title: '**Total** cost in $m^2$',
    subtitle: 'Per _unit_ of `area`',
    unit: 'USD$_{2024}$',
    tooltipContent: '# Heading\n\nSome **markdown** help.',
    marquee: false,
  },
  render: (args) => <PropContainer {...args}>Content</PropContainer>,
}

export default richTextStories

// Labels stay plain unless `richText` is explicitly `true`
export const PlainByDefault = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('**Total** cost in $m^2$')
    ).toBeInTheDocument()
    await expect(canvasElement.querySelector('strong')).toBeNull()
  },
}

export const RichLabels = {
  args: { richText: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Total').tagName).toBe('STRONG')
    await expect(canvasElement.querySelector('.katex')).not.toBeNull()
    // KaTeX renders a MathML copy of each formula next to the HTML one. It must
    // be visually hidden (by `katex.min.css`) or the formula shows up twice.
    const mathml = canvasElement.querySelector('.katex-mathml')
    await expect(getComputedStyle(mathml).position).toBe('absolute')
    // Block elements are unwrapped so labels stay inline
    await expect(canvasElement.querySelector('p, h1')).toBeNull()
  },
}

export const RichLabelsWithMarquee = {
  args: { richText: true, marquee: true },
}

// The help tooltip header shows the (rich) title
export const RichHelpTitle = {
  args: { richText: true },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByLabelText('info'))
    // The tooltip is rendered in a portal, outside of the canvas
    const tooltip = await within(document.body).findByRole('tooltip')
    await waitFor(() => {
      expect(tooltip.querySelector('strong')?.textContent).toBe('Total')
      expect(tooltip.querySelector('.katex')).not.toBeNull()
    })
  },
}

// `help` is markdown unless `richText` is explicitly `false`
export const PlainHelp = {
  args: { richText: false },
}

const options = {
  a: { name: '**Bold** option' },
  b: { name: 'CO_2 and snake_case' },
  c: { name: 'Area $m^2$' },
}

const optionProp = (richText) => ({
  enabled: true,
  options,
  richText,
  value: ['a'],
})

const OptionsStory = ({ Component, richText }) => (
  <Component
    prop={optionProp(richText)}
    currentVal={['a']}
    onChange={() => {}}
  />
)

// Options inherit the prop's `richText`
export const RadioOptionsRich = {
  render: () => <OptionsStory Component={PropRadio} richText />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('strong')).not.toBeNull()
    await expect(canvasElement.querySelector('.katex')).not.toBeNull()
  },
}

export const RadioOptionsPlain = {
  render: () => <OptionsStory Component={PropRadio} />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('strong')).toBeNull()
    // Underscores in ordinary labels are never stripped
    await expect(
      within(canvasElement).getByText('CO_2 and snake_case')
    ).toBeInTheDocument()
  },
}

export const DropdownOptionsRich = {
  render: () => <OptionsStory Component={PropDropdown} richText />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('strong')).not.toBeNull()
  },
}

export const ComboBoxOptionsRich = {
  render: () => <OptionsStory Component={PropComboBox} richText />,
}

export const ComboBoxMultiOptionsRich = {
  render: () => <OptionsStory Component={PropComboBoxMulti} richText />,
}

export const DualListOptionsRich = {
  render: () => <OptionsStory Component={PropDualList} richText />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.katex')).not.toBeNull()
  },
}

// Each text is parsed once: the cache holds rendered trees, not markdown elements
export const LabelsAreParsedOnce = {
  render: () => <RichLabel text="**Parsed** once" />,
  play: async () => {
    const node = getRichNode('_cached_')
    await expect(getRichNode('_cached_')).toBe(node)
    await expect(getRichNode('_other_')).not.toBe(node)
    // Rendering a `ReactMarkdown` element would parse again on every mount
    await expect(getRichNode('**bold**').type).not.toBe(ReactMarkdown)
  },
}

// Links open in a new tab and their clicks stay out of the parent control
export const LinksInLabels = {
  args: { onParentClick: fn() },
  render: ({ onParentClick }) => (
    <div
      onClick={onParentClick}
      // Avoid navigating away during the test
      onClickCapture={(event) => event.preventDefault()}
    >
      <RichLabel text="A [linked](https://example.com) label" />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'linked' })
    await expect(link).toHaveAttribute('href', 'https://example.com')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    await userEvent.click(link)
    await expect(args.onParentClick).not.toHaveBeenCalled()
  },
}

const renderProp = (Component, prop, extra = {}) => ({
  render: () => (
    <Component
      prop={{ enabled: true, richText: true, ...prop }}
      onChange={() => {}}
      {...extra}
    />
  ),
})

const expectRich = async (canvasElement) => {
  await expect(canvasElement.querySelector('strong')).not.toBeNull()
}

export const HeadRich = {
  ...renderProp(PropHeadColumn, {
    name: '**Bold** head',
    help: '# Help',
  }),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const HeadPlainHelp = {
  ...renderProp(PropHeadColumn, {
    name: 'Head',
    help: '# Not a heading',
    richText: false,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByLabelText('info'))
    const tooltip = await within(document.body).findByRole('tooltip')
    await expect(tooltip.querySelector('h1')).toBeNull()
    await expect(tooltip).toHaveTextContent('# Not a heading')
  },
}

const toggleProp = { label: '**Bold** toggle', value: false }

export const ToggleButtonRich = {
  ...renderProp(PropToggleButton, toggleProp, { currentVal: false }),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const ToggleCheckboxRich = {
  ...renderProp(PropToggleCheckbox, toggleProp, { currentVal: false }),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const ToggleSwitchRich = {
  ...renderProp(PropToggleSwitch, toggleProp, { currentVal: false }),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const ButtonRich = {
  ...renderProp(PropButtonFilled, { name: '**Bold** button' }),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const TextRich = {
  ...renderProp(
    PropText,
    {
      label: '**Bold** label',
      placeholder: 'A **plain** placeholder',
      value: '',
    },
    { currentVal: '' }
  ),
  play: async ({ canvasElement }) => {
    await expectRich(canvasElement)
    // Attributes cannot hold rich text, so the placeholder is plain text
    await expect(canvasElement.querySelector('input')).toHaveAttribute(
      'placeholder',
      'A plain placeholder'
    )
  },
}

export const NumberFieldRich = {
  ...renderProp(
    PropNumberField,
    { label: '**Bold** label', value: 5, placeholder: 'A **plain** one' },
    { currentVal: 5 }
  ),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

const numberIconProp = { name: '**Bold** name', value: 5, icon: 'md/MdApple' }

export const NumberIconRich = {
  ...renderProp(PropNumberIcon, numberIconProp),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const NumberIconCompactRich = {
  ...renderProp(PropNumberIconCompact, numberIconProp),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const NumberIconCompactAltRich = {
  ...renderProp(PropNumberIconCompactAlt, numberIconProp),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const NestedRich = {
  ...renderProp(
    PropNested,
    {
      options: {
        a: { name: '**Bold** leaf', path: ['A **group**'] },
      },
      helperText: 'A **helper** text',
      value: [],
    },
    { currentVal: [] }
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('strong').length).toBe(3)
  },
}

export const RadioHelperTextRich = {
  render: () => (
    <PropRadio
      prop={{
        ...optionProp(true),
        // The helper text of the selected option replaces the prop's own
        options: { a: { name: 'A', helperText: 'A **helper** text' } },
      }}
      currentVal={['a']}
      onChange={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('.MuiFormHelperText-root strong')
    ).not.toBeNull()
  },
}

const dateLabel = '**Bold** date'

const datePickerDecorator = (Story) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Story />
  </LocalizationProvider>
)

export const DateRich = {
  decorators: [datePickerDecorator],
  ...renderProp(PropDate, { label: dateLabel, value: '2026-07-09' }),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const TimeRich = {
  decorators: [datePickerDecorator],
  ...renderProp(PropTime, { label: dateLabel, value: '09:30:00' }),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const DateTimeRich = {
  decorators: [datePickerDecorator],
  ...renderProp(PropDateTime, {
    label: dateLabel,
    value: '2026-07-09T09:30:00',
  }),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const DatePlainByDefault = {
  decorators: [datePickerDecorator],
  ...renderProp(PropDate, {
    label: dateLabel,
    value: '2026-07-09',
    richText: undefined,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('strong')).toBeNull()
  },
}

// Labels of long lists must stay cached, and a full cache evicts the least
// recently used label instead of dropping everything
export const CacheHandlesLongLists = {
  render: () => <RichLabel text="**Many** labels" />,
  play: async () => {
    const text = (i) => `**Option** ${i} of a long list`
    const first = getRichNode(text(0))
    const nodes = Array.from({ length: MAX_CACHE_SIZE - 1 }, (_, i) =>
      getRichNode(text(i + 1))
    )
    // Everything up to the limit is still cached
    await expect(getRichNode(text(0))).toBe(first)
    await expect(getRichNode(text(MAX_CACHE_SIZE - 1))).toBe(
      nodes[MAX_CACHE_SIZE - 2]
    )
    // Adding one more evicts the least recently used label (text(1), since
    // text(0) was just used) and keeps the rest
    getRichNode(text(MAX_CACHE_SIZE))
    await expect(getRichNode(text(0))).toBe(first)
    await expect(getRichNode(text(2))).toBe(nodes[1])
    await expect(getRichNode(text(1))).not.toBe(nodes[0])
  },
}

// Heavy labels (math) are bounded by the size of their trees, not just by count
export const CacheIsBoundedByWeight = {
  render: () => <RichLabel text="Area $m^2$" />,
  play: async () => {
    const text = (i) => `Formula ${i}: $x_{${i}}^2 + y_{${i}}^2$`
    const first = getRichNode(text(0))
    // A single formula is far heavier than a plain markdown label
    const elements = JSON.stringify(first).split('"type"').length - 1
    await expect(elements).toBeGreaterThan(20)
    // Fill the cache with enough formulas to go over the budget
    const count = Math.ceil(MAX_CACHE_WEIGHT / elements) + 20
    await expect(count).toBeLessThan(MAX_CACHE_SIZE)
    const last = Array.from({ length: count }, (_, i) =>
      getRichNode(text(i + 1))
    ).pop()
    // The oldest formula was evicted long before the entry limit was reached
    await expect(getRichNode(text(0))).not.toBe(first)
    // The latest ones are still cached
    await expect(getRichNode(text(count))).toBe(last)
  },
}

const SUBTITLES = {
  plain: "This example uses the `num`'s `slider` variant",
  log: "This example uses the `num`'s `slider` variant with logarithmic scaling ($\\log_{10}$)",
  exp: "This example uses the `num`'s `slider` variant with exponential scaling ($2^x$)",
  subAndSuperscript: 'Growth is $O(n \\log n)$ and $x_{i}^{2}$',
}

const FORMULAS = [
  '$\\log_{10}$',
  '$x_{i}^{2}$',
  '$O(n \\log n)$',
  '$\\frac{a}{b}$',
  '$\\sqrt{x}$',
  '$\\sum_{i=1}^{n} x_i$',
  '$\\frac{\\partial f}{\\partial x}$',
  '$\\int_0^1 x^2 dx$',
  '$\\binom{n}{k}$',
  '$\\sqrt{\\frac{a}{b}}$',
]

const FORMULA_SUBTITLES = Object.fromEntries(
  FORMULAS.map((formula) => [formula, `Text ${formula} text`])
)

const getSubtitle = (row) => row.querySelector('.MuiTypography-subtitle2')

const getMarquee = (subtitle) => subtitle.firstElementChild.children[0]

const getLines = (element) =>
  element.getBoundingClientRect().height /
  parseFloat(getComputedStyle(element).lineHeight)

// Formulas can be taller than the line box of a label (e.g. subscripts), which
// must not make a subtitle that fits scroll as a marquee or get a scrollbar
export const SubtitlesFitTheirLine = {
  render: () => (
    <div style={{ width: 900 }}>
      {Object.entries({ ...SUBTITLES, ...FORMULA_SUBTITLES }).map(
        ([key, subtitle]) => (
          <div key={key} data-key={key}>
            <PropContainer title={key} {...{ subtitle }} richText>
              <span />
            </PropContainer>
          </div>
        )
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const row of canvasElement.querySelectorAll('[data-key]')) {
      const subtitle = getSubtitle(row)
      // Fits, so it is shown as text and not as a marquee
      await expect(getComputedStyle(getMarquee(subtitle)).display).toBe('none')
      await expect(getLines(subtitle)).toBeLessThan(1.5)
    }
  },
}

// A subtitle that does not fit scrolls on a single line, without a scrollbar
export const SubtitlesScrollWhenTheyDoNotFit = {
  render: () => (
    <div style={{ width: 300 }}>
      <div data-key="log">
        <PropContainer
          title="Signal Strength"
          subtitle={SUBTITLES.log}
          richText
        >
          <span />
        </PropContainer>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const subtitle = getSubtitle(canvasElement.querySelector('[data-key]'))
    const marquee = getMarquee(subtitle)
    await waitFor(() =>
      expect(getComputedStyle(marquee).display).not.toBe('none')
    )
    await expect(getComputedStyle(marquee).overflowY).toBe('hidden')
    await expect(getLines(subtitle)).toBeLessThan(1.5)
    await expect(subtitle.scrollWidth).toBeLessThanOrEqual(subtitle.clientWidth)
  },
}

// The columns of a layout are sized by their widest (`max-content`) content
export const SubtitlesDoNotWidenGridColumns = {
  render: () => (
    <div
      data-key="grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(max-content, 1fr)',
        width: 'max-content',
      }}
    >
      <PropContainer title="Signal Strength" subtitle={SUBTITLES.exp} richText>
        <span />
      </PropContainer>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector('[data-key]')
    const subtitle = getSubtitle(grid)
    // The subtitle is far wider than the column, so it scrolls
    await expect(grid.getBoundingClientRect().width).toBeLessThan(320)
    await waitFor(() =>
      expect(getComputedStyle(getMarquee(subtitle)).display).not.toBe('none')
    )
    await expect(getLines(subtitle)).toBeLessThan(1.5)
  },
}

// Inline code is highlighted with a subtle background, in labels and in `help`
const expectHighlightedCode = async (code) => {
  const style = getComputedStyle(code)
  await expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  await expect(style.fontFamily).toMatch(/monospace/)
  return style
}

export const InlineCodeIsHighlighted = {
  render: () => (
    <div data-key="code">
      <PropContainer
        title="A `code` title"
        subtitle="With `inline code`"
        unit="`kg`"
        richText
      >
        <span />
      </PropContainer>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const codes = canvasElement.querySelectorAll('[data-key="code"] code')
    // The title, subtitle and unit, which are rendered twice by `OverflowText`
    await expect(codes.length).toBeGreaterThanOrEqual(3)
    for (const code of codes) await expectHighlightedCode(code)
  },
}

export const HelpInlineCodeKeepsItsLook = {
  render: () => <MarkdownContent content="Some `inline code` in help" />,
  play: async ({ canvasElement }) => {
    const code = canvasElement.querySelector('code')
    const style = await expectHighlightedCode(code)
    // `help` has more room around its code than labels do
    await expect(parseFloat(style.paddingLeft)).toBeGreaterThan(4)
  },
}

// The helper text of text, number and media props
const HELPER = '**Bold** helper and `code`'

const expectRichHelperText = async (canvasElement) => {
  const helper = canvasElement.querySelector('.MuiFormHelperText-root')
  await expect(helper).not.toBeNull()
  await expect(helper.querySelector('strong')?.textContent).toBe('Bold')
  await expect(helper.querySelector('code')).not.toBeNull()
}

export const TextHelperTextRich = {
  ...renderProp(
    PropText,
    { label: 'Name', helperText: HELPER, value: '' },
    { currentVal: '' }
  ),
  play: async ({ canvasElement }) => expectRichHelperText(canvasElement),
}

export const TextAreaHelperTextRich = {
  ...renderProp(
    PropTextArea,
    { label: 'Notes', helperText: HELPER, value: '' },
    { currentVal: '' }
  ),
  play: async ({ canvasElement }) => expectRichHelperText(canvasElement),
}

export const NumberFieldHelperTextRich = {
  ...renderProp(
    PropNumberField,
    { label: 'Volume', helperText: HELPER, value: 5 },
    { currentVal: 5 }
  ),
  play: async ({ canvasElement }) => expectRichHelperText(canvasElement),
}

// Without `richText`, the helper text is shown as it is written
export const HelperTextIsPlainByDefault = {
  render: () => (
    <div>
      <PropText
        prop={{ enabled: true, helperText: HELPER, value: '' }}
        currentVal=""
        onChange={() => {}}
      />
      <PropNumberField
        prop={{ enabled: true, helperText: HELPER, value: 5 }}
        currentVal={5}
        onChange={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const helpers = canvasElement.querySelectorAll('.MuiFormHelperText-root')
    await expect(helpers).toHaveLength(2)
    for (const helper of helpers) {
      await expect(helper.querySelector('strong')).toBeNull()
      await expect(helper).toHaveTextContent(HELPER)
    }
  },
}

// The visible text is rich, but attributes can't hold markup, so they are plain
const MEDIA_HELPER = '**Bold** caption (_note_)'
const MEDIA_HELPER_PLAIN = 'Bold caption (note)'
const IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export const PictureHelperTextRich = {
  ...renderProp(PropPicture, { value: IMAGE, helperText: MEDIA_HELPER }),
  play: async ({ canvasElement }) => {
    await expectRich(canvasElement)
    await expect(canvasElement.querySelector('img')).toHaveAttribute(
      'alt',
      MEDIA_HELPER_PLAIN
    )
  },
}

export const VideoHelperTextRich = {
  ...renderProp(PropVideo, {
    value: 'about:blank',
    helperText: MEDIA_HELPER,
  }),
  play: async ({ canvasElement }) => {
    await expectRich(canvasElement)
    await expect(canvasElement.querySelector('iframe')).toHaveAttribute(
      'title',
      MEDIA_HELPER_PLAIN
    )
  },
}

export const AudioHelperTextRich = {
  ...renderProp(PropAudio, { value: '', helperText: MEDIA_HELPER }),
  play: async ({ canvasElement }) => {
    await expectRich(canvasElement)
    await expect(canvasElement.querySelector('audio')).toHaveAttribute(
      'aria-label',
      MEDIA_HELPER_PLAIN
    )
  },
}

// The `richText` cascade: prop > layout item > grids > pane or global outputs >
// `settings.defaults.richText`
const ICON_URL = 'https://react-icons.mitcave.com/5.4.0'
const withDefault = (richText) => ({
  settings: { iconUrl: ICON_URL, defaults: { richText } },
})

const textProp = (prop) => ({
  id: 'p',
  type: 'text',
  name: '**Bold** name',
  value: '',
  ...prop,
})

const renderTextProp = (prop) => () => (
  <Prop prop={textProp(prop)} currentVal="" onChange={() => {}} />
)

export const GlobalDefaultMakesLabelsRich = {
  parameters: { initData: withDefault(true) },
  render: renderTextProp(),
  play: async ({ canvasElement }) => expectRich(canvasElement),
}

export const PropOverridesTheGlobalDefault = {
  parameters: { initData: withDefault(true) },
  render: renderTextProp({ richText: false }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('strong')).toBeNull()
    await expect(
      within(canvasElement).getAllByText('**Bold** name').length
    ).toBeGreaterThan(0)
  },
}

const headProp = { type: 'head', variant: 'column', help: '# Heading' }

const expectHelpHeading = async (canvasElement, expected) => {
  await userEvent.hover(within(canvasElement).getByLabelText('info'))
  const tooltip = await within(document.body).findByRole('tooltip')
  await expect(tooltip.querySelector('h1') !== null).toBe(expected)
}

// Without any `richText`, `help` is markdown, as before
export const HelpStaysMarkdownWithoutADefault = {
  render: renderTextProp(headProp),
  play: ({ canvasElement }) => expectHelpHeading(canvasElement, true),
}

export const GlobalDefaultFalseMakesHelpPlain = {
  parameters: { initData: withDefault(false) },
  render: renderTextProp(headProp),
  play: ({ canvasElement }) => expectHelpHeading(canvasElement, false),
}

const PANE = {
  name: '**Bold** pane',
  props: {
    rich: { type: 'text', name: '**Bold** prop' },
    plain: { type: 'text', name: '**Plain** prop', richText: false },
  },
  values: { rich: '', plain: '' },
}

export const PaneRootCascadesToItsProps = {
  render: () => <OptionsPane open="p" pane={{ ...PANE, richText: true }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const bold of canvas.getAllByText('Bold')) {
      await expect(bold.tagName).toBe('STRONG')
    }
    // A prop overrides the root of its pane
    await expect(canvas.getAllByText('**Plain** prop').length).toBeGreaterThan(
      0
    )
  },
}

export const PaneTitleIsRich = {
  render: () => <PaneHeader title="**Bold** pane" richText />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('h6 strong')).not.toBeNull()
  },
}

export const PaneTitleIsPlainByDefault = {
  render: () => <PaneHeader title="**Bold** pane" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('h6 strong')).toBeNull()
    await expect(
      within(canvasElement).getByText('**Bold** pane')
    ).toBeInTheDocument()
  },
}

const renderPane = (pane) => () =>
  renderAppPane({
    open: 'p',
    openPanesData: pane,
    pane,
    side: 'left',
  })

export const AppPaneUsesItsOwnRichText = {
  render: renderPane({ ...PANE, richText: true }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('h6 strong')).not.toBeNull()
    )
  },
}

export const AppPaneFollowsTheGlobalDefault = {
  parameters: { initData: withDefault(true) },
  render: renderPane(PANE),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('h6 strong')).not.toBeNull()
    )
  },
}

export const AppPaneCanOptOutOfTheGlobalDefault = {
  parameters: { initData: withDefault(true) },
  render: renderPane({ ...PANE, richText: false }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('h6')).not.toBeNull()
    )
    await expect(canvasElement.querySelector('h6 strong')).toBeNull()
  },
}

const MODAL_DATA = (richText) => ({
  settings: { iconUrl: ICON_URL },
  panes: {
    paneState: { center: { type: 'pane', open: 'p' } },
    data: {
      p: {
        ...PANE,
        name: '**Bold** modal',
        props: { rich: { type: 'text', name: '_Emphasis_ prop' } },
        values: { rich: '' },
        richText,
      },
    },
  },
})

export const ModalTitleAndPropsAreRich = {
  parameters: { initData: MODAL_DATA(true) },
  render: () => <AppModal />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The title is rich (once), and so are the labels of its props
    await waitFor(() => expect(canvas.getAllByText('Bold')).toHaveLength(1))
    await expect(canvas.getByText('Bold').tagName).toBe('STRONG')
    for (const emphasis of canvas.getAllByText('Emphasis')) {
      await expect(emphasis.tagName).toBe('EM')
    }
  },
}

// The unit is part of the value of the number icons, so it is rich text too
const unitIconProp = {
  name: 'Output',
  value: 1250,
  icon: 'md/MdApple',
  unit: '$m^3$/h',
  precision: 0,
}

const expectRichUnit = async (canvasElement) => {
  await waitFor(() =>
    expect(canvasElement.querySelector('.katex')).not.toBeNull()
  )
  // The number is still formatted, and the unit follows it
  await expect(canvasElement.textContent).toContain('1,250')
  await expect(canvasElement.textContent).not.toContain('$m^3$')
}

export const NumberIconUnitIsRich = {
  ...renderProp(PropNumberIcon, unitIconProp),
  play: async ({ canvasElement }) => expectRichUnit(canvasElement),
}

export const NumberIconCompactUnitIsRich = {
  ...renderProp(PropNumberIconCompact, unitIconProp),
  play: async ({ canvasElement }) => expectRichUnit(canvasElement),
}

export const NumberIconCompactAltUnitIsRich = {
  ...renderProp(PropNumberIconCompactAlt, unitIconProp),
  play: async ({ canvasElement }) => expectRichUnit(canvasElement),
}

export const NumberIconUnitIsPlainByDefault = {
  ...renderProp(PropNumberIcon, { ...unitIconProp, richText: undefined }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.katex')).toBeNull()
    // The unit is shown as it is written, after the number
    await expect(canvasElement.textContent).toContain('1,250 $m^3$/h')
  },
}

export const NumberIconUnitBeforeTheNumberIsRich = {
  ...renderProp(PropNumberIcon, {
    ...unitIconProp,
    unit: '**USD**',
    unitPlacement: 'beforeWithSpace',
  }),
  play: async ({ canvasElement }) => {
    const unit = await within(canvasElement).findByText('USD')
    await expect(unit.tagName).toBe('STRONG')
    // The unit goes before the number, separated by a space
    await expect(unit.parentElement).toHaveTextContent('USD 1,250')
  },
}
