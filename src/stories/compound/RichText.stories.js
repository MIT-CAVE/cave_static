import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import ReactMarkdown from 'react-markdown'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

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
import PropRadio from '../../ui/compound/PropRadio'
import { PropText } from '../../ui/compound/PropText'
import {
  PropToggleButton,
  PropToggleCheckbox,
  PropToggleSwitch,
} from '../../ui/compound/PropToggle'
import RichLabel, {
  MAX_CACHE_SIZE,
  MAX_CACHE_WEIGHT,
  getRichNode,
} from '../../ui/compound/RichLabel'

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
