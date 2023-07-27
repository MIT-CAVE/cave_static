import {
  Modal,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
} from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import SimpleModalOptions from './SimpleModalOptions'

import { sendCommand } from '../../../data/data'
import {
  closeMapModal,
  mapStyleSelection,
  viewportUpdate,
} from '../../../data/local/mapSlice'
import { timeSelection } from '../../../data/local/settingsSlice'
import {
  selectOptionalViewports,
  selectMapModal,
  selectTimeUnits,
  selectTimeLength,
  selectTime,
  selectAppBarId,
  selectMergedArcs,
  selectMergedNodes,
  selectMergedGeos,
} from '../../../data/selectors'
import { styleId } from '../../../utils/enums'
import ClusterModal from '../../compound/ClusterModal'
import SimpleModal from '../../compound/SimpleModal'
import { renderPropsLayout } from '../common/renderLayout'

import { FetchedIcon } from '../../compound'

import { customSort } from '../../../utils'

const styles = {
  modal: {
    display: 'flex',
    p: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    backgroundColor: 'background.paper',
    boxShadow: 5,
    p: (theme) => theme.spacing(2, 4, 3),
    color: 'text.primary',
  },
  title: {
    p: 0.5,
    whiteSpace: 'nowrap',
  },
  listPaper: {
    position: 'absolute',
    right: '64px',
    bottom: '72px',
    maxWidth: 250,
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    bgcolor: 'background.paper',
    boxShadow: 5,
    p: (theme) => theme.spacing(2, 4, 1),
    color: 'text.primary',
  },
  flexSpaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
  },
}

const OnLayerEventModal = () => {
  const dispatch = useDispatch()
  const mapModal = useSelector(selectMapModal)
  const currentTime = useSelector(selectTime)
  const arcData = useSelector(selectMergedArcs)
  const nodeData = useSelector(selectMergedNodes)
  const geoData = useSelector(selectMergedGeos)

  const {
    cluster_id,
    feature,
    type,
    key,
    name,
    layout,
    props: items,
  } = R.propOr({}, 'data')(mapModal)

  const featureData =
    feature === 'arcs' ? arcData : feature === 'nodes' ? nodeData : geoData
  const getCurrentVal = (propId) =>
    R.path([key, 'props', propId, 'value'])(featureData)

  const onChangeProp = (prop, propId) => (value) => {
    const usesTime = R.hasPath(
      [key, 'props', propId, 'timeValues', currentTime, 'value'],
      featureData
    )
    const dataPath = usesTime
      ? ['data', key, 'props', propId, 'timeValues', `${currentTime}`, 'value']
      : ['data', key, 'props', propId, 'value']

    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          data_name: feature,
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
    <ClusterModal title={type} cluster_id={cluster_id}>
      {renderPropsLayout({
        layout,
        items,
        getCurrentVal,
        onChangeProp,
      })}
    </ClusterModal>
  ) : (
    <SimpleModal title={name || type}>
      {renderPropsLayout({
        layout,
        items,
        getCurrentVal,
        onChangeProp,
      })}
    </SimpleModal>
  )
}

const ListModal = ({ title, options, onSelect }) => {
  const dispatch = useDispatch()
  const appBarId = useSelector(selectAppBarId)

  return (
    <Modal
      sx={styles.modal}
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
      onClose={() => dispatch(closeMapModal(appBarId))}
    >
      <Box sx={styles.listPaper}>
        <Box sx={styles.flexSpaceBetween}>
          <Typography id="viewports-pad-title" variant="h5" sx={styles.title}>
            {title}
          </Typography>
        </Box>
        <List>
          {customSort(options).map(({ id, name, icon }) => (
            <ListItemButton key={id} onClick={() => onSelect(id)}>
              <ListItemAvatar>
                <Avatar>
                  <FetchedIcon iconName={icon} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={name} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Modal>
  )
}

// QUESTION: Do we move this to somewhere in the API?
const mapStyleOptions = {
  streets: {
    name: 'Streets',
    icon: 'MdStreetview',
    order: 2,
    styleId: styleId.STREETS,
  },
  satelliteStreets: {
    name: 'Satellite Streets',
    icon: 'MdSatellite',
    order: 3,
    styleId: styleId.SATELLITE_STREETS,
  },
  default: {
    name: 'Default',
    icon: 'MdMap',
    order: 1,
    styleId: null, // `dark` or `light` is determined by the choosen theme
  },
}

const MapModal = () => {
  const mapModal = useSelector(selectMapModal)
  const optionalViewports = useSelector(selectOptionalViewports)
  const timeUnits = useSelector(selectTimeUnits)
  const timeLength = useSelector(selectTimeLength)
  const appBarId = useSelector(selectAppBarId)
  const dispatch = useDispatch()
  if (!mapModal.isOpen) return null
  const feature = R.path(['data', 'feature'], mapModal)
  const timeOptions = R.pipe(
    R.add(1),
    R.range(1),
    R.reduce((acc, value) => R.assoc(value, value, acc), {}),
    R.map((value) => ({ name: value, icon: 'MdAvTimer', order: value }))
  )(timeLength)
  return R.cond([
    [
      R.equals('viewports'),
      R.always(
        <ListModal
          title="Map Viewports"
          options={optionalViewports}
          onSelect={(value) => {
            const viewport = R.pipe(
              R.prop(value),
              // `id` is not necessary here, since that is only
              // added by `customSort` as a helper property
              R.omit(['name', 'icon'])
            )(optionalViewports)
            dispatch(viewportUpdate({ viewport, appBarId }))
            dispatch(closeMapModal(appBarId))
          }}
        />
      ),
    ],
    [
      R.equals('mapStyles'),
      R.always(
        <ListModal
          title="Map Styles"
          placeholder="Choose a map style..."
          options={mapStyleOptions}
          onSelect={(value) => {
            const styleId = R.path([value, 'styleId'])(mapStyleOptions)
            dispatch(mapStyleSelection({ appBarId, mapStyle: styleId }))
            dispatch(closeMapModal(appBarId))
          }}
        />
      ),
    ],
    [
      R.equals('setTime'),
      R.always(
        <SimpleModalOptions
          title={`Set ${timeUnits}`}
          placeholder={`Choose a ${timeUnits}`}
          options={timeOptions}
          onSelect={(value) => {
            dispatch(timeSelection(value - 1))
            dispatch(closeMapModal(appBarId))
          }}
        />
      ),
    ],
    [R.T, R.always(<OnLayerEventModal />)], // 'arcs', 'nodes' or 'geos'
  ])(feature)
}

export default memo(MapModal)
