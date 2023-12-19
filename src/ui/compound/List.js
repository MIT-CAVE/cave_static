import {
  Checkbox,
  List as MuiList,
  ListItemIcon,
  ListItem,
  ListSubheader,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState } from 'react'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { forceArray, forcePath } from '../../utils'

const styles = {
  icon: {
    ml: 1,
    mr: 2,
    color: 'text.primary',
    minWidth: 0,
  },
  root: {
    width: '100%',
    height: '250px',
    overflow: 'auto',
    bgcolor: 'background.paper',
  },
}

/**
 * A component used to select values from a list of items.
 * @private
 */
const List = ({
  optionsList: items,
  value: selectedValue,
  header,
  disabled,
  sx = [],
  getLabel = (label) => label,
  onSelect = () => {},
  ...props
} = {}) => {
  const [selected, setSelected] = useState(forcePath(selectedValue))
  return (
    <MuiList
      {...{ disabled, ...props }}
      sx={[styles.root, ...forceArray(sx)]}
      dense
      value={selected.length > 0 ? selected : [header]}
      subheader={<ListSubheader>{header}</ListSubheader>}
    >
      {items.map((item, index) => {
        const { label, value: itemValue, iconName } = item
        const value = itemValue || item
        return (
          <ListItem
            key={index}
            {...{ value }}
            onClick={() => {
              const newVal = R.includes(value, selected)
                ? R.without([value], selected)
                : R.concat([value], selected)
              setSelected(newVal)
              onSelect && onSelect(newVal)
            }}
          >
            <Checkbox checked={R.includes(value)(selected)} />
            {iconName && (
              <ListItemIcon sx={styles.icon}>
                <FetchedIcon {...{ iconName }} size={24} />
              </ListItemIcon>
            )}
            <OverflowText text={getLabel(label || value)} />
          </ListItem>
        )
      })}
    </MuiList>
  )
}
List.propTypes = {
  optionsList: PropTypes.array,
  value: PropTypes.any,
  header: PropTypes.string,
  disabled: PropTypes.bool,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  getLabel: PropTypes.func,
  onSelect: PropTypes.func,
  children: PropTypes.node,
}

export default List
