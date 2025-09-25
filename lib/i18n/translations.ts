export const translations = {
  en: {
    // App Info
    appName: "VanGo Delivery",
    appVersion: "v1.1.0",
    companyName: "VanGo Delivery (PTY) Ltd. 2025",

    // Navigation
    home: "Home",
    profile: "Profile",
    trackDelivery: "Track Delivery",
    deliveryHistory: "Delivery History",
    driversPortal: "Drivers Portal",
    notifications: "Notifications",
    services: "Services",
    deliveryAreas: "Delivery Areas",
    learnMore: "Learn More",
    settings: "Settings",
    helpSupport: "Help & Support",

    // Settings
    accountSettings: "Account Settings",
    paymentSettings: "Payment Settings",
    notificationPreferences: "Notification Preferences",
    appSettings: "App Settings",
    language: "Language",
    theme: "Theme",
    appVersion: "App Version",
    shareApp: "Share App",

    // Legal
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    copyrightPolicy: "Copyright Policy",

    // Common
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
    success: "Success",
    error: "Error",
  },
  af: {
    // App Info
    appName: "VanGo Aflewering",
    appVersion: "v1.1.0",
    companyName: "VanGo Delivery (PTY) Ltd. 2025",

    // Navigation
    home: "Tuis",
    profile: "Profiel",
    trackDelivery: "Volg Aflewering",
    deliveryHistory: "Afleveringsgeskiedenis",
    driversPortal: "Bestuurders Portaal",
    notifications: "Kennisgewings",
    services: "Dienste",
    deliveryAreas: "Afleveringsgebiede",
    learnMore: "Leer Meer",
    settings: "Instellings",
    helpSupport: "Hulp & Ondersteuning",

    // Settings
    accountSettings: "Rekening Instellings",
    paymentSettings: "Betaling Instellings",
    notificationPreferences: "Kennisgewing Voorkeure",
    appSettings: "App Instellings",
    language: "Taal",
    theme: "Tema",
    appVersion: "App Weergawe",
    shareApp: "Deel App",

    // Legal
    termsOfService: "Diensbepalings",
    privacyPolicy: "Privaatheidsbeleid",
    copyrightPolicy: "Kopiereg Beleid",

    // Common
    save: "Stoor",
    cancel: "Kanselleer",
    loading: "Laai...",
    success: "Sukses",
    error: "Fout",
  },
  zu: {
    // App Info
    appName: "VanGo Ukulethwa",
    appVersion: "v1.1.0",
    companyName: "VanGo Delivery (PTY) Ltd. 2025",

    // Navigation
    home: "Ikhaya",
    profile: "Iphrofayela",
    trackDelivery: "Landela Ukulethwa",
    deliveryHistory: "Umlando Wokulethwa",
    driversPortal: "Iphothali Labashayeli",
    notifications: "Izaziso",
    services: "Amasevisi",
    deliveryAreas: "Izindawo Zokulethwa",
    learnMore: "Funda Kabanzi",
    settings: "Izilungiselelo",
    helpSupport: "Usizo & Ukusekela",

    // Settings
    accountSettings: "Izilungiselelo Ze-akhawunti",
    paymentSettings: "Izilungiselelo Zokukhokha",
    notificationPreferences: "Okukhethwayo Kwezaziso",
    appSettings: "Izilungiselelo Ze-app",
    language: "Ulimi",
    theme: "Itimu",
    appVersion: "Inguqulo Ye-app",
    shareApp: "Yabelana Nge-app",

    // Legal
    termsOfService: "Imigomo Yesevisi",
    privacyPolicy: "Inqubomgomo Yobumfihlo",
    copyrightPolicy: "Inqubomgomo Yamalungelo Okushicilela",

    // Common
    save: "Gcina",
    cancel: "Khansela",
    loading: "Iyalayisha...",
    success: "Impumelelo",
    error: "Iphutha",
  },
  st: {
    // App Info
    appName: "VanGo Delivery",
    appVersion: "v1.1.0",
    companyName: "VanGo Delivery (PTY) Ltd. 2025",

    // Navigation
    home: "Hae",
    profile: "Profaele",
    trackDelivery: "Latela Delivery",
    deliveryHistory: "Nalane ya Delivery",
    driversPortal: "Portal ya Bakhanni",
    notifications: "Ditsebiso",
    services: "Ditshebeletso",
    deliveryAreas: "Mafelo a Delivery",
    learnMore: "Ithute Haholwanyane",
    settings: "Ditlhophiso",
    helpSupport: "Thuso & Tshehetsho",

    // Settings
    accountSettings: "Ditlhophiso tsa Akhaonto",
    paymentSettings: "Ditlhophiso tsa Tefo",
    notificationPreferences: "Dikgetho tsa Ditsebiso",
    appSettings: "Ditlhophiso tsa App",
    language: "Puo",
    theme: "Setaele",
    appVersion: "Mofuta wa App",
    shareApp: "Arolelana App",

    // Legal
    termsOfService: "Melawana ya Tshebeletso",
    privacyPolicy: "Leano la Lekunutu",
    copyrightPolicy: "Leano la Ditokelo tsa Mongodi",

    // Common
    save: "Boloka",
    cancel: "Hlakola",
    loading: "E a jara...",
    success: "Katleho",
    error: "Phoso",
  },
}

export function useTranslation(language = "en") {
  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations[language as keyof typeof translations] || translations.en

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  return { t }
}
