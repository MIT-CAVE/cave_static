// It may be convenient to create a component with the functionality
// of the `WrappedText` and `OverflowText` components combined.

const styles = {
  wrapAlways: {
    // Pros:
    // - Doesn't split words (only in spaces)
    // - Scales well with very long texts (unlikely edge case)
    // Con:
    // - Always wraps multiple words even if it's not necessary
    width: 'min-content',
    overflowWrap: 'break-word',
  },
  wrapAnywhere: {
    // Pros:
    // - Wraps text only when necessary
    // Cons:
    // - Breaks words at any character to fit in a long text
    // - Doesn't scale well with very long texts (unlikely edge case)
    width: 'fit-content',
    overflowWrap: 'anywhere',
  },
}

const WrappedText = ({ text }) => <span style={styles.wrapAlways}>{text}</span>

export default WrappedText
