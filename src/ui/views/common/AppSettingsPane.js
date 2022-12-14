// TODO: Refactor in terms of props and `PropContainer`
import {
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  Switch,
  Typography,
  Grid,
  Box,
} from '@mui/material'
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

const ThemeSwitch = ({ onClick, ...props }) => {
  const selectedTheme = useSelector(selectTheme)
  const isDark = selectedTheme === themeId.DARK
  return (
    <FormControl component="fieldset">
      <FormGroup aria-label="position" row>
        <FormControlLabel
          value="start"
          control={<Switch checked={isDark} {...{ onClick, ...props }} />}
          label={`${isDark ? 'Dark' : 'Light'} mode`}
          labelPlacement="start"
        />
      </FormGroup>
    </FormControl>
  )
}
ThemeSwitch.propTypes = { onClick: PropTypes.func }

const SyncSwitch = ({ checked, label, onClick, ...props }) => (
  <Grid container spacing={0} alignItems="center" {...props}>
    <Grid item xs={2}>
      <Switch {...{ checked, onClick, ...props }} />
    </Grid>
    <Grid item>
      <OverflowText sx={styles.overflowAlignLeft} text={label} />
    </Grid>
  </Grid>
)
SyncSwitch.propTypes = {
  checked: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func,
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
