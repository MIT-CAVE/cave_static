import { createTheme } from '@mui/material'

const light = {
  palette: {
    mode: 'light',
    greyscale: {
      main: '#35373c',
      light: '#cacdd9',
      dark: '#91959e',
      contrastText: '#ffffff',
    },
    background: {
      paper: '#fbfbfb',
    },
  },
  components: {
    // MuiButton:{
    //   styleOverrides: {
    //     root: {
    //       color: '#000000',
    //     }
    //   }
    // }
  },
}

const dark = {
  palette: {
    mode: 'dark',
    greyscale: {
      main: '#f2f4f9',
      light: '#99a0b4',
      dark: '#373b47',
      contrastText: '#000000',
    },
    background: {
      paper: '#4a4a4a',
    },
  },
  components: {
    // MuiButton:{
    //   styleOverrides: {
    //     root: {
    //       color: '#ffffff',
    //     }
    //   }
    // }
  },
}

// https://mui.com/customization/palette/
// https://mui.com/customization/default-theme/
export const getTheme = (theme) => {
  return createTheme(theme === 'dark' ? dark : light)
}
