/**
 * ThemeProvider - Quản lý dark/light mode với localStorage persistence.
 */

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactElement,
  useContext,
  PropsWithChildren,
} from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { PaletteMode } from '@mui/material';
import { createTheme } from '@mui/material/styles';

export type { PaletteMode };

const STORAGE_KEY = 'kds_guard_theme_mode';

const basePalette = {
  grey: {
    50: '#F6F6FF',
    100: '#F2F1FF',
    200: '#EBEBF9',
    300: '#CAC9D7',
    400: '#ACACB9',
    500: '#82818F',
    600: '#6D6D7A',
    700: '#4D4D59',
    800: '#2B2B36',
    900: '#21222D',
  },
};

function buildLightTheme() {
  return createTheme({
    palette: {
      mode: 'light',
      ...basePalette,
      primary: {
        light: '#A9DFD8',
        main: '#3AB4A4',
        dark: '#00927E',
      },
      secondary: {
        light: '#F2C8ED',
        main: '#E27FD7',
        dark: '#D95ECD',
      },
      success: {
        light: '#9AD693',
        main: '#17AE13',
        dark: '#008D00',
      },
      info: {
        light: '#B5E6FB',
        main: '#20AEF3',
        dark: '#188BD0',
      },
      warning: {
        light: '#FDE0B6',
        main: '#FB9A23',
        dark: '#F07F1E',
      },
      error: {
        light: '#FFCCD6',
        main: '#FF3F56',
        dark: '#FC003C',
      },
      background: {
        default: '#F6F6FF',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#171821',
        secondary: '#4D4D59',
        disabled: '#6D6D7A',
      },
      divider: '#D9D9E3',
      action: {
        focus: '#3AB4A4',
        hover: 'rgba(0, 0, 0, 0.06)',
        disabled: '#82818F',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 4 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: '#CAC9D7 #EBEBF9',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: 8,
              height: 8,
            },
            '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
              background: '#EBEBF9',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              background: '#CAC9D7',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              background: '#ACACB9',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            border: '1px solid #D9D9E3',
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          },
        },
      },
    },
  });
}

function buildDarkTheme() {
  return createTheme({
    palette: {
      mode: 'dark',
      ...basePalette,
      primary: {
        light: '#A9DFD8',
        main: '#3AB4A4',
        dark: '#73CABE',
      },
      secondary: {
        light: '#F2C8ED',
        main: '#E27FD7',
        dark: '#D95ECD',
      },
      success: {
        light: '#9AD693',
        main: '#17AE13',
        dark: '#008D00',
      },
      info: {
        light: '#B5E6FB',
        main: '#20AEF3',
        dark: '#188BD0',
      },
      warning: {
        light: '#FDE0B6',
        main: '#FB9A23',
        dark: '#F07F1E',
      },
      error: {
        light: '#FFCCD6',
        main: '#FF3F56',
        dark: '#FC003C',
      },
      background: {
        default: '#0a0e1a',
        paper: '#171821',
      },
      text: {
        primary: '#F6F6FF',
        secondary: '#CAC9D7',
        disabled: '#6D6D7A',
      },
      divider: '#2B2B36',
      action: {
        focus: '#3AB4A4',
        disabled: '#4D4D59',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 4 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: '#3AB4A4 #171821',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: 8,
              height: 8,
            },
            '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
              background: '#171821',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              background: '#3AB4A4',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              background: '#00A391',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            border: '1px solid #2B2B36',
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
          },
        },
      },
    },
  });
}

interface ThemeContextInterface {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (mode: PaletteMode) => void;
}

export const ThemeContext = createContext<ThemeContextInterface>({
  mode: 'dark',
  toggleMode: () => {},
  setMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

interface ThemeProviderProps extends PropsWithChildren {
  children?: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): ReactElement {
  const [mode, setModeState] = useState<PaletteMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode]);

  const toggleMode = useCallback(() => {
    setModeState((prev: PaletteMode) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setMode = useCallback((newMode: PaletteMode) => {
    setModeState(newMode);
  }, []);

  const theme = useMemo(
    () => (mode === 'dark' ? buildDarkTheme() : buildLightTheme()),
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, setMode }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
