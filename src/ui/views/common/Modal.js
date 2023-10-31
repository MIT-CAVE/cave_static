import { Box, Modal } from '@mui/material'
import * as R from 'ramda'
import { useDispatch, useSelector } from 'react-redux'

import { renderPropsLayout } from './renderLayout'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectModal,
  selectOpenModal,
  selectOpenModalData,
  selectSync,
  selectCurrentTime,
  selectMergedArcs,
  selectMergedNodes,
  selectMergedGeos,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { layoutType } from '../../../utils/enums'
import ClusterModal from '../../compound/ClusterModal'

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

const GeneralModal = ({ title, children }) => {
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

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
            path: ['panes', 'paneState', 'center'],
            value: {},
            sync: !includesPath(R.values(sync), [
              'panes',
              'paneState',
              'center',
            ]),
          })
        )
      }}
    >
      <Box sx={styles.paper}>
        <Box sx={styles.header}>{title}</Box>
        {children}
      </Box>
    </Modal>
  )
}

const MapFeatureModal = () => {
  const open = useSelector(selectOpenModal)
  const currentTime = useSelector(selectCurrentTime)
  const arcData = useSelector(selectMergedArcs)
  const nodeData = useSelector(selectMergedNodes)
  const geoData = useSelector(selectMergedGeos)
  const dispatch = useDispatch()
  const { cluster_id, feature, type, layout, props, mapId } = open
  const key = JSON.parse(R.prop('key', open))
  const featureData =
    feature === 'arcs' ? arcData : feature === 'nodes' ? nodeData : geoData
  const getCurrentVal = (propId) =>
    R.path([...key, 'values', propId])(featureData)
  const onChangeProp = (prop, propId) => (value) => {
    const usesTime = R.hasPath(
      [...key, 'valueLists', 'timeValues', currentTime, propId],
      featureData
    )
    const dataPath = usesTime
      ? [
          'data',
          key[0],
          'data',
          'valueLists',
          'timeValues',
          `${currentTime}`,
          propId,
          parseInt(key[1]),
        ]
      : ['data', key[0], 'data', 'valueLists', propId, parseInt(key[1])]
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          data_name: 'mapFeatures',
          data_path: dataPath,
          data_value: value,
          mutation_type: 'mutate',
          api_command: R.prop('apiCommand', prop),
          api_command_keys: R.prop('apiCommandKeys', prop),
        },
      })
    )
  }
  return R.isNotNil(cluster_id) ? (
    <ClusterModal title={type} cluster_id={cluster_id} mapId={mapId}>
      {renderPropsLayout({
        layout,
        items: props,
        getCurrentVal,
        onChangeProp,
      })}
    </ClusterModal>
  ) : (
    <GeneralModal title={type}>
      {renderPropsLayout({
        layout,
        items: props,
        getCurrentVal,
        onChangeProp,
      })}
    </GeneralModal>
  )
}

const PaneModal = () => {
  const open = useSelector(selectOpenModal)
  const modal = useSelector(selectOpenModalData)
  const dispatch = useDispatch()

  const { layout, name, props, values } = modal
  const propsWithValues = addValuesToProps(props, values)
  const modalLayout = R.pipe(
    R.defaultTo({ type: layoutType.GRID }),
    R.unless(R.has('numColumns'), R.assoc('numColumns', 1))
  )(layout)

  const onChangeProp = (prop, propId) => (value) => {
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          data_name: 'panes',
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
    <GeneralModal title={name}>
      {renderPropsLayout({
        layout: modalLayout,
        items: propsWithValues,
        onChangeProp,
      })}
    </GeneralModal>
  )
}

const AppModal = () => {
  const open = useSelector(selectOpenModal)
  const fullModal = useSelector(selectModal)
  if (R.isEmpty(open)) return null
  const type = R.prop('type', fullModal)
  return type === 'pane' ? <PaneModal /> : <MapFeatureModal />
}
export { AppModal, GeneralModal }
