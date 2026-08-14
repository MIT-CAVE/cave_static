import React from 'react'

import SnackBar from '../../../ui/views/common/SnackBar'

const snackBarStories = {
  title: 'Views/Common/SnackBar',
  component: SnackBar,
  parameters: {
    layoutWidth: '800px',
    layoutHeight: '400px',
  },
}

export default snackBarStories

export const ActiveAlerts = {
  render: () => <SnackBar />,
  parameters: {
    preloadedState: {
      utilities: {
        messages: {
          msg1: {
            snackbarType: 'error',
            message: 'Critical error: Database connection failed.',
          },
          msg2: {
            snackbarType: 'warning',
            message: 'Warning: CPU usage exceeds 90%.',
          },
          msg3: {
            snackbarType: 'success',
            message: 'Success: Deployment finished successfully.',
          },
        },
      },
    },
  },
}

export const Empty = {
  render: () => <SnackBar />,
  parameters: {
    preloadedState: {
      utilities: {
        messages: {},
      },
    },
  },
}
