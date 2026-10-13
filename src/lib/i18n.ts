/**
 * UI translations (Phase 4F — Hindi / English toggle).
 *
 * SCOPE — deliberately narrow:
 *   - Only OUR OWN chrome is translated: navigation, buttons, table headers,
 *     panel titles, form labels, static helper copy.
 *   - Content that comes from an official notification (job titles, department
 *     names, eligibility text, dates, FAQ answers written from the notice) is
 *     NEVER translated. Inventing a Hindi version of an official post name
 *     would misstate what the board actually published. Hinglish stays in the
 *     data itself (e.g. "Home Guard", "Constable"), which is how aspirants
 *     search anyway.
 *
 * MECHANICS — cookie + server rendering:
 *   - Language lives in a `lang` cookie, read in proxy.ts and exposed to
 *     server components, so pages render correctly on first paint with no
 *     client JavaScript and no layout shift.
 *   - Only UI labels change; canonical URLs stay language-neutral, and
 *     hreflang + x-default are emitted in the layout.
 */

export const LANGS = ["en", "hi"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_COOKIE = "lang";

export const DEFAULT_LANG: Lang = "en";

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

const dict = {
  en: {
    // chrome
    skipToContent: "Skip to main content",
    independentPortal: "An independent job information portal · Not a government website",
    loginRegister: "Login / Register",
    languageLabel: "हिंदी",
    languageTitle: "Switch the interface to Hindi",
    notGovernmentNotice:
      "An independent job information portal. Not a government website.",
    // generic actions
    apply: "Apply",
    applyOnline: "Apply Online (Official Website)",
    view: "View",
    viewAllJobs: "View All Jobs →",
    search: "Search",
    searchPlaceholder: "Search jobs — e.g. Bihar Police, BPSC, 10th pass",
    viewDetails: "View details",
    clearSearch: "Clear search",
    browseAllJobs: "Browse and filter all jobs",
    closingSoon: "Closing Soon",
    // table
    postName: "Post Name",
    department: "Department",
    vacancy: "Vacancy",
    lastDate: "Last Date",
    applyCol: "Apply",
    new: "NEW",
    updated: "UPDATED",
    closed: "Closed",
    serialNo: "Sr.",
    // panels / sections
    postOverview: "Post Overview",
    quickSummary: "Quick Summary",
    eligibilityCriteria: "Eligibility Criteria",
    applicationFee: "Application Fee",
    vacancyDetails: "Vacancy Details (Category-wise)",
    selectionProcess: "Selection Process",
    documentsRequired: "Documents Required",
    salaryDetails: "Salary / Pay Details",
    howToApply: "How to Apply Online",
    importantLinks: "Important Links",
    recruitmentTimeline: "Recruitment Timeline",
    relatedJobs: "Related Jobs",
    similarOpenJobs: "Similar Open Jobs",
    currentVacancies: "Current Vacancies",
    recentlyClosed: "Recently Closed (Applications Ended)",
    frequentlyAsked: "Frequently Asked Questions",
    relatedPages: "Related Pages",
    officialWebsite: "Official Website",
    downloadNotification: "Download Official Notification (PDF)",
    syllabus: "Syllabus",
    shareThisPage: "Share this page",
    // job detail labels
    post: "Post",
    totalVacancy: "Total Vacancy",
    applicationDates: "Application Dates",
    examDate: "Exam Date",
    payScale: "Pay Scale",
    lastUpdated: "Last Updated",
    applicationFeeLabel: "Application Fee",
    applyMode: "Apply Mode",
    ageLimit: "Age Limit",
    notNotified: "Not notified",
    asPerNotification: "As per official notification",
    applicationsClosed: "Applications closed",
    applyLinkUnderVerification: "Apply link under verification",
    officialNotification: "Official Notification (PDF)",
    applyWindow: "Apply Window",
    education: "Education",
    saveJob: "Save",
    applied: "Applied",
    markApplied: "Mark as applied",
    // listing
    filters: "Filters",
    category: "Category",
    state: "State",
    status: "Status",
    qualification: "Qualification",
    sortBy: "Sort By",
    allCategories: "All Categories",
    allIndia: "All India",
    anyQualification: "Any Qualification",
    newestFirst: "Newest first",
    closingSoonSort: "Closing soon",
    showingResultsFor: "Showing results for",
    browseByQualification: "Browse Jobs by Qualification",
    browseByDepartment: "Browse Jobs by Department",
    // footer
    allRightsReserved: "All rights reserved.",
    popularPages: "Popular Pages",
    // misc
    lastUpdatedOn: "Last updated",
    verifiedOn: "Portal verified",
    noRecords: "No records",
  },
  hi: {
    skipToContent: "मुख्य सामग्री पर जाएँ",
    independentPortal: "एक स्वतंत्र जॉब सूचना वेबसाइट · सरकारी वेबसाइट नहीं",
    loginRegister: "लॉगिन / रजिस्टर",
    languageLabel: "English",
    languageTitle: "इंटरफ़ेस हिंदी से अंग्रेज़ी में बदलें",
    notGovernmentNotice:
      "यह एक स्वतंत्र जॉब सूचना वेबसाइट है, सरकारी वेबसाइट नहीं।",
    apply: "आवेदन करें",
    applyOnline: "ऑनलाइन आवेदन करें (आधिकारिक वेबसाइट)",
    view: "देखें",
    viewAllJobs: "सभी जॉब देखें →",
    search: "खोजें",
    searchPlaceholder: "जॉब खोजें — जैसे बिहार पुलिस, BPSC, 10th पास",
    viewDetails: "विवरण देखें",
    clearSearch: "खोज हटाएँ",
    browseAllJobs: "सभी जॉब फ़िल्टर करके देखें",
    closingSoon: "जल्द बंद हो रहा है",
    postName: "पद का नाम",
    department: "विभाग",
    vacancy: "पद",
    lastDate: "अंतिम तिथि",
    applyCol: "आवेदन",
    new: "नया",
    updated: "अपडेटेड",
    closed: "बंद",
    serialNo: "क्र.सं.",
    postOverview: "पद की जानकारी",
    quickSummary: "त्वरित जानकारी",
    eligibilityCriteria: "योग्यता",
    applicationFee: "आवेदन शुल्क",
    vacancyDetails: "श्रेणीवार पद (विवरण)",
    selectionProcess: "चयन प्रक्रिया",
    documentsRequired: "आवश्यक दस्तावेज़",
    salaryDetails: "वेतन / पे स्केल",
    howToApply: "ऑनलाइन आवेदन कैसे करें",
    importantLinks: "महत्वपूर्ण लिंक",
    recruitmentTimeline: "भर्ती टाइमलाइन",
    relatedJobs: "संबंधित जॉब",
    similarOpenJobs: "इसी तरह के खुले पद",
    currentVacancies: "चालू पद",
    recentlyClosed: "हाल ही में बंद (आवेदन समाप्त)",
    frequentlyAsked: "अक्सर पूछे जाने वाले प्रश्न",
    relatedPages: "संबंधित पेज",
    officialWebsite: "आधिकारिक वेबसाइट",
    downloadNotification: "आधिकारिक नोटिफिकेशन डाउनलोड करें (PDF)",
    syllabus: "पाठ्यक्रम",
    shareThisPage: "इस पेज को शेयर करें",
    post: "पद",
    totalVacancy: "कुल पद",
    applicationDates: "आवेदन तिथि",
    examDate: "परीक्षा तिथि",
    payScale: "पे स्केल",
    lastUpdated: "अंतिम अपडेट",
    applicationFeeLabel: "आवेदन शुल्क",
    applyMode: "आवेदन माध्यम",
    ageLimit: "आयु सीमा",
    notNotified: "अभी सूचित नहीं",
    asPerNotification: "आधिकारिक नोटिफिकेशन के अनुसार",
    applicationsClosed: "आवेदन बंद",
    applyLinkUnderVerification: "आवेदन लिंक जाँच जा रहा है",
    officialNotification: "आधिकारिक नोटिफिकेशन (PDF)",
    applyWindow: "आवेदन अवधि",
    education: "शिक्षा",
    saveJob: "सेव करें",
    applied: "आवेदन किया",
    markApplied: "आवेदन किया हुआ दर्ज करें",
    filters: "फ़िल्टर",
    category: "श्रेणी",
    state: "राज्य",
    status: "स्थिति",
    qualification: "योग्यता",
    sortBy: "क्रमबद्ध करें",
    allCategories: "सभी श्रेणियाँ",
    allIndia: "पूरा भारत",
    anyQualification: "कोई भी योग्यता",
    newestFirst: "नवीनतम पहले",
    closingSoonSort: "जल्द बंद होने वाले",
    showingResultsFor: "इस खोज के परिणाम",
    browseByQualification: "योग्यता के अनुसार जॉब",
    browseByDepartment: "विभाग के अनुसार जॉब",
    allRightsReserved: "सर्वाधिकार सुरक्षित।",
    popularPages: "लोकप्रिय पेज",
    lastUpdatedOn: "अंतिम अपडेट",
    verifiedOn: "पोर्टल सत्यापित",
    noRecords: "कोई रिकॉर्ड नहीं",
  },
} as const;

export type MsgKey = keyof (typeof dict)["en"];

/** Translate one key. Unknown keys fall back to English, then the key. */
export function t(lang: Lang, key: MsgKey): string {
  return dict[lang][key] ?? dict.en[key] ?? key;
}

/** Search-box placeholders (single input; swapped by the switcher). */
export const SEARCH_PLACEHOLDER = {
  en: "Search jobs — e.g. Bihar Police, BPSC, 10th pass",
  hi: "जॉब खोजें — जैसे बिहार पुलिस, BPSC, 10th पास",
} as const;