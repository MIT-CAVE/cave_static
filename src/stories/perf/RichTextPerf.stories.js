import { Fragment } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import OverflowText from '../../ui/compound/OverflowText'
import PropContainer from '../../ui/compound/PropContainer'
import PropRadio from '../../ui/compound/PropRadio'
import RichLabel, {
  MAX_CACHE_SIZE,
  getRichNode,
} from '../../ui/compound/RichLabel'
import { mayContainRichText } from '../../utils/richText'

// Manual benchmark for rich text labels. Open it in Storybook or remove the
// `'!test'` tag to run it with Vitest. It logs a `PERF_RESULTS` line.
const richTextPerfStories = {
  title: 'Perf/RichText',
  tags: ['!test'],
}

export default richTextPerfStories

// The previous implementation: a `<ReactMarkdown>` element that parses its
// text again on every mount.
const OldRichLabel = ({ text }) =>
  mayContainRichText(text) ? (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{ p: Fragment }}
      unwrapDisallowed
    >
      {text}
    </ReactMarkdown>
  ) : (
    text
  )

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

// Mounts `element` into a fresh root `runs` times. The first mount is "cold"
// (nothing cached yet), the median of the others is "warm".
const measure = (getElement, runs = 9) => {
  const times = []
  for (let i = 0; i < runs; i++) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const start = performance.now()
    flushSync(() => root.render(getElement()))
    times.push(performance.now() - start)
    root.unmount()
    container.remove()
  }
  return {
    coldMs: Math.round(times[0]),
    warmMs: Math.round(median(times.slice(1))),
  }
}

const range = (n) => Array.from({ length: n }, (_, i) => i)

const PROPS = 200
const OPTIONS = 1000

const propsLayout =
  ({ richText, title, subtitle, unit }) =>
  () => (
    <div>
      {range(PROPS).map((i) => (
        <PropContainer
          key={i}
          title={title(i)}
          subtitle={subtitle(i)}
          unit={unit}
          {...{ richText }}
        >
          <span />
        </PropContainer>
      ))}
    </div>
  )

const radioOptions = (name) =>
  Object.fromEntries(range(OPTIONS).map((i) => [`o${i}`, { name: name(i) }]))

const radio =
  ({ richText, name }) =>
  () => (
    <PropRadio
      prop={{ enabled: true, richText, options: radioOptions(name) }}
      currentVal={['o0']}
      onChange={() => {}}
    />
  )

const labels = (Label, count) => () => (
  <div>
    {range(count).map((i) => (
      <OverflowText key={i} text={`Name ${i}`}>
        <Label text={`**Bold** name ${i}`} />
      </OverflowText>
    ))}
  </div>
)

// Warm up the JIT with the plain layout so the first scenario isn't penalised
const warmUp = () => {
  measure(propsLayout({ title: (i) => `Name ${i}`, subtitle: () => '' }), 3)
  measure(radio({ name: (i) => `Option ${i}` }), 2)
}

const runBenchmark = () => ({
  [`${PROPS} props, plain labels (flag unset)`]: measure(
    propsLayout({
      title: (i) => `Name ${i}`,
      subtitle: (i) => `Sub ${i}`,
      unit: 'units',
    })
  ),
  [`${PROPS} props, richText, plain-text labels (fast path)`]: measure(
    propsLayout({
      richText: true,
      title: (i) => `Name ${i}`,
      subtitle: (i) => `Sub ${i}`,
      unit: 'units',
    })
  ),
  [`${PROPS} props, richText, markdown labels (unique)`]: measure(
    propsLayout({
      richText: true,
      title: (i) => `**Bold** name ${i}`,
      subtitle: (i) => `_Sub_ ${i}`,
      unit: '$m^2$',
    })
  ),
  [`${PROPS} props, richText, markdown labels (20 distinct)`]: measure(
    propsLayout({
      richText: true,
      title: (i) => `**Bold** group ${i % 20}`,
      subtitle: (i) => `_Sub_ ${i % 20}`,
      unit: '$m^2$',
    })
  ),
  [`${OPTIONS}-option radio, plain`]: measure(
    radio({ name: (i) => `Option ${i}` }),
    5
  ),
  [`${OPTIONS}-option radio, richText, plain-text names`]: measure(
    radio({ richText: true, name: (i) => `Option ${i}` }),
    5
  ),
  [`${OPTIONS}-option radio, richText, markdown names`]: measure(
    radio({ richText: true, name: (i) => `**Option** ${i}` }),
    5
  ),
  [`${PROPS} labels in OverflowText, previous implementation`]: measure(
    labels(OldRichLabel, PROPS)
  ),
  [`${PROPS} labels in OverflowText, parse-once cache`]: measure(
    labels(RichLabel, PROPS)
  ),
})

// Approximate heap used by a full cache (Chromium only, and not exact)
const measureCacheHeap = (makeText) => {
  // eslint-disable-next-line compat/compat -- Chromium only, used by a manual benchmark
  const heap = () => performance.memory?.usedJSHeapSize
  if (heap() == null) return null
  const before = heap()
  const nodes = range(MAX_CACHE_SIZE).map((i) => getRichNode(makeText(i)))
  const after = heap()
  return {
    entries: nodes.length,
    totalKB: Math.round((after - before) / 1024),
    perEntryBytes: Math.round((after - before) / nodes.length),
  }
}

export const Benchmark = {
  render: () => (
    <div>Run the play function to see the results in the console</div>
  ),
  play: async () => {
    warmUp()
    const results = {
      ...runBenchmark(),
      'cache heap, markdown labels': measureCacheHeap(
        (i) => `**Bold** label ${i} with _more_ text`
      ),
      'cache heap, math labels': measureCacheHeap(
        (i) => `Area ${i} in $m^2$ and $x_${i}$`
      ),
    }
    console.warn(`PERF_RESULTS ${JSON.stringify(results, null, 2)}`)
  },
}
