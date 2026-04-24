import PropTypes from 'prop-types'
import { Children, cloneElement } from 'react'
import { AutoSizer } from 'react-virtualized-auto-sizer'

const FlexibleContainer = ({ children }) => (
  <div style={{ flex: '1 1 auto' }}>
    <AutoSizer
      renderProp={({ height = 1, width = 1 }) =>
        cloneElement(Children.only(children), { style: { height, width } })
      }
    />
  </div>
)
FlexibleContainer.propTypes = {
  children: PropTypes.node,
}

export default FlexibleContainer
