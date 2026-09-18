import { Box, Paper, Typography } from '@mui/material'
import React from 'react'

import Carousel from '../../ui/compound/Carousel'

const carouselStories = {
  title: 'Compound/Carousel',
  component: Carousel,
  parameters: {
    layoutWidth: '400px',
  },
}

export default carouselStories

const Slide = ({ label, width }) => (
  <Paper
    elevation={2}
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width,
      height: 64,
      flexShrink: 0,
    }}
  >
    <Typography variant="body2">{label}</Typography>
  </Paper>
)

export const VariableWidthOverflow = {
  render: () => (
    <Box sx={{ width: '100%' }}>
      <Carousel>
        {[
          <Slide key="1" label="Revenue" width={100} />,
          <Slide key="2" label="Cost" width={140} />,
          <Slide key="3" label="Net Margin" width={160} />,
          <Slide key="4" label="Units Shipped" width={180} />,
          <Slide key="5" label="On-Time Delivery" width={200} />,
          <Slide key="6" label="Active Vehicles" width={160} />,
        ]}
      </Carousel>
    </Box>
  ),
}

export const NoOverflow = {
  render: () => (
    <Box sx={{ width: '100%' }}>
      <Carousel>
        {[
          <Slide key="1" label="Revenue" width={100} />,
          <Slide key="2" label="Cost" width={100} />,
        ]}
      </Carousel>
    </Box>
  ),
}
