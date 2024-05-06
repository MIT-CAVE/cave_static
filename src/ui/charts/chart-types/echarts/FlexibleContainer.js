import PropTypes from 'prop-types'
import { Children } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'

import { addExtraProps } from '../../../../utils'

const FlexibleContainer = ({ children }) => (
  <div style={{ flex: '1 1 auto' }}>
    <AutoSizer defaultHeight={1} defaultWidth={1}>
      {({ height, width }) =>
        addExtraProps(Children.only(children), { style: { height, width } })
      }
    </AutoSizer>
  </div>
)
FlexibleContainer.propTypes = {
  children: PropTypes.node,
}

export default FlexibleContainer
