import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useState } from 'react'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

const styles = {
  select: {
    borderRadius: 0,
    minWidth: 0,
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'normal !important',
    },
  },
  accordionRoot: {
    width: '100%',
  },
  accordionGroup: {
    bgcolor: (theme) =>
      theme.palette.mode === 'dark' ? 'grey.800' : 'grey.300',
  },
  accordionSummary: {
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
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
  },
}

/**
 * A hybrid of the Select and Accordion components.
 *
 * @param disabled
 * @param values
 * @param placeholder
 * @param subItems
 * @param itemGroups
 * @param getLabel
 * @param getSubLabel
 * @param onClickAway
 * @param onSelect
 * @param props
 * @private
 */
const SelectAccordion = ({
  disabled,
  values,
  placeholder,
  subItems,
  itemGroups = {},
  groupLabel = 'group',
  getLabel = (label) => label,
  getSubLabel = (label) => label,
  onClickAway = () => {},
  onSelect = () => {},
  ...props
} = {}) => {
  const [open, setOpen] = useState(false)

  const CategoryItems = ({ item, layoutDirection }) => {
    return (
      <Accordion
        key={item}
        // defaultExpanded
        sx={styles.accordionRoot}
        onChange={(event) => {
          // Prevents other Select components from capturing
          // the event when expanding/collapsing the accordion
          event.stopPropagation()
        }}
      >
        <AccordionSummary expandIcon={<FetchedIcon iconName="MdExpandMore" />}>
          <Typography sx={styles.heading}>{getLabel(item)}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={styles.getOrientation(layoutDirection)}>
          {subItems[item].map((subItem, idx) => (
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
    )
  }

  return (
    <Select
      {...{ disabled, open, ...props }}
      sx={styles.select}
      displayEmpty
      value={values}
      onOpen={() => {
        setOpen(true)
      }}
      onClose={(event) => {
        onClickAway(event)
        setOpen(false)
      }}
      // Display both item and sub-item values
      {...(values !== '' && {
        renderValue: (value) => (
          <OverflowText
            text={`${getLabel(value[0])} \u279D ${getSubLabel(
              value[0],
              value[1]
            )}`}
          />
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
          <OverflowText text={placeholder} />
        </MenuItem>
      )}
      {/* HACK: Drop warning for non-existing value */}
      {values !== '' && <MenuItem value={values} sx={{ display: 'none' }} />}
      {/* Render item groups */}
      {Object.keys(itemGroups).map((grouping, index) => {
        const grouped = grouping !== 'null' && grouping != null // `grouping != null` is a sanity check
        const currentItems = itemGroups[grouping] || []

        // Render items per group
        return (
          <MenuItem key={index}>
            {grouped ? (
              <Accordion
                // defaultExpanded
                sx={[styles.accordionRoot, styles.accordionGroup]}
                onChange={(event) => {
                  // Prevents other Select components from capturing
                  // the event when expanding/collapsing the accordion
                  event.stopPropagation()
                }}
              >
                <AccordionSummary
                  sx={styles.accordionSummary}
                  expandIcon={<FetchedIcon iconName="MdOutlineChevronRight" />}
                >
                  <Typography sx={styles.heading}>
                    {`${grouping} `}
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      ({groupLabel})
                    </Box>
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {currentItems.map(({ id: item, layoutDirection }) => (
                    <CategoryItems {...{ item, layoutDirection }} />
                  ))}
                </AccordionDetails>
              </Accordion>
            ) : (
              <CategoryItems
                item={currentItems[index].id}
                layoutDirection={currentItems[index].layoutDirection}
              />
            )}
          </MenuItem>
        )
      })}
    </Select>
  )
}
SelectAccordion.propTypes = {
  disabled: PropTypes.bool,
  values: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  placeholder: PropTypes.string,
  itemGroups: PropTypes.object,
  subItems: PropTypes.object,
  getLabel: PropTypes.func,
  getSubLabel: PropTypes.func,
  onClickAway: PropTypes.func,
  onSelect: PropTypes.func,
}

export default memo(SelectAccordion)
