// TODO: Refactor in terms of props and `PropContainer`
import {
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  Switch,
  Typography,
  Box,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal, deleteLocal } from '../../../data/local'
import { toggleMirror } from '../../../data/local/settingsSlice'
import {
  selectCurrentTimeLength,
  selectData,
  selectDemoMode,
  selectGlobalOutputProps,
  selectGlobalOutputsDraggable,
  selectLocalDraggables,
  selectMirrorMode,
  selectPaneState,
  selectShowToolbar,
  selectSync,
  selectSyncToggles,
} from '../../../data/selectors'
import { draggableId } from '../../../utils/enums'
import { useMutateState } from '../../../utils/hooks'

import { InfoButton, List, OverflowText } from '../../compound'

import { includesPath, renameKeys, withIndex } from '../../../utils'

const styles = {
  paperRoot: {
    pt: 1,
    pb: 0.5,
    pl: 2,
    pr: 2,
    mt: 2,
  },
  field: {
    mt: 2,
    mb: 2,
  },
  title: {
    display: 'flex',
    position: 'relative',
    alignItems: 'flex-start',
  },
  info: {
    top: 0,
    right: 0,
    position: 'absolute',
  },
  overflowAlignLeft: {
    textAlign: 'left',
    // fontSize: '20px',
  },
}

const FieldTitle = ({ title, titleVariant = 'h6', help }) => (
  <Box sx={styles.title}>
    <Typography variant={titleVariant}>{title}</Typography>
    {help && (
      <Box sx={styles.info}>
        <InfoButton text={help} />
      </Box>
    )}
  </Box>
)
FieldTitle.propTypes = {
  title: PropTypes.string,
  help: PropTypes.string,
}

const FieldContainer = ({ title, help, children }) => (
  <Paper elevation={3} sx={styles.paperRoot}>
    <FieldTitle {...{ title, help }} />
    <Box sx={styles.field}>{children}</Box>
  </Paper>
)
FieldContainer.propTypes = {
  title: PropTypes.string,
  help: PropTypes.string,
  children: PropTypes.node,
}

const MirrorSwitch = () => {
  const mirrorMode = useSelector(selectMirrorMode)
  const paneState = useSelector(selectPaneState)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()
  return (
    <FormControl component="fieldset">
      <FormGroup aria-label="position" row>
        <FormControlLabel
          value="start"
          control={
            <Switch
              checked={mirrorMode}
              onChange={() => {
                const previousLeft = R.propOr({}, 'left', paneState)
                const previousRight = R.propOr({}, 'right', paneState)
                const syncLeft = !includesPath(R.values(sync), [
                  'panes',
                  'paneState',
                  'left',
                ])
                const syncRight = !includesPath(R.values(sync), [
                  'panes',
                  'paneState',
                  'right',
                ])
                const syncedObject = R.pipe(
                  syncLeft ? R.assoc('left', previousRight) : R.dissoc('left'),
                  syncRight ? R.assoc('right', previousLeft) : R.dissoc('right')
                )(paneState)

                const desyncedObject = R.pipe(
                  !syncLeft ? R.assoc('left', previousRight) : R.dissoc('left'),
                  !syncRight
                    ? R.assoc('right', previousLeft)
                    : R.dissoc('right')
                )(paneState)
                dispatch(toggleMirror())
                if (syncLeft || syncRight)
                  dispatch(
                    mutateLocal({
                      path: ['panes', 'paneState'],
                      value: syncedObject,
                      sync: true,
                    })
                  )
                if (!syncLeft || !syncRight)
                  dispatch(
                    mutateLocal({
                      path: ['panes', 'paneState'],
                      value: desyncedObject,
                      sync: false,
                    })
                  )
              }}
            />
          }
          label={`Mirror mode`}
          labelPlacement="start"
        />
      </FormGroup>
    </FormControl>
  )
}

const DemoSwitch = () => {
  const demoMode = useSelector(selectDemoMode)
  const dispatch = useDispatch()
  return (
    <FormControl component="fieldset">
      <FormGroup aria-label="position" row>
        <FormControlLabel
          value="start"
          control={
            <Switch
              checked={demoMode}
              onChange={() => {
                dispatch(
                  mutateLocal({
                    path: ['settings', 'demo'],
                    value: !demoMode,
                    sync: false,
                  })
                )
              }}
            />
          }
          label={`Demo mode`}
          labelPlacement="start"
        />
      </FormGroup>
    </FormControl>
  )
}

const ColumnSwitch = ({ name, checked, onChange }) => (
  <FormControlLabel
    sx={{ pl: 2 }}
    control={<Switch {...{ checked, onChange }} />}
    label={<OverflowText sx={styles.overflowAlignLeft} text={name} />}
  />
)
ColumnSwitch.propTypes = {
  name: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
}

const ToolbarSwitch = () => {
  const showToolbar = useSelector(selectShowToolbar)
  const dispatch = useDispatch()

  const handleChange = () => {
    dispatch(
      mutateLocal({
        path: ['settings', 'defaults', 'showToolbar'],
        value: !showToolbar,
        sync: false,
      })
    )
  }
  return (
    <FormControl component="fieldset">
      <FormGroup row>
        <FormControlLabel
          value="start"
          control={<Switch checked={showToolbar} onChange={handleChange} />}
          label="Show Chart Toolbar"
          labelPlacement="start"
        />
      </FormGroup>
    </FormControl>
  )
}

const DraggableSwitch = ({ id, name }) => {
  const draggables = useSelector(selectLocalDraggables)
  const dispatch = useDispatch()

  const open = R.pathOr(false, [id, 'open'])(draggables)
  return (
    <ColumnSwitch
      {...{ name }}
      checked={open}
      onChange={() => {
        dispatch(
          mutateLocal({
            path: ['draggables', id, 'open'],
            value: !open,
            sync: false,
          })
        )
      }}
    />
  )
}

const GlobalOutputsSwitch = () => {
  const draggable = useSelector(selectGlobalOutputsDraggable)
  const props = useSelector(selectGlobalOutputProps)

  const onSelect = useMutateState(
    (value) => ({
      path: ['globalOutputs', 'props'],
      value: R.mapObjIndexed((prop, key) =>
        R.assoc('draggable', R.includes(key)(value))(prop)
      )(props),
      sync: false,
    }),
    [props]
  )
  return (
    <>
      <DraggableSwitch id={draggableId.GLOBAL_OUTPUTS} name="Global Outputs" />
      {draggable.open && (
        <List
          sx={{ ml: 2, my: 1 }}
          header="Select Global Outputs"
          value={R.keys(R.filter(R.prop('draggable'))(props))}
          optionsList={R.pipe(
            withIndex,
            R.project(['id', 'name', 'icon']),
            R.map(renameKeys({ id: 'value', name: 'label', icon: 'iconName' }))
          )(props)}
          size="small"
          {...{ onSelect }}
        />
      )}
    </>
  )
}

const AppSettingsPane = () => {
  const dispatch = useDispatch()
  const apiData = useSelector(selectData)
  const timeLength = useSelector(selectCurrentTimeLength)
  const syncToggles = useSelector(selectSyncToggles)
  const sync = useSelector(selectSync)

  return (
    <>
      <FieldContainer title="Mirror">
        <MirrorSwitch />
      </FieldContainer>
      <FieldContainer title="Demo">
        <DemoSwitch />
      </FieldContainer>
      <FieldContainer title="Defaults">
        <ToolbarSwitch />
      </FieldContainer>
      <FieldContainer title="Draggables">
        <FormControl component="fieldset">
          <FormGroup>
            <DraggableSwitch id={draggableId.SESSION} name="Current Session" />
            <GlobalOutputsSwitch
              id={draggableId.GLOBAL_OUTPUTS}
              name="Global Outputs"
            />
            {timeLength > 0 && (
              <DraggableSwitch id={draggableId.TIME} name="Time Control" />
            )}
          </FormGroup>
        </FormControl>
      </FieldContainer>
      {R.isEmpty(syncToggles) ? (
        []
      ) : (
        <FieldContainer title="Sync">
          {R.values(
            R.mapObjIndexed((object, key) => {
              const paths = R.prop('data')(object)
              return R.propOr(false, 'showToggle', object) ? (
                <div key={key}>
                  <ColumnSwitch
                    name={R.propOr(key, 'name', object)}
                    checked={
                      !R.all((path) => R.includes(path, R.values(sync)))(
                        R.values(paths)
                      )
                    }
                    onChange={(event) => {
                      R.forEachObjIndexed((path, name) =>
                        !event.target.checked
                          ? dispatch(
                              mutateLocal({
                                path: ['settings', 'sync', R.concat(key, name)],
                                value: path,
                              })
                            ) &&
                            dispatch(
                              mutateLocal({
                                path: path,
                                value: R.path(path, apiData),
                              })
                            )
                          : dispatch(
                              deleteLocal({
                                path: ['settings', 'sync', R.concat(key, name)],
                              })
                            ) && dispatch(deleteLocal({ path }))
                      )(paths)
                    }}
                  />
                </div>
              ) : (
                []
              )
            })(syncToggles)
          )}
        </FieldContainer>
      )}
    </>
  )
}

export default AppSettingsPane
