import { Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import * as R from 'ramda'
import {
  cloneElement,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useSelector } from 'react-redux'
import { FixedSizeList } from 'react-window'

import FetchedIcon from './FetchedIcon'

import { selectSettingsIconUrl } from '../../data/selectors'

export const ListboxPropsContext = createContext({
  getLabel: R.identity,
  getIcon: R.identity,
})

export const EnhancedListbox = forwardRef((props, ref) => {
  const { children, role, ...other } = props
  const itemCount = Array.isArray(children) ? children.length : 0
  const { getLabel, getIcon } = useContext(ListboxPropsContext)
  return (
    <div ref={ref}>
      <div {...other}>
        <FixedSizeList
          role={role}
          height={256}
          width="100%"
          itemSize={48}
          itemCount={itemCount}
          overscanCount={5}
        >
          {({ index, style }) => {
            const child = children[index]
            const option = child.key
            return cloneElement(
              child,
              { style },
              <Stack key={option} component="li" direction="row" spacing={1}>
                <FetchedIcon size={40} iconName={getIcon(option)} />
                <Typography variant="subtitle2">{getLabel(option)}</Typography>
              </Stack>
            )
          }}
        </FixedSizeList>
      </div>
    </div>
  )
})

export const ListboxComponent = forwardRef(
  function ListboxComponent(props, ref) {
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
  }
)

export const useIconDataLoader = (iconUrl, onSuccess, onReject) => {
  const fetchIconList = useCallback(async () => {
    const cache = await caches.open('icon_list')
    const url = `${iconUrl}/icon_list.txt`
    let response = await cache.match(url)
    // add to cache if not found
    if (R.isNil(response)) {
      await cache.add(url)
      response = await cache.match(url)
    }
    return R.pipe(
      R.split('\n'),
      R.reject(R.pipe(R.trim, R.isEmpty))
    )(await response.text())
  }, [iconUrl])

  useEffect(() => {
    fetchIconList().then(onSuccess).catch(onReject)
  }, [fetchIconList, onReject, onSuccess])
}

export default function IconPicker({ onSelect }) {
  const [options, setOptions] = useState([])
  const iconUrl = useSelector(selectSettingsIconUrl)
  useIconDataLoader(iconUrl, setOptions, console.error)
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
