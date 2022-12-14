import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import PropTypes from 'prop-types'
import React, { memo } from 'react'
import { MdArrowDownward, MdExpandMore } from 'react-icons/md'

const styles = {
  formControl: {
    flexDirection: 'initial',
    m: 1,
  },
  select: {
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'normal !important',
    },
  },
  accordionRoot: {
    width: '100%',
  },
  getOrientation: (orientation) => ({
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
  }),
  heading: {
    fontSize: (theme) => theme.typography.pxToRem(15),
    fontWeight: 'typography.fontWeightRegular',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
  },
}

/**
 * A hybrid of the Select and Accordion components.
 *
 * @param {Array} items
 * @param values
 * @param placeholder
 * @param subItemLayouts
 * @param disabled
 * @param getLabel
 * @param getSubLabel
 * @param onClickAway
 * @param onSelect
 * @param props
 * @private
 */
const SelectAccordion = ({
  items,
  values,
  placeholder,
  subItemLayouts = [],
  disabled,
  getLabel = (label) => label,
  getSubLabel = (label) => label,
  onClickAway = () => {},
  onSelect = () => {},
  ...props
} = {}) => {
  const [open, setOpen] = React.useState(false)
  return (
    <FormControl variant="outlined" sx={styles.formControl}>
      <Select
        {...{ disabled, open, ...props }}
        sx={styles.select}
        displayEmpty
        value={values}
        onOpen={() => setOpen(true)}
        onClose={(event) => {
          onClickAway(event)
          setOpen(false)
        }}
        // Display both item and sub-item values
        {...(values !== '' && {
          renderValue: (value) => (
            <Box sx={styles.item}>
              {getLabel(value[0])}
              <MdArrowDownward fontSize="small" />
              {getSubLabel(value[0], value[1])}
            </Box>
          ),
        })}
      >
        {placeholder && (
          <MenuItem
            value=""
            onClick={() => {
              onSelect && onSelect(null, null)
              setOpen(false)
            }}
          >
            {placeholder}
          </MenuItem>
        )}

        {/* HACK: Drop warning for non-existing value */}
        {values !== '' && <MenuItem value={values} sx={{ display: 'none' }} />}

        {Object.keys(items).map((item, index) => (
          <MenuItem key={index}>
            <Accordion
              // defaultExpanded
              sx={styles.accordionRoot}
              onChange={(event) =>
                // Prevents other Select components from capturing
                // the event when expanding/collapsing the accordion
                event.stopPropagation()
              }
            >
              <AccordionSummary expandIcon={<MdExpandMore />}>
                <Typography sx={styles.heading}>{getLabel(item)}</Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={styles.getOrientation(subItemLayouts[index])}
              >
                {items[item].map((subItem, idx) => (
                  <MenuItem
                    key={idx}
                    component="div"
                    onClick={() => {
                      onSelect && onSelect(item, subItem)
                      setOpen(false)
                    }}
                  >
                    {getSubLabel(item, subItem)}
                  </MenuItem>
                ))}
              </AccordionDetails>
            </Accordion>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
SelectAccordion.propTypes = {
  items: PropTypes.object,
  values: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  placeholder: PropTypes.string,
  subItemLayouts: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  getLabel: PropTypes.func,
  getSubLabel: PropTypes.func,
  onClickAway: PropTypes.func,
  onSelect: PropTypes.func,
}

export default memo(SelectAccordion)
