import { InputAdornment, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import * as R from 'ramda'
import {
  cloneElement,
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
} from 'react'
import { FixedSizeList } from 'react-window'

import FetchedIcon from './FetchedIcon'

import { fetchResource } from '../../utils'

export const ListboxPropsContext = createContext({
  getLabel: R.identity,
  getIcon: R.identity,
  getDisabled: R.F,
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
              <Stack key={option} direction="row" spacing={1}>
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

export const useIconDataLoader = (iconUrl, onSuccess, onReject) => {
  const fetchIconList = useCallback(async () => {
    const url = `${iconUrl}/icon_list.txt`
    const rawIconsList = await fetchResource({
      url,
      cacheName: 'icon_list',
      rawBody: true,
    })
    const iconsList = await rawIconsList.text()
    return R.pipe(R.split('\n'), R.reject(R.pipe(R.trim, R.isEmpty)))(iconsList)
  }, [iconUrl])

  useEffect(() => {
    fetchIconList().then(onSuccess).catch(onReject)
  }, [fetchIconList, onReject, onSuccess])
}

const ShapePicker = ({
  label,
  value,
  options,
  color,
  groupBy,
  getDisabled,
  getIcon,
  getLabel,
  ListboxComponent,
  onChange,
}) => (
  <ListboxPropsContext.Provider value={{ getDisabled, getLabel, getIcon }}>
    <Autocomplete
      disableListWrap
      clearIcon={false}
      sx={{ p: 1 }}
      {...{ options, value, ListboxComponent, groupBy, onChange }}
      renderInput={({ InputProps, ...params }) => (
        <TextField
          fullWidth
          focused
          autoFocus
          {...{ label, color, ...params }}
          slotProps={{
            input: {
              ...InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <FetchedIcon size={24} iconName={getIcon(value)} />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
      // renderOption={(props, option, state) => [props, option, state.index]}
      {...(ListboxComponent == null && {
        renderOption: (props, option) => {
          const { key, ...optionProps } = props
          return (
            <Stack
              key={key}
              component="li"
              direction="row"
              spacing={1}
              {...optionProps}
            >
              <FetchedIcon size={24} iconName={getIcon(option)} />
              <Typography variant="subtitle2">
                {getLabel(option) ?? option}
              </Typography>
            </Stack>
          )
        },
        getOptionDisabled: getDisabled,
        getOptionLabel: (option) => getLabel(option) ?? option,
      })}
    />
  </ListboxPropsContext.Provider>
)

export default memo(ShapePicker)
