import { Box, Modal, Typography } from '@mui/material'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'

import {
  selectMergedNodes,
  selectNodeClustersAtZoomFunc,
} from '../../data/selectors'
import { useMutateStateWithSync } from '../../utils/hooks'

const styles = {
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'auto',
    color: 'text.primary',
    bgcolor: 'background.paper',
    border: 1,
    borderRadius: 1,
    borderColor: 'text.primary',
    boxShadow: 24,
    p: 3,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  title: {
    p: 0.5,
    mb: 2,
    whiteSpace: 'nowrap',
  },
}

const ClusterModal = ({ title, cluster_id, mapId, ...props }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const groupedNodesAtZoom = useSelector(selectNodeClustersAtZoomFunc)

  const targetCluster = R.find(
    R.allPass([
      R.path(['properties', 'cluster']),
      R.pathEq(cluster_id, ['properties', 'cluster_id']),
      R.pathEq(title, ['properties', 'type']),
    ])
  )(groupedNodesAtZoom(mapId).data)

  // get all nodes in cluster
  const nodeData = R.toPairs(
    R.pick(
      targetCluster.properties.grouped_ids,
      R.propOr(
        [],
        targetCluster.properties.type,
        useSelector(selectMergedNodes)
      )
    )
  ) //.map(node => node[1])

  // generate table columns for given cluster's props
  const tableColumns = [{ id: 'name', label: 'Name', minWidth: 170 }]
  for (const prop of Object.keys(nodeData[0][1].props)) {
    const name = R.propOr(prop, 'name', nodeData[0][1].props[prop])
    tableColumns.push({ id: prop, label: name, minWidth: 170, align: 'right' })
  }

  // generate table rows for given cluster's node data
  const tableRows = nodeData.map((node) => createData(node))

  const createData = useCallback((node) => {
    const data = { name: R.propOr(node[0], 'name', node[1]), id: node[0] }
    for (const prop of Object.keys(node[1].props)) {
      data[prop] = node[1].values[prop].toString()
    }
    return data
  }, [])

  const handleClose = useMutateStateWithSync(
    () => ({
      path: ['panes', 'paneState', 'center'],
      value: {},
    }),
    []
  )

  const handleChangePage = (_, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const handleClickRow = useMutateStateWithSync(
    (row) => {
      // get node data for clicked row
      const node = nodeData.find((node) => node[0] === row.id)
      // open map modal with node data
      return {
        path: ['panes', 'paneState', 'center'],
        value: {
          open: {
            ...node[1],
            feature: 'nodes',
            type: R.propOr(node[1].type, 'name')(node[1]),
            key: JSON.stringify([targetCluster.properties.type, node[0]]),
            mapId,
          },
          type: 'feature',
        },
      }
    },
    [mapId, nodeData, targetCluster.properties.type]
  )

  return (
    <Modal
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
      onClose={handleClose}
      {...props}
    >
      <Box sx={styles.modal}>
        <Box sx={styles.header}>
          <Typography sx={styles.title} variant="h5">
            Grouped {title}
          </Typography>
        </Box>
        <Box sx={{ overflow: 'auto', maxHeight: '80vh', maxWidth: '90vw' }}>
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {tableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{ minWidth: column.minWidth }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      return (
                        <TableRow
                          hover
                          onClick={() => handleClickRow(row)}
                          role="checkbox"
                          tabIndex={-1}
                          key={row.id}
                        >
                          {tableColumns.map((column) => {
                            const value = row[column.id]
                            return (
                              <TableCell key={column.id} align={column.align}>
                                {column.format && typeof value === 'number'
                                  ? column.format(value)
                                  : value}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={tableRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
      </Box>
    </Modal>
  )
}
ClusterModal.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  mapId: PropTypes.string,
}

export default ClusterModal
