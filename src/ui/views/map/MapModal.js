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
import { closeMapModal, viewportUpdate } from '../../../data/local/mapSlice'
import { timeSelection } from '../../../data/local/settingsSlice'
import {
  selectOptionalViewports,
  selectMapModal,
  selectTimeUnits,
  selectTimeLength,
  selectTime,
  selectResolveTime,
  selectData,
  selectAppBarId,
  selectMapStyleOptions,
} from '../../../data/selectors'
import { DEFAULT_MAP_STYLE_KEY } from '../../../utils/constants'
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
  const resolveTime = useSelector(selectResolveTime)
  const currentTime = useSelector(selectTime)
  const data = useSelector(selectData)

  const {
    cluster_id,
    feature,
    type,
    key,
    name,
    layout,
    props: items,
  } = R.propOr({}, 'data')(mapModal)

  const getCurrentVal = (propId) =>
    R.path([feature, 'data', key, 'props', propId, 'value'])(data)

  const onChangeProp = (prop, propId) => (value) => {
    const dataPath = ['data', key, 'props', propId, 'value']
    const currentValue = getCurrentVal(propId)
    const sentValue = R.prop('timeObject')(currentValue)
      ? R.has('value')(currentValue)
        ? R.assocPath(['value', currentTime], value, currentValue)
        : currentValue
      : value

    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          data_name: feature,
          data_path: dataPath,
          data_value: sentValue,
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
        resolveTime,
        getCurrentVal,
        onChangeProp,
      })}
    </ClusterModal>
  ) : (
    <SimpleModal title={name || type}>
      {renderPropsLayout({
        layout,
        items,
        resolveTime,
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

const MapModal = () => {
  const mapModal = useSelector(selectMapModal)
  const optionalViewports = useSelector(selectOptionalViewports)
  const timeUnits = useSelector(selectTimeUnits)
  const timeLength = useSelector(selectTimeLength)
  const appBarId = useSelector(selectAppBarId)
  const mapStyleOptions = useSelector(selectMapStyleOptions)
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
          onSelect={(mapStyle) => {
            dispatch(
              sendCommand({
                command: 'mutate_session',
                data: {
                  data_name: 'maps',
                  data_path: ['data', appBarId, 'currentStyle'],
                  data_value: R.ifElse(
                    R.equals(DEFAULT_MAP_STYLE_KEY),
                    R.always(undefined),
                    R.always(mapStyle)
                  )(mapStyle),
                  mutation_type: 'mutate',
                },
              })
            )
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
