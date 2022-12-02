import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          color: '#FFFFFF',
          backgroundColor: '#FA5757',
          boxShadow: '0px 1px 2px 0px #0000000D',
          borderRadius: '6px',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: "#ED4E4E",
         },
        },
        outlined: {
          color: '#374151',
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 1px 2px 0px #0000000D',
          borderRadius: '6px',
          border: '1px solid #D1D5DB',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: "#F4F5F8",
            border: '1px solid #D1D5DB',
         },
        },
        outlinedSecondary: {
          textAlign: 'left',
        },
      },
    },
  },
  typography: {
    fontFamily: 'Satoshi-Variable',
  },
  palette: {
    success: {
      main: '#D1FAE5',
      contrastText: '#065F46',
    },
    primary: {
      main: '#FA5757',
      dark: '#ff7981',
      light: '#860a25',
      contrastText: '#fff',
    },
    secondary: {
      main: '#c088cf',
      dark: '#b65fcd',
      light: '#e9b8f5',
      contrastText: '#000',
    },
    info: {
      main: '#f3f81f',
      dark: '#f5f863',
      light: '#fcfdcc',
    },
  },
});
