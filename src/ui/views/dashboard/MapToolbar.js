import {
  Box,
  Divider,
  Typography,
  Grid2 as Grid,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useMemo } from 'react'
import { MdDelete, MdCopyAll } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  selectSync,
  selectCurrentPage,
  selectMapData,
} from '../../../data/selectors'
import { RippleBox } from '../map/Legend'

import { OverflowText } from '../../compound'

import { getFreeName, includesPath } from '../../../utils'

const styles = {
  wrapper: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  // mapOption: {
  //   p: 2,
  //   cursor: 'pointer',
  //   display: 'flex',
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'space-between',
  //   gap: 2,
  //   // width: '300px',
  //   color: 'common.white',
  //   bgcolor: 'grey.800',
  //   '&:hover': {
  //     bgcolor: 'grey.700',
  //   },
  // },
  // selected: {
  //   bgcolor: 'primary.dark',
  //   '&:hover': {
  //     bgcolor: 'primary.dark',
  //   },
  // },
  placeholder: {
    p: 2,
    textAlign: 'center',
    color: 'text.secondary',
  },
}

const MapToolbar = memo(({ chartObj, index }) => {
  const dispatch = useDispatch()

  const sync = useSelector(selectSync)
  const maps = useSelector(selectMapData)
  const currentPage = useSelector(selectCurrentPage)

  const path = useMemo(
    () => ['pages', 'data', currentPage, 'charts', index],
    [currentPage, index]
  )

  const selectedValue = useMemo(
    () =>
      R.pipe(
        R.propOr('', 'mapId'),
        R.unless(R.has(R.__, maps), R.always(''))
      )(chartObj),
    [chartObj, maps]
  )

  const handleChange = useCallback(
    (event, mapId) => {
      if (mapId == null) return
      dispatch(
        mutateLocal({
          path: [...path, 'mapId'],
          value: mapId,
          sync: !includesPath(R.values(sync), path),
        })
      )
    },
    [dispatch, path, sync]
  )

  const handleDuplicate = (value) => {
    const key = getFreeName(value, R.keys(maps))
    const name = getFreeName(
      R.pathOr(value, [value, 'name'], maps),
      R.values(R.mapObjIndexed((val, key) => R.propOr(key, 'name', val), maps))
    )
    dispatch(
      mutateLocal({
        path: ['maps', 'data', key],
        sync: !includesPath(R.values(sync), ['maps', 'data', key]),
        value: R.pipe(
          R.assoc('duplicate', true),
          R.assoc('name', name)
        )(maps[value]),
      })
    )
  }

  const handleDelete = (key) => {
    dispatch(
      mutateLocal({
        path: ['maps', 'data'],
        sync: !includesPath(R.values(sync), ['maps', 'data']),
        value: R.dissoc(key, maps),
      })
    )
  }

  return (
    <Box sx={styles.wrapper}>
      <Typography sx={styles.placeholder}>Select a Map</Typography>
      <Divider sx={{ mb: 2 }} />
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={selectedValue}
        onChange={handleChange}
      >
        <Grid
          container
          spacing={1}
          sx={{
            width: '100%',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
          }}
          columns={3}
        >
          {R.keys(maps).map((mapId) => (
            <Grid key={mapId} size={1}>
              <ToggleButton
                color="primary"
                value={mapId}
                selected={selectedValue === mapId}
                sx={{ height: '100%' }}
              >
                <Typography
                  noWrap
                  variant="subtitle1"
                  sx={{
                    maxWidth: '100%',
                    textTransform: 'initial',
                    flex: '1 1 auto',
                  }}
                >
                  <OverflowText text={R.pathOr(mapId, [mapId, 'name'], maps)} />
                </Typography>
                {R.pathOr(false, [mapId, 'duplicate'], maps) ? (
                  <RippleBox
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(mapId)
                    }}
                  >
                    <MdDelete color="#fff" size={18} />
                  </RippleBox>
                ) : (
                  <RippleBox
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicate(mapId)
                    }}
                  >
                    <MdCopyAll color="#fff" size={18} />
                  </RippleBox>
                )}
              </ToggleButton>
            </Grid>
          ))}
        </Grid>
      </ToggleButtonGroup>
    </Box>
  )
})

export default MapToolbar
