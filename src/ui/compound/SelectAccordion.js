/** @jsxImportSource @emotion/react */
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'
import React, { memo } from 'react'
import { MdArrowDownward, MdExpandMore } from 'react-icons/md'

const useStyles = makeStyles((theme) => ({
  formControl: {
    flexDirection: 'initial',
    margin: theme.spacing(1),
  },
  select: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'normal !important',
  },
  accordionRoot: {
    width: '100%',
  },
  accordion: {
    position: 'absolute',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
  },
}))

/**
 * A hybrid of the Select and Accordion components.
 *
 * @param className
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
  className,
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
  const classes = useStyles()

  return (
    <FormControl variant="outlined" className={classes.formControl}>
      <Select
        {...{ className, disabled, open, ...props }}
        classes={{ select: classes.select }}
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
            <div className={classes.item}>
              {getLabel(value[0])}
              <MdArrowDownward fontSize="small" />
              {getSubLabel(value[0], value[1])}
            </div>
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
        {values !== '' && <MenuItem value={values} css={{ display: 'none' }} />}

        {Object.keys(items).map((item, index) => {
          return (
            <MenuItem key={index}>
              <Accordion
                // defaultExpanded
                className={classes.accordionRoot}
                onChange={(event) =>
                  // Prevents other Select components from capturing
                  // the event when expanding/collapsing the accordion
                  event.stopPropagation()
                }
              >
                <AccordionSummary expandIcon={<MdExpandMore />}>
                  <Typography className={classes.heading}>
                    {getLabel(item)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  css={{
                    flexDirection:
                      subItemLayouts[index] === 'horizontal' ? 'row' : 'column',
                  }}
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
          )
        })}
      </Select>
    </FormControl>
  )
}
SelectAccordion.propTypes = {
  className: PropTypes.string,
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
