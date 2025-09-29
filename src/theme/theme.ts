import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      secondary: string;
    };
  }
  interface PaletteOptions {
    gradient: {
      primary: string;
      secondary: string;
    };
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#4361ee',
      light: '#4cc9f0',
      dark: '#3a0ca3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f72585',
      light: '#ff70a6',
      dark: '#b5179e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
      secondary: 'linear-gradient(135deg, #f72585 0%, #b5179e 100%)',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          minHeight: '100%',
        },
        a: {
          textDecoration: 'none',
          color: 'inherit',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontWeight: 500,
          textTransform: 'none',
          transition: 'all 0.3s ease',
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f8f9fa',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: alpha('#4361ee', 0.1),
            '&:hover': {
              backgroundColor: alpha('#4361ee', 0.15),
            },
          },
          '&:hover': {
            backgroundColor: alpha('#4361ee', 0.05),
          },
        },
      },
    },
  },
});

export default theme;
