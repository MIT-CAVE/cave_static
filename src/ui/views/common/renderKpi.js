// As different types of KPIs grow, this may look like the renderProp pattern
// Perhaps combining props and kpis is a better approach
import * as R from 'ramda'

import { viewId } from '../../../utils/enums'

import { KpiBasic, KpiMap } from '../../compound'

const getRenderer = R.cond([
  [R.equals(viewId.KPI), R.always(KpiBasic)],
  [R.equals(viewId.MAP), R.always(KpiMap)],
  [
    R.T,
    (view) => {
      throw Error(`Invalid view '${view}'`)
    },
  ],
])

const renderKpi = ({ view = viewId.KPI, ...props }) => {
  const KpiComponent = getRenderer(view)
  return <KpiComponent {...props} />
}

export default renderKpi
