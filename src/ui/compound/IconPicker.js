import { Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import * as R from 'ramda'
import { cloneElement, forwardRef, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { FixedSizeList } from 'react-window'

import FetchedIcon from './FetchedIcon'

import { selectSettingsIconUrl } from '../../data/selectors'

const ListboxComponent = forwardRef(function ListboxComponent(props, ref) {
  const { children, role, ...other } = props
  const itemCount = Array.isArray(children) ? children.length : 0
  const itemSize = 79

  return (
    <div ref={ref}>
      <div {...other}>
        <FixedSizeList
          height={250}
          width={300}
          itemSize={itemSize}
          itemCount={itemCount}
          overscanCount={5}
          role={role}
        >
          {(props) => {
            const child = children[props.index]
            return cloneElement(
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
        </FixedSizeList>
      </div>
    </div>
  )
})

export default function IconPicker({ onSelect }) {
  const [options, setOptions] = useState([])

  const iconUrl = useSelector(selectSettingsIconUrl)

  useEffect(() => {
    const fetchIconList = async () => {
      const cache = await caches.open('icon_list')
      const url = `${iconUrl}/icon_list.txt`
      let response = await cache.match(url)
      // add to cache if not found
      if (R.isNil(response)) {
        await cache.add(url)
        response = await cache.match(url)
      }
      setOptions(R.split('\n')(await response.text()))
    }
    fetchIconList().catch(console.error)
  }, [iconUrl])
  return (
    <Autocomplete
      style={{ width: 300 }}
      disableListWrap
      ListboxComponent={ListboxComponent}
      options={options}
      onChange={(_, value) => value != null && onSelect(value)}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          autoFocus
          variant="outlined"
          label="Search to replace the icon"
        />
      )}
    />
  )
}
