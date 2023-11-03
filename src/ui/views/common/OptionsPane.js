import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import { renderPropsLayout } from './renderLayout'

import { sendCommand } from '../../../data/data'
import { layoutType } from '../../../utils/enums'

import { addValuesToProps } from '../../../utils'

const OptionsPane = ({ open, pane }) => {
  const dispatch = useDispatch()

  const { layout, props: items, values } = pane
  // The root elements of an options pane should be arranged in a single
  // column by default, unless explicitly set otherwise by the API designers
  const optsPaneLayout = R.pipe(
    R.defaultTo({ type: layoutType.GRID }),
    R.unless(R.has('numColumns'), R.assoc('numColumns', 1))
  )(layout)
  const propsWithValues = addValuesToProps(items, values)
  const onChangeProp = (prop, propId) => (value) => {
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          data_name: 'panes',
          data_path: ['data', open, 'values', propId],
          data_value: value,
          mutation_type: 'mutate',
          api_command: R.prop('apiCommand', prop),
          api_command_keys: R.prop('apiCommandKeys', prop),
        },
      })
    )
  }

  return renderPropsLayout({
    layout: optsPaneLayout,
    items: propsWithValues,
    onChangeProp,
  })
}

export default OptionsPane
