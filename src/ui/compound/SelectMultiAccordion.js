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
import * as R from 'ramda'
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
    bgcolor: 'grey.800',
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
  soloCategory: {
    width: '100%',
    border: 1,
    borderColor: 'grey.600',
  },
}

const SubItem = ({
  item,
  subItem,
  onClose,
  onSelect,
  getSubLabel,
  values,
  index,
  ...props
}) => (
  <MenuItem
    component="div"
    onClick={() => {
      onClose && onClose()
      onSelect && onSelect(item, subItem, index)
    }}
    selected={R.equals(R.propOr(false, item, values), subItem)}
    {...props}
  >
    {getSubLabel(item, subItem)}
  </MenuItem>
)

const CategoryItem = ({
  id: item,
  layoutDirection,
  subItems,
  getLabel,
  onSelect,
  getSubLabel,
  values,
  index,
}) => {
  return (
    <MenuItem key={item} component="div">
      {subItems.length > 1 ? (
        <Accordion
          key={item}
          sx={styles.accordionRoot}
          onChange={(event) => {
            // Prevents other Select components from capturing
            // the event when expanding/collapsing the accordion
            event.stopPropagation()
          }}
        >
          <AccordionSummary
            expandIcon={<FetchedIcon iconName="md/MdExpandMore" />}
          >
            <Typography sx={styles.heading}>{getLabel(item)}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={styles.getOrientation(layoutDirection)}>
            {subItems.map((subItem, idx) => (
              <SubItem
                key={idx}
                {...{ item, subItem, index, onSelect, getSubLabel, values }}
              />
            ))}
          </AccordionDetails>
        </Accordion>
      ) : (
        <SubItem
          sx={styles.soloCategory}
          {...{ item, getSubLabel, onSelect, values, index }}
          subItem={subItems[0]}
        />
      )}
    </MenuItem>
  )
}

/**
 * A hybrid of the Select and Accordion components.
 *
 * @param disabled
 * @param values
 * @param header
 * @param itemGroups
 * @param getLabel
 * @param getSubLabel
 * @param onClickAway
 * @param onSelect
 * @param props
 * @private
 */
const SelectMultiAccordion = ({
  disabled,
  values,
  header,
  itemGroups = {},
  groupLabel = 'group',
  getLabel = (label) => label,
  getSubLabel = (label) => label,
  onClickAway = () => {},
  onSelect = () => {},
  ...props
} = {}) => {
  const [open, setOpen] = useState(false)

  return (
    <Select
      {...{ disabled, open, ...props }}
      sx={styles.select}
      name="cave-select-multi-accordion"
      displayEmpty
      value={values}
      onOpen={() => {
        setOpen(true)
      }}
      onClose={(event) => {
        onClickAway(event)
        setOpen(false)
      }}
      renderValue={R.always(header)}
    >
      {header && (
        <MenuItem
          value=""
          onClick={() => {
            setOpen(false)
          }}
        >
          <OverflowText text={header} />
        </MenuItem>
      )}
      {/* HACK: Drop warning for non-existing value */}
      {values !== '' && <MenuItem value={values} sx={{ display: 'none' }} />}
      {/* Render item groups */}
      {Object.keys(itemGroups).map((grouping, index) =>
        // Render items per group
        grouping !== 'null' && grouping !== 'undefined' && grouping != null ? (
          // `grouping != null` is a sanity check
          <MenuItem key={index}>
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
                expandIcon={<FetchedIcon iconName="md/MdOutlineChevronRight" />}
              >
                <Typography sx={styles.heading}>
                  {`${grouping} `}
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    ({groupLabel})
                  </Box>
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {itemGroups[grouping].map((item) => (
                  <CategoryItem
                    {...item}
                    key={item.id}
                    {...{ getLabel, getSubLabel, onSelect, values, index }}
                  />
                ))}
              </AccordionDetails>
            </Accordion>
          </MenuItem>
        ) : (
          <Box key={index}>
            {itemGroups[grouping].map((item) => (
              <CategoryItem
                {...item}
                key={item.id}
                {...{ getLabel, getSubLabel, onSelect, values }}
              />
            ))}
          </Box>
        )
      )}
    </Select>
  )
}
SelectMultiAccordion.propTypes = {
  disabled: PropTypes.bool,
  values: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  header: PropTypes.string,
  itemGroups: PropTypes.object,
  getLabel: PropTypes.func,
  getSubLabel: PropTypes.func,
  onClickAway: PropTypes.func,
  onSelect: PropTypes.func,
}

export default memo(SelectMultiAccordion)
