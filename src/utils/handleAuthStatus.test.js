import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import handleAuthStatus from './handleAuthStatus'
import * as postToParentModule from './PostToParent'

describe('handleAuthStatus', () => {
  let postToParentSpy

  beforeEach(() => {
    postToParentSpy = vi
      .spyOn(postToParentModule, 'default')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('posts unauthorized with default redirect when authenticated is false', () => {
    handleAuthStatus({
      event: 'auth_status',
      authenticated: false,
    })

    expect(postToParentSpy).toHaveBeenCalledWith({
      event: 'ws_status',
      status: 'unauthorized',
      redirect: '/cave/auth/login/',
    })
  })

  it('posts unauthorized with custom redirect when provided', () => {
    handleAuthStatus({
      event: 'auth_status',
      authenticated: false,
      redirect: '/cave/custom/login/',
    })

    expect(postToParentSpy).toHaveBeenCalledWith({
      event: 'ws_status',
      status: 'unauthorized',
      redirect: '/cave/custom/login/',
    })
  })

  it('does nothing when authenticated is true', () => {
    handleAuthStatus({
      event: 'auth_status',
      authenticated: true,
    })

    expect(postToParentSpy).not.toHaveBeenCalled()
  })
})
