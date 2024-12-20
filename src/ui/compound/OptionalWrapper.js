import PropTypes from 'prop-types'

const OptionalWrapper = ({
  component: Component,
  wrap,
  wrapperProps,
  children,
}) => (wrap ? <Component {...wrapperProps}>{children}</Component> : children)
OptionalWrapper.propTypes = {
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
    .isRequired,
  wrap: PropTypes.bool,
  wrapperProps: PropTypes.object,
  children: PropTypes.node,
}

export default OptionalWrapper
