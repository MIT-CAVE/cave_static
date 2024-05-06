import {
  Autocomplete,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import { IoMdCloseCircle } from 'react-icons/io'
import {
  MdAddCircle,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from 'react-icons/md'

import OverflowText from './OverflowText'
import SelectAccordion from './SelectAccordion'

const styles = {
  root: {
    '.MuiAutocomplete-inputRoot': {
      borderRadius: 0,
      flex: '1 1 auto',
      flexWrap: 'nowrap',
    },
    '.MuiAutocomplete-input': {
      p: '0 !important',
      minWidth: '0 !important',
    },
    '.MuiFormControl-root': {
      height: '100%',
    },
  },
}

const SelectAccordionList = ({
  disabled,
  values,
  placeholder,
  itemGroups = {},
  getLabel = R.identity,
  getSubLabel = R.identity,
  onClickAway = R.identity,
  onAddGroup,
  onChangeGroupIndex,
  onDeleteGroup,
  onSelectGroup,
  ...props
} = {}) => {
  const [open, setOpen] = useState(false)
  const [subOpen, setSubOpen] = useState([])

  const options = useMemo(() => R.pipe(R.length, R.range(0))(values), [values])

  const getTagLabel = useCallback(
    (value) =>
      `${getLabel(value[0])} \u279D ${getSubLabel(value[0], value[1])}`,
    [getLabel, getSubLabel]
  )

  return (
    <Autocomplete
      {...{ disabled, open, options, ...props }}
      sx={styles.root}
      multiple
      fullWidth
      disablePortal
      disableListWrap
      disableClearable
      disableCloseOnSelect
      noOptionsText="No Groups"
      value={values}
      getOptionLabel={R.toString}
      isOptionEqualToValue={(index, value) => R.equals(value)(values[index])}
      onOpen={() => {
        setOpen(true)
      }}
      // // BUG: This one triggers before `onOpen`'s `setSubOpen` finishes
      // onClose={(event) => {
      //   if (R.includes(true)(subOpen)) return
      //   onClickAway(event)
      //   setOpen(false)
      // }}
      renderOption={(props, optionIndex) => {
        const { key, ...other } = R.dissoc('aria-selected')(props)
        const isLast = optionIndex === values.length - 1
        return (
          <Fragment key={key}>
            <li {...other}>
              <SelectAccordion
                {...{ itemGroups, getLabel, getSubLabel }}
                fullWidth
                placeholder="Group By"
                values={R.when(
                  R.any(R.isNil),
                  R.always('')
                )(values[optionIndex])}
                open={subOpen[optionIndex] ?? false}
                onOpen={() => {
                  setSubOpen(R.assoc(optionIndex, true))
                }}
                onClose={(event) => {
                  setSubOpen(R.assoc(optionIndex, false))
                  onClickAway(event)
                  setOpen(false)
                }}
                onSelect={onSelectGroup(optionIndex)}
              />
              {values.length > 1 && (
                <Stack direction="column" ml={1} spacing={0.5}>
                  <IconButton
                    size="small"
                    disabled={optionIndex < 1}
                    onClick={() => {
                      onChangeGroupIndex(optionIndex, optionIndex - 1)
                    }}
                  >
                    <MdKeyboardArrowUp />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={isLast}
                    onClick={() => {
                      onChangeGroupIndex(optionIndex, optionIndex + 1)
                    }}
                  >
                    <MdKeyboardArrowDown />
                  </IconButton>
                </Stack>
              )}
              <IconButton
                size="small"
                sx={{ ml: 1 }}
                onClick={() => {
                  onDeleteGroup(optionIndex)
                }}
              >
                <IoMdCloseCircle />
              </IconButton>
            </li>
            {!isLast && <Divider component="li" sx={{ opacity: 0.6 }} />}
          </Fragment>
        )
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...props } = getTagProps({ index })
          const undefGroup = option[0] == null
          return (
            <Chip
              key={key}
              {...props}
              variant={undefGroup ? 'filled' : 'outlined'}
              color={undefGroup ? 'default' : 'primary'}
              label={undefGroup ? 'All' : getTagLabel(option)}
              onDelete={() => {
                onDeleteGroup(index)
              }}
            />
          )
        })
      }
      renderInput={(params) => {
        const { InputProps, inputProps, ...other } = params
        // HACK: This workaround ensures proper marqueeing of overflowing tags since tag elements
        // rendered as part of the `startAdornment` prop of a MUI `InputBase` component.
        return (
          <TextField
            {...other}
            InputProps={{
              ...InputProps,
              startAdornment: (
                <>
                  <OverflowText>
                    {InputProps.startAdornment ?? placeholder}
                  </OverflowText>
                  <IconButton
                    size="small"
                    sx={{ ml: 0.5 }}
                    onClick={onAddGroup}
                  >
                    <MdAddCircle />
                  </IconButton>
                </>
              ),
            }}
            inputProps={{
              ...inputProps,
              readOnly: true,
            }}
          />
        )
      }}
    />
  )
}
SelectAccordionList.propTypes = {
  disabled: PropTypes.bool,
  values: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  header: PropTypes.string,
  itemGroups: PropTypes.object,
  getLabel: PropTypes.func,
  getSubLabel: PropTypes.func,
  onClickAway: PropTypes.func,
  onAddGroup: PropTypes.func,
  onChangeGroupIndex: PropTypes.func,
  onDeleteGroup: PropTypes.func,
  onSelectGroup: PropTypes.func,
}

export default memo(SelectAccordionList)
