import React from 'react'

import SessionPane from '../../../ui/views/common/SessionPane'

const sessionPaneStories = {
  title: 'Views/Common/SessionPane',
  component: SessionPane,
  parameters: {
    layoutWidth: '460px',
    layoutHeight: '1400px',
  },
}

export default sessionPaneStories

export const Default = {
  render: () => <SessionPane />,
  parameters: {
    preloadedState: {
      utilities: {
        sessions: {
          session_id: 'session_1',
          data: {
            team_1: {
              teamId: 'team_1',
              teamName: 'Team Alpha',
              sessions: {
                session_1: {
                  sessionId: 'session_1',
                  sessionName: 'Production Run A',
                },
                session_2: {
                  sessionId: 'session_2',
                  sessionName: 'Scenario Planning B',
                },
              },
            },
            team_2: {
              teamId: 'team_2',
              teamName: 'Team Beta',
              sessions: {
                session_3: {
                  sessionId: 'session_3',
                  sessionName: 'Optimization Model C',
                },
              },
            },
          },
        },
      },
    },
  },
}
