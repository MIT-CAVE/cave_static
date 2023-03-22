import * as R from 'ramda'
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, timer: null }
  }

  componentDidCatch() {
    // check if error has resolved every 5 seconds
    const timer = setTimeout(() => {
      this.setState({ hasError: false, timer: null })
    }, 5000)
    this.setState({ hasError: true, timer })
  }

  componentWillUnmount() {
    if (!R.isNil(this.state.timer)) clearTimeout(this.state.timer)
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback
    }
    return this.props.children
  }
}

export default ErrorBoundary
