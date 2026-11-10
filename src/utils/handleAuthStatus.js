import postToParent from './PostToParent'

const handleAuthStatus = (payload) => {
  if (payload?.authenticated === false) {
    postToParent({
      event: 'ws_status',
      status: 'unauthorized',
      redirect: payload.redirect || '/cave/auth/login/',
    })
  }
}

export default handleAuthStatus
