// As different types of KPIs grow, this should mimic the renderProp pattern
// Perhaps combining props and kpis is a better approach
import { KpiBasic } from '../../compound'

const renderKpi = ({ ...props }) => <KpiBasic {...props} />

export default renderKpi
