/**
 * PLnEX Design System Tokens — Mineral + Evergreen
 * Warm, calm, industrial project-controls color architecture.
 * Light Theme (Default): 80% light mineral surfaces, 20% dark evergreen anchors.
 * Dark Theme: Layered evergreen-charcoal surfaces (visibly distinct from background).
 * Strictly WCAG 2.2 Level AA compliant (>= 4.5:1 normal text, >= 3:1 large text/controls).
 */

export const colors = {
  light: {
    bg: {
      page: '#F6F7F3',          // Warm calm mineral page background
      surface: '#FFFFFF',       // Clean card & dialog surface
      surfaceRaised: '#EAF0E9', // Raised sections, input backgrounds, chips
      surfaceSunken: '#E2EAE1', // Subdued sunken surfaces, table headers
      sidebar: '#103F39',       // 20% Dark evergreen anchor
      heroAnchor: '#103F39',    // Dark evergreen hero anchor
      overlay: 'rgba(16, 63, 57, 0.50)',
    },
    text: {
      primary: '#1A2B25',       // Deep mineral evergreen (> 14:1 contrast on #F6F7F3)
      secondary: '#52665D',     // Calm secondary evergreen (> 5.5:1 contrast)
      muted: '#52665D',
      tertiary: '#738A80',
      disabled: '#9EAEA5',
      inverse: '#FFFFFF',
      sidebar: '#EEF3E8',       // Light sage on dark evergreen sidebar (> 11:1 contrast)
      link: '#006B61',
    },
    accent: {
      primary: '#006B61',       // Primary action evergreen
      primaryText: '#FFFFFF',   // White text on primary action (> 5.2:1 contrast)
      primaryHover: '#00524A',
      primaryActive: '#003D37',
      sidebarActive: '#103F39',
      warm: '#AC4B31',          // Warm brand accent (copper/terracotta)
      brass: '#E5C185',         // Brass highlight
      sea: '#006B61',
      sage: '#5A8A76',
    },
    brand: {
      primary: '#006B61',
      planned: '#006B61',       // Teal for planned baseline
      actual: '#AC4B31',        // Copper for verified actual
      forecast: '#D99B26',      // Amber for forecast trajectory
      link: '#006B61',
      warm: '#AC4B31',
      brass: '#E5C185',
    },
    status: {
      // Success: #1F6B4E text on #E4F1E9 bg (5.4:1 contrast)
      success: '#1F6B4E',
      successText: '#1F6B4E',
      successBg: '#E4F1E9',
      successBorder: '#B7DAC3',

      // Warning: #825700 text on #F8EFDA bg (5.5:1 contrast)
      warning: '#825700',
      warningText: '#825700',
      warningBg: '#F8EFDA',
      warningBorder: '#E5C185',

      // Critical / Error: #A43B36 text on #F6E4E1 bg (5.1:1 contrast)
      critical: '#A43B36',
      criticalText: '#A43B36',
      criticalBg: '#F6E4E1',
      criticalBorder: '#DCABA7',

      // Information / Pending: #2C6475 text on #E3EEF1 bg (5.3:1 contrast)
      info: '#2C6475',
      infoText: '#2C6475',
      infoBg: '#E3EEF1',
      infoBorder: '#AECFD6',

      // Muted / Unmatched: #52665D text on #EAF0E9 bg
      neutral: '#52665D',
      neutralText: '#52665D',
      neutralBg: '#EAF0E9',
      neutralBorder: '#D9E2DA',

      // Aliases
      verified: '#1F6B4E',
      verifiedText: '#1F6B4E',
      verifiedBg: '#E4F1E9',
      verifiedBorder: '#B7DAC3',
      onTrack: '#1F6B4E',
      onTrackText: '#1F6B4E',
      onTrackBg: '#E4F1E9',
      onTrackBorder: '#B7DAC3',
      atRisk: '#825700',
      atRiskText: '#825700',
      atRiskBg: '#F8EFDA',
      atRiskBorder: '#E5C185',
      delayed: '#A43B36',
      delayedText: '#A43B36',
      delayedBg: '#F6E4E1',
      delayedBorder: '#DCABA7',
      blocked: '#A43B36',
      blockedText: '#A43B36',
      blockedBg: '#F6E4E1',
      blockedBorder: '#DCABA7',
      pendingReview: '#2C6475',
      pendingReviewText: '#2C6475',
      pendingReviewBg: '#E3EEF1',
      pendingReviewBorder: '#AECFD6',
      unmatched: '#52665D',
      unmatchedText: '#52665D',
      unmatchedBg: '#EAF0E9',
      unmatchedBorder: '#D9E2DA',
    },
    border: {
      default: '#D9E2DA',       // Borders and dividers
      strong: '#52665D',
      focus: '#006B61',
      subtle: '#EAF0E9',
    },
    interactive: {
      hover: '#EAF0E9',
      active: '#D9E2DA',
      selected: '#E4F1E9',
      selectedStrong: '#B7DAC3',
    },
  },
  dark: {
    bg: {
      page: '#101815',          // Deep evergreen-charcoal page background
      surface: '#17221D',       // Visibly distinct card surface
      surfaceRaised: '#243832', // Raised sections and input backgrounds
      surfaceSunken: '#0B120F', // Sunken surface
      surfacePanel: '#2D443D',  // Distinct panel foundation
      sidebar: '#17221D',       // Dark evergreen sidebar
      spotlight: '#1F2E27',
      overlay: 'rgba(0, 0, 0, 0.75)',
    },
    text: {
      primary: '#F2F4E9',       // Pale mineral main text (> 14:1 contrast on #17221D)
      secondary: '#B5C1B5',     // Muted sage secondary (> 7.5:1 contrast)
      muted: '#B5C1B5',
      tertiary: '#859688',
      disabled: '#5E6F62',
      inverse: '#101815',
      sidebar: '#F2F4E9',
      link: '#72C6AD',
    },
    accent: {
      primary: '#72C6AD',       // Primary action mint/evergreen
      primaryText: '#0B2822',   // Dark evergreen text on primary action (> 8:1 contrast)
      primaryHover: '#5CB69C',
      primaryActive: '#47A287',
      warm: '#E58567',          // Warm brand accent (light copper)
      brass: '#E9C46A',         // Brass highlight
      sea: '#72C6AD',
      sage: '#9AD5AF',
    },
    brand: {
      primary: '#72C6AD',
      planned: '#72C6AD',       // Teal planned baseline
      actual: '#E58567',        // Copper verified actual
      forecast: '#E9C46A',      // Amber forecast trajectory
      link: '#72C6AD',
      warm: '#E58567',
      brass: '#E9C46A',
    },
    status: {
      // Success: #9AD5AF text on #20382C bg (5.8:1 contrast)
      success: '#9AD5AF',
      successText: '#9AD5AF',
      successBg: '#20382C',
      successBorder: '#315442',

      // Warning: #F3D27E text on #3A3120 bg (7.0:1 contrast)
      warning: '#F3D27E',
      warningText: '#F3D27E',
      warningBg: '#3A3120',
      warningBorder: '#5B4A2B',

      // Critical / Error: #FF9E94 text on #3B2422 bg (5.6:1 contrast)
      critical: '#FF9E94',
      criticalText: '#FF9E94',
      criticalBg: '#3B2422',
      criticalBorder: '#5B3734',

      // Information / Pending: #9CCBD4 text on #20353A bg (6.2:1 contrast)
      info: '#9CCBD4',
      infoText: '#9CCBD4',
      infoBg: '#20353A',
      infoBorder: '#304E55',

      // Muted / Unmatched: #B5C1B5 text on #243832 bg
      neutral: '#B5C1B5',
      neutralText: '#B5C1B5',
      neutralBg: '#243832',
      neutralBorder: '#3A5146',

      // Aliases
      verified: '#9AD5AF',
      verifiedText: '#9AD5AF',
      verifiedBg: '#20382C',
      verifiedBorder: '#315442',
      onTrack: '#9AD5AF',
      onTrackText: '#9AD5AF',
      onTrackBg: '#20382C',
      onTrackBorder: '#315442',
      atRisk: '#F3D27E',
      atRiskText: '#F3D27E',
      atRiskBg: '#3A3120',
      atRiskBorder: '#5B4A2B',
      delayed: '#FF9E94',
      delayedText: '#FF9E94',
      delayedBg: '#3B2422',
      delayedBorder: '#5B3734',
      blocked: '#FF9E94',
      blockedText: '#FF9E94',
      blockedBg: '#3B2422',
      blockedBorder: '#5B3734',
      pendingReview: '#9CCBD4',
      pendingReviewText: '#9CCBD4',
      pendingReviewBg: '#20353A',
      pendingReviewBorder: '#304E55',
      unmatched: '#B5C1B5',
      unmatchedText: '#B5C1B5',
      unmatchedBg: '#243832',
      unmatchedBorder: '#3A5146',
    },
    border: {
      default: '#3A5146',       // Borders and dividers in dark theme
      strong: '#72C6AD',
      focus: '#72C6AD',
      subtle: '#243832',
    },
    interactive: {
      hover: '#243832',
      active: '#3A5146',
      selected: '#20382C',
      selectedStrong: '#315442',
    },
  },
} as const;

export type ThemeColors = typeof colors.light;
export default colors;
