const scaleModeStyles = {
  fitWidth: { maxWidth: '100%', width: '100%' },
  fitHeight: { maxHeight: '100%', height: '100%' },
  fitContainer: { height: '100%', width: '100%' },
}

/**
 * Resolves the sizing styles of a `media` prop. `scaleMode` takes precedence
 * over `fullWidth`, which is an alias of `scaleMode: 'fitWidth'`.
 */
export const getScaleModeStyle = ({ scaleMode, fullWidth }) =>
  scaleModeStyles[scaleMode ?? (fullWidth ? 'fitWidth' : undefined)]
