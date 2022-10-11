import * as R from 'ramda'
import { useDispatch, useSelector } from 'react-redux'

import { renderPropsLayout } from './renderLayout'

import { fetchData } from '../../../data/data'
import { selectAppBarData, selectOpenPane } from '../../../data/selectors'

const OptionsPane = () => {
  const appBarData = useSelector(selectAppBarData)
  const open = useSelector(selectOpenPane)
  const dispatch = useDispatch()

  const { layout, props: items } = R.propOr({}, open)(appBarData)
  const onChangeProp = (prop, propId) => (value) => {
    dispatch(
      fetchData({
        url: `${window.location.ancestorOrigins[0]}/mutate_session/`,
        fetchMethod: 'POST',
        body: {
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

  return renderPropsLayout({ layout, items, onChangeProp })
}

export default OptionsPane
