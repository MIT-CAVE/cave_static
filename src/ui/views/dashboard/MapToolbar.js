import {
  Box,
  Divider,
  Paper,
  IconButton,
  Typography,
  Grid2 as Grid,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useMemo } from 'react'
import { MdDelete, MdCopyAll } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  selectSync,
  selectCurrentPage,
  selectMapData,
} from '../../../data/selectors'

import { getFreeName, includesPath } from '../../../utils'

const styles = {
  wrapper: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  mapOption: {
    p: 2,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    // width: '300px',
    color: 'common.white',
    bgcolor: 'grey.800',
    '&:hover': {
      bgcolor: 'grey.700',
    },
  },
  selected: {
    bgcolor: 'primary.dark',
    '&:hover': {
      bgcolor: 'primary.dark',
    },
  },
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

  const availableValue = R.pipe(
    R.propOr('', 'mapId'),
    R.unless(R.has(R.__, maps), R.always(''))
  )(chartObj)

  const handleMapSelect = (mapId) => {
    dispatch(
      mutateLocal({
        path: [...path, 'mapId'],
        value: mapId,
        sync: !includesPath(R.values(sync), path),
      })
    )
  }

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
      {availableValue === '' && (
        <>
          <Box sx={styles.placeholder}>Select A Map</Box>
          <Divider sx={{ mb: 2 }} />
        </>
      )}
      <Grid
        container
        spacing={2}
        justifyContent="flex-start"
        sx={{ width: '100%' }}
        columns={3}
      >
        {R.keys(maps).map((mapId) => (
          <Grid key={mapId} size={1}>
            <Paper
              sx={[
                styles.mapOption,
                mapId === availableValue && styles.selected,
              ]}
              elevation={mapId === availableValue ? 3 : 1}
              onClick={() => handleMapSelect(mapId)}
            >
              <Typography>{R.pathOr(mapId, [mapId, 'name'], maps)}</Typography>
              <Box>
                {R.pathOr(false, [mapId, 'duplicate'], maps) ? (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(mapId)
                    }}
                  >
                    <MdDelete />
                  </IconButton>
                ) : (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicate(mapId)
                    }}
                  >
                    <MdCopyAll />
                  </IconButton>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
})

export default MapToolbar
