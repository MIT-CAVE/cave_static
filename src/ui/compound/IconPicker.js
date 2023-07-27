import { Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import * as R from 'ramda'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { List } from 'react-virtualized'

import FetchedIcon from './FetchedIcon'

import { selectSettingsIconUrl } from '../../data/selectors'

const ListboxComponent = React.forwardRef(function ListboxComponent(
  props,
  ref
) {
  const { children, role, ...other } = props
  const itemCount = Array.isArray(children) ? children.length : 0
  const itemSize = 79

  return (
    <div ref={ref}>
      <div {...other}>
        <List
          height={250}
          width={300}
          rowHeight={itemSize}
          overscanCount={5}
          rowCount={itemCount}
          rowRenderer={(props) => {
            const child = children[props.index]
            return React.cloneElement(
              child,
              {
                style: props.style,
              },
              <>
                <FetchedIcon size={52} iconName={child.key} />
                <Typography sx={{ mx: 'auto' }} align="right">
                  {child.key}
                </Typography>
              </>
            )
          }}
          role={role}
        />
      </div>
    </div>
  )
})

export default function IconPicker({ onSelect }) {
  const [options, setOptions] = useState([])

  const iconUrl = useSelector(selectSettingsIconUrl)
  console.log(iconUrl)

  useEffect(() => {
    const fetchIconList = async () => {
      setOptions(
        R.split('\n')(await (await fetch(`${iconUrl}/icon_list.txt`)).text())
      )
    }
    fetchIconList().catch(console.error)
  }, [iconUrl])
  return (
    <Autocomplete
      id="virtualize-demo"
      style={{ width: 300 }}
      disableListWrap
      ListboxComponent={ListboxComponent}
      options={options}
      open={true}
      onChange={(_, value) => onSelect(value)}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label="Search to replace the icon"
          fullWidth
        />
      )}
    />
  )
}
