import mapControlReducer from './mapControlSlice'
import mapLegendReducer from './mapLegendSlice'
import mapModalReducer from './mapModalSlice'

import { combineReducers } from '../../../utils'

export default combineReducers({
  mapControls: mapControlReducer,
  mapLegend: mapLegendReducer,
  mapModal: mapModalReducer,
})
