import * as R from 'ramda'
import { useDispatch, useSelector } from 'react-redux'

import { renderPropsLayout } from './renderLayout'

import { sendCommand } from '../../../data/data'
import { selectAppBarData, selectOpenPane } from '../../../data/selectors'
import { layoutType } from '../../../utils/enums'

const OptionsPane = () => {
  const appBarData = useSelector(selectAppBarData)
  const open = useSelector(selectOpenPane)
  const dispatch = useDispatch()

  const { layout, props: items } = R.propOr({}, open)(appBarData)
  // The root elements of an options pane should be arranged in a single
  // column by default, unless explicitly set otherwise by the API designers
  const optsPaneLayout = R.pipe(
    R.defaultTo({ type: layoutType.GRID }),
    R.unless(R.has('numColumns'), R.assoc('numColumns', 1))
  )(layout)
  const onChangeProp = (prop, propId) => (value) => {
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          data_name: 'appBar',
          data_path: ['data', open, 'props', propId, 'value'],
          data_value: value,
          mutation_type: 'mutate',
          api_command: R.prop('apiCommand', prop),
          api_command_keys: R.prop('apiCommandKeys', prop),
        },
      })
    )
  }

  return renderPropsLayout({ layout: optsPaneLayout, items, onChangeProp })
}

export default OptionsPane
