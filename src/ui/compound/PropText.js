import TextInput from './TextInput'

import { forceArray } from '../../utils'

const TextBase = ({
  enabled,
  value,
  readOnly,
  rows,
  placeholder,
  label,
  fullWidth,
  propStyle,
  currentVal,
  multiline,
  sx = [],
  onChange,
}) => (
  <TextInput
    disabled={!enabled}
    sx={[...forceArray(sx), propStyle]}
    {...{ multiline, readOnly, rows, placeholder, label, fullWidth }}
    value={currentVal ?? value}
    onClickAway={(newValue) => {
      if (enabled) onChange(newValue)
    }}
  />
)

const PropTextArea = ({
  // eslint-disable-next-line no-unused-vars
  prop: { key, rows = 4, ...propAttrs },
  currentVal,
  sx = [],
  onChange,
}) => (
  <TextBase multiline {...{ ...propAttrs, currentVal, sx, rows, onChange }} />
)

const PropText = ({
  // eslint-disable-next-line no-unused-vars
  prop: { key, ...propAttrs },
  currentVal,
  sx = [],
  onChange,
}) => <TextBase {...{ ...propAttrs, currentVal, sx, onChange }} />

export { PropText, PropTextArea }
