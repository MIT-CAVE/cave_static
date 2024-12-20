import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useMemo } from 'react'
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import ChartDropdownWrapper from './ChartDropdownWrapper'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectAssociatedData,
  selectSync,
  selectCurrentPage,
  selectMergedGlobalOutputs,
} from '../../../data/selectors'
import { chartVariant } from '../../../utils/enums'

import { FetchedIcon } from '../../compound'

import {
  withIndex,
  includesPath,
  renameKeys,
  addValuesToProps,
} from '../../../utils'

const styles = {
  content: {
    width: '100%',
    height: '80%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'auto',
    gap: 2,
  },
  sessions: {
    width: '95%',
    padding: 2,
    minHeight: 100,
  },
  refresh: {
    marginTop: 2,
    height: 50,
    width: 50,
  },
}

const CHART_OPTIONS = [
  {
    label: 'Bar',
    value: chartVariant.BAR,
    iconName: 'md/MdBarChart',
  },
  {
    label: 'Line',
    value: chartVariant.LINE,
    iconName: 'md/MdShowChart',
  },
  {
    label: 'Table',
    value: chartVariant.TABLE,
    iconName: 'md/MdTableChart',
  },
  {
    label: 'Overview',
    value: chartVariant.OVERVIEW,
    iconName: 'md/MdViewQuilt',
  },
]

const GlobalOutputsToolbar = ({ chartObj, index }) => {
  const globalOutputs = useSelector(selectAssociatedData)
  const currentPage = useSelector(selectCurrentPage)
  const items = useSelector(selectMergedGlobalOutputs)
  const props = addValuesToProps(
    R.map(R.assoc('enabled', false))(R.propOr({}, 'props', items)),
    R.propOr({}, 'values', items)
  )
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const path = useMemo(
    () => ['pages', 'data', currentPage, 'charts', index],
    [currentPage, index]
  )

  const globalOutputsOptions = R.pipe(
    R.reject(R.pipe(R.prop('value'), R.isNil)),
    withIndex,
    R.project(['id', 'name', 'icon']),
    R.map(renameKeys({ id: 'value', name: 'label', icon: 'iconName' }))
  )(props)
  return (
    <>
      <Tabs
        value={R.propOr(chartVariant.BAR, 'chartType', chartObj)}
        onChange={(_, value) => {
          dispatch(
            mutateLocal({
              path,
              sync: !includesPath(R.values(sync), path),
              value: R.assoc('chartType', value)(chartObj),
            })
          )
        }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {CHART_OPTIONS.map((option) => {
          return (
            <Tab
              key={option.label}
              label={option.label}
              value={option.value}
              icon={<FetchedIcon iconName={option.iconName} />}
            />
          )
        })}
      </Tabs>
      <Box sx={styles.content}>
        {chartObj.chartType !== chartVariant.OVERVIEW && (
          <>
            <ChartDropdownWrapper sx={styles.sessions}>
              <Autocomplete
                value={R.propOr([], 'sessions', chartObj)}
                limitTags={5}
                multiple
                fullWidth
                disableCloseOnSelect
                options={R.pipe(R.values, R.pluck('name'))(globalOutputs)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Select Sessions"
                    variant="standard"
                  />
                )}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props
                  return (
                    <li key={key} {...optionProps}>
                      <Checkbox
                        icon={<MdCheckBoxOutlineBlank />}
                        checkedIcon={<MdCheckBox />}
                        checked={selected}
                      />
                      {option}
                    </li>
                  )
                }}
                onChange={(_, value) => {
                  dispatch(
                    mutateLocal({
                      path,
                      sync: !includesPath(R.values(sync), path),
                      value: R.assoc('sessions', value, chartObj),
                    })
                  )
                }}
              />
            </ChartDropdownWrapper>
            <ChartDropdownWrapper sx={styles.sessions}>
              <Autocomplete
                disabled={R.isEmpty(R.propOr([], 'sessions', chartObj))}
                value={R.propOr([], 'globalOutput', chartObj)}
                limitTags={5}
                multiple
                fullWidth
                disableCloseOnSelect
                options={R.pluck('value')(globalOutputsOptions)}
                renderInput={(params) => {
                  return (
                    <TextField
                      {...params}
                      fullWidth
                      label="Select Global Outputs"
                      variant="standard"
                    />
                  )
                }}
                getOptionLabel={(option) => {
                  return R.pipe(
                    R.find(({ value }) => value === option),
                    R.prop('label')
                  )(globalOutputsOptions)
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props
                  const { label, iconName } = R.find(
                    ({ value }) => value === option
                  )(globalOutputsOptions)
                  return (
                    <li key={key} {...optionProps}>
                      <Checkbox
                        icon={<MdCheckBoxOutlineBlank />}
                        checkedIcon={<MdCheckBox />}
                        checked={selected}
                      />
                      <FetchedIcon
                        iconName={iconName}
                        sx={{ marginRight: 1 }}
                      />
                      <Typography sx={{ marginLeft: 1 }}> {label} </Typography>
                    </li>
                  )
                }}
                onChange={(_, value) => {
                  dispatch(
                    mutateLocal({
                      path,
                      sync: !includesPath(R.values(sync), path),
                      value: R.assoc('globalOutput', value, chartObj),
                    })
                  )
                }}
              />
            </ChartDropdownWrapper>
            <ChartDropdownWrapper sx={styles.refresh}>
              <Button
                sx={{ minWidth: 0 }}
                variant="outlined"
                color="greyscale"
                onClick={() => {
                  dispatch(
                    sendCommand({
                      command: 'get_associated_session_data',
                      data: {
                        data_names: ['globalOutputs'],
                      },
                    })
                  )
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '40px',
                  }}
                >
                  <FetchedIcon iconName="md/MdRefresh" size={32} />
                </Box>
              </Button>
            </ChartDropdownWrapper>
          </>
        )}
      </Box>
    </>
  )
}

export default memo(GlobalOutputsToolbar)
