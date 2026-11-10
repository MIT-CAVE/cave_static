import {
  Autocomplete,
  Box,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { cloneElement, createContext, forwardRef, memo, useEffect } from 'react'
import { List } from 'react-window'

import FetchedIcon from './FetchedIcon'

import { DEFAULT_ICON_URL } from '../../utils/constants'

import { fetchResource } from '../../utils'

export const ListboxPropsContext = createContext({
  getLabel: R.identity,
  getIcon: R.identity,
  getDisabled: R.F,
})

const ListRowComponent = ({ index, style, children }) => {
  const child = children[index]
  if (!child) return null
  return cloneElement(child, {
    style: {
      ...child.props?.style,
      ...style,
      boxSizing: 'border-box',
    },
  })
}

ListRowComponent.propTypes = {
  children: PropTypes.array,
  index: PropTypes.number,
  style: PropTypes.object,
}

export const EnhancedListbox = forwardRef((props, ref) => {
  const { children, ...other } = R.dissoc('ownerState', props)
  const rowCount = Array.isArray(children) ? children.length : 0
  return (
    <div ref={ref} {...other}>
      <List
        rowHeight={44}
        overscanCount={5}
        rowProps={{ children }}
        rowCount={rowCount}
        style={{ height: '256px', width: '100%' }}
        rowComponent={ListRowComponent}
      />
    </div>
  )
})

EnhancedListbox.displayName = 'EnhancedListbox'
EnhancedListbox.propTypes = {
  children: PropTypes.node,
}

let inMemoryIconList = null
let inMemoryIconListPromise = null

export const useIconDataLoader = (iconUrl, onSuccess, onReject) => {
  const effectiveIconUrl = iconUrl || DEFAULT_ICON_URL

  useEffect(() => {
    let active = true

    if (inMemoryIconList) {
      onSuccess(inMemoryIconList)
      return
    }

    if (!inMemoryIconListPromise) {
      inMemoryIconListPromise = (async () => {
        try {
          const url = `${effectiveIconUrl}/icon_list.txt`
          const rawIconsList = await fetchResource({
            url,
            cacheName: 'icon_list',
            rawBody: true,
          })
          if (!rawIconsList || typeof rawIconsList.text !== 'function') {
            return []
          }
          const iconsText = await rawIconsList.text()
          const list = iconsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
          inMemoryIconList = list
          return list
        } catch (e) {
          console.error('Failed to load icon list:', e)
          return []
        } finally {
          inMemoryIconListPromise = null
        }
      })()
    }

    inMemoryIconListPromise
      .then((list) => {
        if (active && list.length > 0) {
          onSuccess(list)
        }
      })
      .catch((err) => {
        if (active && onReject) onReject(err)
      })

    return () => {
      active = false
    }
  }, [effectiveIconUrl, onSuccess, onReject])
}

const ShapePicker = ({
  label,
  value,
  options = [],
  color,
  groupBy,
  getDisabled,
  getIcon = R.identity,
  getLabel = R.identity,
  ListboxComponent,
  onChange,
}) => (
  <ListboxPropsContext.Provider value={{ getDisabled, getLabel, getIcon }}>
    <Autocomplete
      disableListWrap
      disableClearable
      clearIcon={false}
      sx={{ p: 1 }}
      options={options}
      value={value ?? null}
      groupBy={groupBy}
      onChange={onChange}
      slots={{
        ...(ListboxComponent && { listbox: ListboxComponent }),
      }}
      isOptionEqualToValue={(option, val) => option === val}
      getOptionKey={(option) => option}
      getOptionLabel={(option) => getLabel(option) ?? option ?? ''}
      getOptionDisabled={getDisabled}
      filterOptions={(optionsList, { inputValue }) => {
        const query = inputValue.trim().toLowerCase()
        if (!query) return optionsList.slice(0, 500)
        const matches = []
        for (let i = 0; i < optionsList.length; i++) {
          const opt = optionsList[i]
          const lbl = getLabel(opt)
          if (
            (lbl && lbl.toLowerCase().includes(query)) ||
            opt.toLowerCase().includes(query)
          ) {
            matches.push(opt)
            if (matches.length >= 500) break
          }
        }
        return matches
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props
        return (
          <Box
            key={key}
            component="li"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              alignItems: 'center',
              px: 1,
              py: 0.5,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            {...optionProps}
          >
            <FetchedIcon size={24} iconName={getIcon(option)} />
            <Typography variant="subtitle2" noWrap>
              {getLabel(option) ?? option}
            </Typography>
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          fullWidth
          focused
          autoFocus
          label={label}
          color={color}
          {...params}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps?.input,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <FetchedIcon size={24} iconName={getIcon(value)} />
                  </InputAdornment>
                  {params.slotProps?.input?.startAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  </ListboxPropsContext.Provider>
)

ShapePicker.propTypes = {
  color: PropTypes.string,
  getDisabled: PropTypes.func,
  getIcon: PropTypes.func,
  getLabel: PropTypes.func,
  groupBy: PropTypes.func,
  label: PropTypes.string,
  ListboxComponent: PropTypes.elementType,
  onChange: PropTypes.func,
  options: PropTypes.array,
  value: PropTypes.string,
}

export default memo(ShapePicker)
