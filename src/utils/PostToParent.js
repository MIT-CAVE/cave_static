const postToParent = (payload) => {
  if (
    typeof window !== 'undefined' &&
    window.parent &&
    window.parent !== window
  ) {
    const targetOrigin =
      window.location?.ancestorOrigins &&
      window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[0]
        : '*'
    try {
      window.parent.postMessage(payload, targetOrigin)
    } catch (e) {
      console.warn('Failed to post message to parent window:', e)
    }
  }
}

export default postToParent
