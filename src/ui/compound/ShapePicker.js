import {
  Autocomplete,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
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
import { List } from 'react-window'

import FetchedIcon from './FetchedIcon'

import { fetchResource } from '../../utils'

export const ListboxPropsContext = createContext({
  getLabel: R.identity,
  getIcon: R.identity,
  getDisabled: R.F,
})

const ListRowComponent = ({ index, style, children }) => {
  const { getLabel, getIcon } = useContext(ListboxPropsContext)
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
}

export const EnhancedListbox = forwardRef((props, ref) => {
  const { children, role, ...other } = props
  const rowCount = Array.isArray(children) ? children.length : 0
  return (
    <div ref={ref}>
      <div {...other}>
        <List
          rowHeight={48}
          overscanCount={5}
          rowProps={{ children }}
          {...{ role, rowCount }}
          style={{ height: '256px', width: '100%' }}
          rowComponent={ListRowComponent}
        />
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
