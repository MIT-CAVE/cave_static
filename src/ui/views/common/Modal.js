import { Box, Modal } from '@mui/material'
import * as R from 'ramda'
import { useDispatch, useSelector } from 'react-redux'

import OptionsPane from './OptionsPane'

import { mutateLocal } from '../../../data/local'
import {
  selectOpenModal,
  selectOpenModalData,
  selectSync,
} from '../../../data/selectors'

import { includesPath } from '../../../utils'

const styles = {
  modal: {
    display: 'flex',
    p: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5001,
  },
  paper: {
    position: 'absolute',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    bgcolor: 'background.paper',
    boxShadow: 5,
    p: (theme) => theme.spacing(2, 4, 1),
    color: 'text.primary',
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    mb: 1,
    p: 2.5,
    fontSize: '25px',
    borderColor: 'text.secondary',
    borderBottom: '2px',
  },
}

const AppModal = () => {
  const open = useSelector(selectOpenModal)
  const modal = useSelector(selectOpenModalData)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()
  console.log(open)
  if (R.isEmpty(open)) return null
  return (
    <Modal
      sx={styles.modal}
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
      onClose={() => {
        dispatch(
          mutateLocal({
            path: ['appBar', 'openModal'],
            value: '',
            sync: !includesPath(R.values(sync), ['appBar', 'openModal']),
          })
        )
      }}
    >
      <Box sx={styles.paper}>
        <Box sx={styles.header}>{modal.name}</Box>
        <OptionsPane open={open} pane={modal} side={'left'} />
      </Box>
    </Modal>
  )
}

export default AppModal
