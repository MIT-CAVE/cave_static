import {
  Autocomplete,
  Box,
  Grid,
  IconButton,
  Checkbox,
  TextField,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useMemo } from 'react'
import { MdCheckBox, MdCheckBoxOutlineBlank, MdRefresh } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import ChartDropdownWrapper from './ChartDropdownWrapper'
import ChartTypeSelector from './ChartTypeSelector'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectAssociatedData,
  selectSync,
  selectCurrentPage,
  selectMergedGlobalOutputs,
} from '../../../data/selectors'
import { chartOption, chartVariant } from '../../../utils/enums'

import { FetchedIcon } from '../../compound'

import { withIndex, includesPath, addValuesToProps } from '../../../utils'

const styles = {
  content: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    overflow: 'auto',
  },
  sessions: {
    padding: 2,
    width: '100%',
    mx: 0,
    // minHeight: 100,
  },
  refresh: {
    minWidth: 0,
    borderRadius: 1,
    height: '100%',
    width: '64px',
    border: '1px solid rgb(255 255 255 / .12)',
  },
}

const CHART_OPTIONS = [
  chartOption.BAR,
  chartOption.LINE,
  chartOption.TABLE,
  chartOption.OVERVIEW,
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

  const handleSelectChart = (value) => {
    dispatch(
      mutateLocal({
        path,
        sync: !includesPath(R.values(sync), path),
        value: R.assoc('chartType', value)(chartObj),
      })
    )
  }

  const globalOutputsOptions = R.pipe(
    R.reject(R.pipe(R.prop('value'), R.isNil)),
    withIndex,
    R.project(['id', 'name', 'icon']),
    R.map(R.renameKeys({ id: 'value', name: 'label', icon: 'iconName' }))
  )(props)

  return (
    <Box sx={styles.content}>
      <ChartTypeSelector
        value={chartObj.chartType}
        onChange={handleSelectChart}
        chartOptions={CHART_OPTIONS}
        extraOptions={
          <Grid
            size="grow"
            sx={{ height: '100%', display: 'flex', justifyContent: 'end' }}
          >
            <IconButton
              sx={styles.refresh}
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
              <MdRefresh size={32} />
            </IconButton>
          </Grid>
        }
      />

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
                    <FetchedIcon iconName={iconName} sx={{ marginRight: 1 }} />
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
        </>
      )}
    </Box>
  )
}

export default memo(GlobalOutputsToolbar)
