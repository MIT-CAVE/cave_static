import React from 'react'
import { expect, userEvent, within } from 'storybook/test'

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

export const OverflowSessions = {
  render: () => <SessionPane width={460} />,
  parameters: {
    layoutWidth: '460px',
    layoutHeight: '700px',
    preloadedState: {
      utilities: {
        sessions: {
          session_id: 'session_1',
          data: {
            team_1: {
              teamId: 'team_1',
              teamName: 'Team Alpha',
              sessions: Object.fromEntries(
                Array.from({ length: 10 }, (_, i) => [
                  `session_${i + 1}`,
                  {
                    sessionId: `session_${i + 1}`,
                    sessionName: `Session ${i + 1}`,
                    sessionDescription: `Description for session ${i + 1}`,
                  },
                ])
              ),
            },
          },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const scroller = canvasElement.querySelector('.MuiDataGrid-virtualScroller')
    const footer = canvasElement.querySelector('.MuiDataGrid-footerContainer')

    const scrollerCanvas = within(scroller)

    // Verify DataGrid rows area is scrollable
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight)
    scroller.scrollTop = 100
    expect(scroller.scrollTop).toBeGreaterThan(0)

    // Verify initial pagination state (page 1)
    expect(footer.textContent).toContain('1–5 of 10')
    expect(scrollerCanvas.getByText('Session 1')).toBeInTheDocument()
    expect(scrollerCanvas.getByText('Session 5')).toBeInTheDocument()
    expect(scrollerCanvas.queryByText('Session 6')).toBeNull()

    // Navigate to next page
    const nextPageBtn = canvas.getByRole('button', { name: /next page/i })
    await userEvent.click(nextPageBtn)

    // Verify second page
    expect(footer.textContent).toContain('6–10 of 10')
    expect(scrollerCanvas.getByText('Session 6')).toBeInTheDocument()
    expect(scrollerCanvas.getByText('Session 10')).toBeInTheDocument()
    expect(scrollerCanvas.queryByText('Session 1')).toBeNull()
  },
}
