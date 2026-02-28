import { Card } from '@mui/material'
import * as R from 'ramda'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { DataGridModal } from './BaseModal'

import { selectChartById, selectCurrentPage } from '../../../data/selectors'
import { CHART_DEFAULTS } from '../../../utils/constants'
import { useMutateStateWithSync } from '../../../utils/hooks'
import GlobalOutputsToolbar from '../dashboard/GlobalOutputsToolbar'
import GroupedOutputsToolbar from '../dashboard/GroupedOutputsToolbar'
import MapToolbar from '../dashboard/MapToolbar'

import { Select } from '../../compound'

const styles = {
  content: {
    padding: 1,
    height: '100%',
  },
  modalSlots: {
    paper: {
      sx: {
        width: '1200px',
        height: '900px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      },
    },
  },
}

const ChartToolsModal = ({ index, label, labelExtra, onClose }) => {
  const currentPage = useSelector(selectCurrentPage)
  const chartObj = useSelector((state) => selectChartById(state, index))

  const vizType = chartObj?.type ?? 'groupedOutput'
  const vizTypeOptions = useMemo(
    () => [
      {
        label: 'Grouped Outputs',
        value: 'groupedOutput',
        iconName: 'md/MdMultilineChart',
      },
      {
        label: 'Global Outputs',
        value: 'globalOutput',
        iconName: 'md/MdSpeed',
      },
      {
        label: 'Maps',
        value: 'map',
        iconName: 'fa/FaMapMarked',
      },
    ],
    []
  )
  const handleSelectVizType = useMutateStateWithSync(
    (value) => ({
      path: ['pages', 'data', currentPage, 'charts', index],
      value: R.pipe(
        R.when(R.always(value === 'map'), R.dissoc('chartType')),
        R.assoc('type', value)
      )(CHART_DEFAULTS),
    }),
    [currentPage, index]
  )

  return (
    <DataGridModal
      open={index != null}
      slotProps={styles.modalSlots}
      {...{ label, labelExtra, onClose }}
    >
      <Select
        value={vizType}
        optionsList={vizTypeOptions}
        onSelect={handleSelectVizType}
      />
      <Card sx={styles.content}>
        {index != null &&
          (vizType === 'groupedOutput' ? (
            <GroupedOutputsToolbar {...{ index }} />
          ) : vizType === 'globalOutput' ? (
            <GlobalOutputsToolbar {...{ index }} />
          ) : (
            <MapToolbar {...{ index }} />
          ))}
      </Card>
    </DataGridModal>
  )
}

export default ChartToolsModal
