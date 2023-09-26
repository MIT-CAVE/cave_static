import { Box, Modal } from '@mui/material'
import * as R from 'ramda'
import { useDispatch, useSelector } from 'react-redux'

import { renderPropsLayout } from './renderLayout'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectOpenModal,
  selectOpenModalData,
  selectSync,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { layoutType } from '../../../utils/enums'

import { addValuesToProps, includesPath } from '../../../utils'

const styles = {
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ml: 'auto',
    mr: 'auto',
    p: 1,
  },
  paper: {
    position: 'absolute',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    bgcolor: 'background.paper',
    boxShadow: 5,
    p: (theme) => theme.spacing(2, 4, 3),
    color: 'text.primary',
    maxWidth: `calc(100vw - ${2 * APP_BAR_WIDTH + 1}px)`,
    maxHeight: `calc(100vh - ${2 * APP_BAR_WIDTH + 1}px)`,
    overflow: 'auto',
    ml: 'auto',
    mr: 'auto',
    pb: 4,
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

const GeneralModal = ({ title, children, onClose }) => {
  return (
    <Modal
      sx={styles.modal}
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
      onClose={onClose}
    >
      <Box sx={styles.paper}>
        <Box sx={styles.header}>{title}</Box>
        {children}
      </Box>
    </Modal>
  )
}

const AppModal = () => {
  const open = useSelector(selectOpenModal)
  const modal = useSelector(selectOpenModalData)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()
  if (R.isEmpty(open)) return null

  const { layout, name, props, values } = modal
  const propsWithValues = addValuesToProps(props, values)
  const modalLayout = R.pipe(
    R.defaultTo({ type: layoutType.GRID }),
    R.unless(R.has('numColumns'), R.assoc('numColumns', 1))
  )(layout)
  const onClose = () => {
    dispatch(
      mutateLocal({
        path: ['appBar', 'openModal'],
        value: '',
        sync: !includesPath(R.values(sync), ['appBar', 'openModal']),
      })
    )
  }
  const onChangeProp = (prop, propId) => (value) => {
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          data_name: 'modals',
          data_path: ['data', open, 'values', propId],
          data_value: value,
          mutation_type: 'mutate',
          api_command: R.prop('apiCommand', prop),
          api_command_keys: R.prop('apiCommandKeys', prop),
        },
      })
    )
  }

  return (
    <GeneralModal title={name} onClose={onClose}>
      {renderPropsLayout({
        layout: modalLayout,
        items: propsWithValues,
        onChangeProp,
      })}
    </GeneralModal>
  )
}
export { AppModal, GeneralModal }
