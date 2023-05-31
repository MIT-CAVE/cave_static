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
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { openMapModal, closeMapModal } from '../../data/local/mapSlice'
import {
  selectAppBarId,
  selectFilteredNodes,
  selectNodeClustersAtZoom,
} from '../../data/selectors'

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

const ClusterModal = ({ title, cluster_id, ...props }) => {
  const dispatch = useDispatch()
  const appBarId = useSelector(selectAppBarId)

  const groupedNodesAtZoom = useSelector(selectNodeClustersAtZoom)
  const targetCluster = R.find(
    R.allPass([
      R.path(['properties', 'cluster']),
      R.pathEq(cluster_id, ['properties', 'cluster_id']),
      R.pathEq(title, ['properties', 'type']),
    ])
  )(groupedNodesAtZoom.data)

  // get all nodes in cluster
  const nodeData = R.toPairs(
    R.pick(
      targetCluster.properties.grouped_ids,
      useSelector(selectFilteredNodes)
    )
  ) //.map(node => node[1])
  // generate table columns for given cluster's props
  const tableColumns = [{ id: 'name', label: 'Name', minWidth: 170 }]
  for (const prop of Object.keys(nodeData[0][1].props)) {
    tableColumns.push({ id: prop, label: prop, minWidth: 170, align: 'right' })
  }

  // generate table rows for given cluster's node data
  const createData = (node) => {
    const data = { name: R.propOr(node[0], 'name', node[1]), id: node[0] }
    for (const prop of Object.keys(node[1].props)) {
      data[prop] = node[1].props[prop].value.toString()
    }
    return data
  }
  const tableRows = nodeData.map((node) => createData(node))

  const [openTime, setOpenTime] = useState(undefined)

  // store the time the modal was opened to prevent closing instantly in touch mode
  useEffect(() => {
    setOpenTime(new Date().getTime())
  }, [])

  const StickyHeadTable = (rows, columns) => {
    const [page, setPage] = React.useState(0)
    const [rowsPerPage, setRowsPerPage] = React.useState(10)

    const handleChangePage = (event, newPage) => {
      setPage(newPage)
    }

    const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(+event.target.value)
      setPage(0)
    }

    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
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
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  return (
                    <TableRow
                      hover
                      onClick={() => {
                        // get node data for clicked row
                        const node = nodeData.find((node) => node[0] === row.id)
                        // open map modal with node data
                        dispatch(
                          openMapModal({
                            appBarId,
                            data: {
                              ...node[1],
                              feature: 'nodes',
                              type: R.propOr(node[1].type, 'name')(node[1]),
                              key: node[0],
                            },
                          })
                        )
                      }}
                      role="checkbox"
                      tabIndex={-1}
                      key={row.id}
                    >
                      {columns.map((column) => {
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
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    )
  }

  return (
    <Modal
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
      onClose={() => {
        const currentTime = new Date().getTime()
        if (currentTime - openTime > 500) dispatch(closeMapModal(appBarId))
      }}
      {...props}
    >
      <Box sx={styles.modal}>
        <Box sx={styles.header}>
          <Typography sx={styles.title} variant="h5">
            Grouped {title}
          </Typography>
        </Box>
        <Box sx={{ overflow: 'auto', maxHeight: '80vh', maxWidth: '90vw' }}>
          {StickyHeadTable(tableRows, tableColumns)}
        </Box>
      </Box>
    </Modal>
  )
}
ClusterModal.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
}

export default ClusterModal
