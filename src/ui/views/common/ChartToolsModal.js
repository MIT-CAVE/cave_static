import { Card } from '@mui/material'
import * as R from 'ramda'

import { DataGridModal } from './BaseModal'

import { CHART_DEFAULTS } from '../../../utils/constants'
import { chartVariant } from '../../../utils/enums'
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
}

const ChartToolsModal = ({
  open,
  label,
  labelExtra,
  onClose,
  chartObj,
  index,
  path,
}) => {
  const handleSelectVizType = useMutateStateWithSync(
    (value) => {
      return {
        path,
        value: R.pipe(
          value === chartVariant.map ? R.dissoc('chartType') : R.identity,
          R.assoc('type', value)
        )(CHART_DEFAULTS),
      }
    },
    [chartObj, path, CHART_DEFAULTS]
  )

  return (
    <DataGridModal
      slotProps={{
        paper: {
          sx: {
            width: '1200px',
            height: '900px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          },
        },
      }}
      {...{ label, labelExtra, open, onClose }}
    >
      <Select
        value={R.propOr('groupedOutput', 'type')(chartObj)}
        optionsList={[
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
        ]}
        onSelect={handleSelectVizType}
      />
      <Card sx={styles.content}>
        {R.propOr('groupedOutput', 'type', chartObj) === 'groupedOutput' ? (
          <GroupedOutputsToolbar {...{ chartObj, index }} />
        ) : chartObj.type === 'globalOutput' ? (
          <GlobalOutputsToolbar {...{ chartObj, index }} />
        ) : (
          <MapToolbar {...{ chartObj, index }} />
        )}
      </Card>
    </DataGridModal>
  )
}

export default ChartToolsModal
