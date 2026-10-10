/**
 * AdConfig - Ad configuration and unit IDs.
 * 
 * IMPORTANT: These are PLACEHOLDER IDs for development only.
 * Replace with real AdMob unit IDs before publishing.
 * 
 * For child-directed apps:
 * - Use only non-personalized ads
 * - Ensure ad content is appropriate for children
 * - Consider using AdMob's family-approved ad filter
 * - Review Google Play Families policy requirements
 */
export const AD_CONFIG = {
  // Platform-specific app IDs (replace before publishing)
  appIds: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX'
  },

  // Ad unit IDs (replace before publishing)
  unitIds: {
    // Development test IDs (safe for testing)
    test: {
      banner: 'ca-app-pub-3940256099942544/6300978111',
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded: 'ca-app-pub-3940256099942544/5224354917'
    },
    // Production IDs (replace with real ones)
    production: {
      banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
      interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
      rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'
    }
  },

  // Ad display rules
  rules: {
    // Minimum time between interstitials (seconds)
    interstitialInterval: 120,
    
    // Minimum activities before showing interstitial
    minActivitiesBeforeInterstitial: 5,
    
    // Maximum ads per session
    maxAdsPerSession: 10,
    
    // Whether to show ads during gameplay (vs. only between scenes)
    showDuringGameplay: false,
    
    // Reward amounts
    rewards: {
      watchRewardedAd: {
        coins: 50,
        stars: 1
      }
    }
  },

  // Child safety settings
  childSafety: {
    // Use only family-approved ads
    familyApproved: true,
    
    // No personalized ads
    personalizedAds: false,
    
    // Age gate before showing any ads
    requireAgeGate: true,
    
    // Minimum age for ads (if no age gate)
    minimumAge: 13,
    
    // Ad content rating
    maxAdRating: 'G', // General audiences only
    
    // Block certain ad categories
    blockedCategories: [
      'alcohol',
      'gambling', 
      'dating',
      'weapons',
      'politics'
    ]
  },

  // Capacitor plugin configuration
  capacitor: {
    // Plugin to use (example: @capacitor-community/admob)
    plugin: '@capacitor-community/admob',
    
    // Initialize on app start
    initializeOnStart: false,
    
    // Request tracking authorization (iOS)
    requestTrackingAuthorization: false
  }
};

export default AD_CONFIG;
