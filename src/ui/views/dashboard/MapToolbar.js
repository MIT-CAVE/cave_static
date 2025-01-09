import {
  Box,
  Divider,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
    overflow: 'hidden',
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: 'background.paper',
  },
  row: {
    cursor: 'pointer',
    '&:hover': {
      bgcolor: 'action.hover',
    },
  },
  selected: {
    bgcolor: 'action.selected',
    '&:hover': {
      bgcolor: 'action.selected',
    },
  },
  cell: {
    py: 1,
  },
  placeholder: {
    p: 1,
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
    <Paper sx={styles.wrapper}>
      {availableValue === '' && (
        <>
          <Box sx={styles.placeholder}>Select A Map</Box>
          <Divider />
        </>
      )}
      <TableContainer component={Paper}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell sx={styles.headerCell}>Map Name</TableCell>
              <TableCell sx={styles.headerCell} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {R.keys(maps).map((mapId) => (
              <TableRow
                key={mapId}
                hover
                onClick={() => handleMapSelect(mapId)}
                sx={[styles.row, mapId === availableValue && styles.selected]}
              >
                <TableCell sx={styles.cell}>
                  {R.pathOr(mapId, [mapId, 'name'], maps)}
                </TableCell>
                <TableCell sx={styles.cell} align="right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
})

export default MapToolbar
