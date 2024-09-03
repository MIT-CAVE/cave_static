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

import { mutateLocal } from '../../../data/local'
import { closeMapModal, viewportUpdate } from '../../../data/local/mapSlice'
import { timeSelection } from '../../../data/local/settingsSlice'
import {
  selectOptionalViewportsFunc,
  selectMapModal,
  selectCurrentTimeUnits,
  selectCurrentTimeLength,
  selectMapStyleOptions,
  selectSync,
} from '../../../data/selectors'

import { FetchedIcon } from '../../compound'

import { withIndex, includesPath } from '../../../utils'

const styles = {
  modal: {
    display: 'flex',
    p: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    width: '280px',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    bgcolor: 'background.paper',
    boxShadow: 5,
    p: (theme) => theme.spacing(2, 2, 1),
    color: 'text.primary',
  },
  flexSpaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
  },
}

const ListModal = ({ title, options, mapId, defaultIcon, onSelect }) => {
  const dispatch = useDispatch()

  return (
    <Modal
      sx={styles.modal}
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
      onClose={() => dispatch(closeMapModal(mapId))}
    >
      <Box sx={styles.listPaper}>
        <Box sx={styles.flexSpaceBetween}>
          <Typography id="viewports-pad-title" variant="h5" sx={styles.title}>
            {title}
          </Typography>
        </Box>
        <List>
          {withIndex(options).map(({ id, name, icon }) => (
            <ListItemButton key={id} onClick={() => onSelect(id)}>
              <ListItemAvatar>
                <Avatar>
                  <FetchedIcon iconName={icon || defaultIcon} />
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

const MapModal = ({ mapId }) => {
  const mapModal = useSelector(selectMapModal)
  const optionalViewports = useSelector(selectOptionalViewportsFunc)(mapId)
  const timeUnits = useSelector(selectCurrentTimeUnits)
  const timeLength = useSelector(selectCurrentTimeLength)
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()
  if (!mapModal.isOpen) return null
  const feature = R.path(['data', 'feature'], mapModal)
  const modelMap = R.pathOr('', ['data', 'mapId'], mapModal)
  const timeOptions = R.pipe(
    R.add(1),
    R.range(1),
    R.reduce((acc, value) => R.assoc(value, value, acc), {}),
    R.map((value) => ({ name: value, icon: 'md/MdAvTimer', order: value }))
  )(timeLength)
  const syncStyles = !includesPath(R.values(sync), [
    'maps',
    'data',
    mapId,
    'currentStyle',
  ])
  return R.cond([
    [
      (d) => R.equals('viewports', d) && R.equals(mapId, modelMap),
      R.always(
        <ListModal
          title="Map Viewports"
          options={optionalViewports}
          defaultIcon="md/MdGpsFixed"
          onSelect={(value) => {
            const viewport = R.pipe(
              R.prop(value),
              // `id` is not necessary here, since that is only
              // added by `withIndex` as a helper property
              R.omit(['name', 'icon'])
            )(optionalViewports)
            dispatch(viewportUpdate({ viewport, mapId }))
            dispatch(closeMapModal(mapId))
          }}
          mapId={mapId}
        />
      ),
    ],
    [
      (d) => R.equals('mapStyles', d) && R.equals(mapId, modelMap),
      R.always(
        <ListModal
          title="Map Styles"
          placeholder="Choose a map style..."
          defaultIcon="md/MdMap"
          options={mapStyleOptions}
          onSelect={(mapStyle) => {
            dispatch(
              mutateLocal({
                sync: syncStyles,
                path: ['maps', 'data', mapId, 'currentStyle'],
                value: mapStyle,
              })
            )
            dispatch(closeMapModal(mapId))
          }}
          mapId={mapId}
        />
      ),
    ],
    [
      (d) => R.equals('setTime', d) && R.equals(mapId, modelMap),
      R.always(
        <SimpleModalOptions
          title={`Set ${timeUnits}`}
          placeholder={`Choose a ${timeUnits}`}
          options={timeOptions}
          onSelect={(value) => {
            dispatch(timeSelection(value - 1))
            dispatch(closeMapModal(mapId))
          }}
          mapId={mapId}
        />
      ),
    ],
  ])(feature)
}

export default memo(MapModal)
