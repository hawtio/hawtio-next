const HAWTIO_DISABLE_THEME_LISTENER = 'hawtio.disableThemeListener'

const PATTERNFLY_THEME_CLASS = 'pf-v5-theme-dark'

// Actual window theme query
function themeList() {
  return window.matchMedia('(prefers-color-scheme: dark)')
}

/**
 * Detect what theme the browser has been set to and
 * return 'dark' | 'light'
 */
function windowTheme() {
  return themeList().matches ? 'dark' : 'light'
}

/**
 * Update the document root with the patternfly dark class
 * see https://www.patternfly.org/developer-resources/dark-theme-handbook
 */
function updateFromTheme() {
  if (windowTheme() === 'dark') {
    document.documentElement.classList.add(PATTERNFLY_THEME_CLASS)
  } else {
    document.documentElement.classList.remove(PATTERNFLY_THEME_CLASS)
  }
}

/**
 * Adds an event listener to the window theme to update
 * css values in the event of a change in theme
 */
export function initWindowThemeListener() {
  const disableListener = localStorage.getItem(HAWTIO_DISABLE_THEME_LISTENER) || 'false'
  if (disableListener === 'true') {
    return // Do not enable theme listener
  }

  // Initial update when application is loaded
  updateFromTheme()

  // Subsequent attempts to change the theme
  themeList().addEventListener('change', _ => {
    updateFromTheme()
  })
}
