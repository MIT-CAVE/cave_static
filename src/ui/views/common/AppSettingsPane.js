import {
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  Switch,
  Typography,
  Grid,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal, deleteLocal } from '../../../data/local'
import { themeSelection } from '../../../data/local/settingsSlice'
import {
  selectData,
  selectSync,
  selectSyncToggles,
  selectTheme,
} from '../../../data/selectors'
import { themeId } from '../../../utils/enums'

import { InfoButton, OverflowText } from '../../compound'

const localCss = {
  overflow_align_left: {
    textAlign: 'left',
    fontSize: '20px',
  },
}

const FieldTitle = ({ title, titleVariant = 'h6', help }) => {
  const classes = useStyles()
  return (
    <div
      css={{
        display: 'flex',
        position: 'relative',
        alignItems: 'flex-start',
      }}
    >
      <Typography variant={titleVariant}>{title}</Typography>
      {help && (
        <div className={classes.info}>
          <InfoButton text={help} />
        </div>
      )}
    </div>
  )
}
FieldTitle.propTypes = {
  title: PropTypes.string,
  help: PropTypes.string,
}

const useStyles = makeStyles((theme) => ({
  paperRoot: {
    padding: theme.spacing(0.5, 2),
    marginTop: theme.spacing(2),
  },
  field: {
    margin: theme.spacing(2, 0),
  },
}))

const FieldContainer = ({ title, help, children }) => {
  const classes = useStyles()
  return (
    <Paper elevation={3} className={classes.paperRoot}>
      <FieldTitle {...{ title, help }} />
      <div className={classes.field}>{children}</div>
    </Paper>
  )
}
FieldContainer.propTypes = {
  title: PropTypes.string,
  help: PropTypes.string,
  children: PropTypes.node,
}

const ThemeSwitch = ({ onClick, ...props }) => {
  const selectedTheme = useSelector(selectTheme)
  const isDark = selectedTheme === themeId.DARK

  return (
    <FormControl component="fieldset">
      <FormGroup aria-label="position" row>
        <FormControlLabel
          value="start"
          control={<Switch checked={isDark} {...{ onClick }} {...props} />}
          label={`${isDark ? 'Dark' : 'Light'} mode`}
          labelPlacement="start"
        />
      </FormGroup>
    </FormControl>
  )
}
ThemeSwitch.propTypes = { onClick: PropTypes.func }

const SyncSwitch = ({ onClick, checked, label, ...props }) => {
  return (
    <Grid container spacing={0} alignItems="center" {...props}>
      <Grid item xs={2}>
        <Switch checked={checked} {...{ onClick }} {...props} />
      </Grid>
      <Grid item>
        <OverflowText css={localCss.overflow_align_left} text={label} />
      </Grid>
    </Grid>
  )
}
SyncSwitch.propTypes = {
  onClick: PropTypes.func,
  checked: PropTypes.bool,
  label: PropTypes.string,
}

const AppSettingsPane = ({ ...props }) => {
  const dispatch = useDispatch()
  const apiData = useSelector(selectData)
  const syncToggles = useSelector(selectSyncToggles)
  const sync = useSelector(selectSync)

  return (
    <>
      <FieldContainer title="Theme">
        <ThemeSwitch onClick={() => dispatch(themeSelection())} />
      </FieldContainer>
      {R.isEmpty(syncToggles) ? (
        []
      ) : (
        <FieldContainer title="Sync">
          {R.values(
            R.mapObjIndexed((paths, key) => {
              return (
                <div>
                  <SyncSwitch
                    key={key}
                    checked={
                      !R.all((path) => R.includes(path, R.values(sync)))(
                        R.values(paths)
                      )
                    }
                    label={key}
                    onClick={(event) => {
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
              )
            })(syncToggles)
          )}
        </FieldContainer>
      )}
    </>
  )
}

export default AppSettingsPane
