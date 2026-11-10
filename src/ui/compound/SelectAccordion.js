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
import { MdExpandMore } from 'react-icons/md'

import OverflowText from './OverflowText'
import RichLabel from './RichLabel'

import { labelText } from '../../utils/richText'

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

/**
 * A hybrid of the Select and Accordion components.
 *
 * @param disabled
 * @param values
 * @param placeholder
 * @param itemGroups
 * @param getLabel
 * @param getSubLabel
 * @param richText - Whether the labels are rich text. It can be a function of
 * an item (and its sub-item for the sub labels), when it depends on them
 * @param onClickAway
 * @param onSelect
 * @param props
 * @private
 */
const SelectAccordion = ({
  disabled,
  values,
  placeholder,
  itemGroups = {},
  groupLabel = 'group',
  open,
  onOpen,
  onClose,
  getLabel = (label) => label,
  getSubLabel = (label) => label,
  richText,
  onClickAway = () => {},
  onSelect = () => {},
  sx,
  ...props
} = {}) => {
  const [openState, setOpenState] = useState(false)

  const controlled = open != null
  const isRich = (item, subItem) =>
    (typeof richText === 'function' ? richText(item, subItem) : richText) ===
    true

  const SubItem = ({ item, subItem, ...props }) => (
    <MenuItem
      component="div"
      onClick={() => {
        onSelect && onSelect(item, subItem)
        setOpenState(false)
      }}
      {...props}
    >
      <RichLabel
        text={getSubLabel(item, subItem)}
        rich={isRich(item, subItem)}
      />
    </MenuItem>
  )

  const CategoryItems = ({ items }) =>
    items.map(({ id: item, layoutDirection, subItems }) => (
      <MenuItem key={item} component="div">
        {subItems.length > 1 ? (
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
            <AccordionSummary expandIcon={<MdExpandMore />}>
              <Typography sx={styles.heading}>
                <RichLabel text={getLabel(item)} rich={isRich(item)} />
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={styles.getOrientation(layoutDirection)}>
              {subItems.map((subItem, idx) => (
                <SubItem key={idx} {...{ item, subItem }} />
              ))}
            </AccordionDetails>
          </Accordion>
        ) : (
          <SubItem
            sx={styles.soloCategory}
            {...{ item }}
            subItem={subItems[0]}
          />
        )}
      </MenuItem>
    ))

  return (
    <Select
      {...{ disabled, ...props }}
      sx={[styles.select, sx]}
      name="cave-select-accordion"
      displayEmpty
      value={values}
      open={controlled ? open : openState}
      onOpen={(event) => {
        controlled ? onOpen(event) : setOpenState(true)
      }}
      onClose={(event) => {
        if (controlled) {
          event.stopPropagation()
          onClose(event)
        } else {
          onClickAway(event)
          setOpenState(false)
        }
      }}
      // Display both item and sub-item values
      {...(values !== '' && {
        renderValue: (value) => (
          <OverflowText
            text={`${labelText(getLabel(value[0]), isRich(value[0]))} \u279D ${labelText(
              getSubLabel(value[0], value[1]),
              isRich(value[0], value[1])
            )}`}
          >
            <RichLabel text={getLabel(value[0])} rich={isRich(value[0])} />
            {' \u279D '}
            <RichLabel
              text={getSubLabel(value[0], value[1])}
              rich={isRich(value[0], value[1])}
            />
          </OverflowText>
        ),
      })}
    >
      {placeholder && (
        <MenuItem
          value=""
          onClick={(event) => {
            event.stopPropagation()
            if (controlled) {
              onClose(event)
            } else {
              onSelect && onSelect(null, null)
              setOpenState(false)
            }
          }}
        >
          <OverflowText text={placeholder} />
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
              <AccordionSummary expandIcon={<MdExpandMore />}>
                <Typography sx={styles.heading}>
                  {`${grouping} `}
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    ({groupLabel})
                  </Box>
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CategoryItems items={itemGroups[grouping]} />
              </AccordionDetails>
            </Accordion>
          </MenuItem>
        ) : (
          <Box key={index}>
            <CategoryItems items={itemGroups[grouping]} />
          </Box>
        )
      )}
    </Select>
  )
}
SelectAccordion.propTypes = {
  disabled: PropTypes.bool,
  values: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  placeholder: PropTypes.string,
  open: PropTypes.bool,
  itemGroups: PropTypes.object,
  getLabel: PropTypes.func,
  getSubLabel: PropTypes.func,
  richText: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  onClickAway: PropTypes.func,
  onSelect: PropTypes.func,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
}

export default memo(SelectAccordion)
