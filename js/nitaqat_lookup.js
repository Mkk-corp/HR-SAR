/**
 * Nitaqat (نطاقات) Lookup Table
 * Ministry of Human Resources & Social Development — Saudi Arabia
 *
 * Band thresholds per ISIC4 section (approximate, based on Nitaqat program):
 *   rate < yellowMin          → Red    (أحمر)    — non-compliant, serious violation
 *   yellowMin <= rate < greenMin → Yellow (أصفر) — non-compliant, warning zone
 *   greenMin  <= rate < platinumMin → Green (أخضر) — compliant (الحد الأدنى المطلوب)
 *   rate >= platinumMin       → Platinum (بلاتيني) — exceeds requirement
 */

const NITAQAT_SECTIONS = {
    // A — Agriculture, Forestry and Fishing | الزراعة والغابات وصيد الأسماك
    'A': { name: 'الزراعة والغابات والصيد', yellowMin: 2,  greenMin: 4,  platinumMin: 8  },

    // B — Mining and Quarrying | التعدين واستغلال المحاجر
    'B': { name: 'التعدين واستغلال المحاجر', yellowMin: 3, greenMin: 6,  platinumMin: 12 },

    // C — Manufacturing | التصنيع
    'C': { name: 'التصنيع',                   yellowMin: 5,  greenMin: 10, platinumMin: 20 },

    // D — Electricity, Gas, Steam and Air Conditioning | الكهرباء والغاز
    'D': { name: 'الكهرباء والغاز والبخار',   yellowMin: 10, greenMin: 20, platinumMin: 35 },

    // E — Water Supply; Sewerage, Waste Management | المياه والصرف الصحي
    'E': { name: 'إمدادات المياه والصرف الصحي', yellowMin: 8, greenMin: 15, platinumMin: 28 },

    // F — Construction | البناء والتشييد
    'F': { name: 'البناء والتشييد',            yellowMin: 4,  greenMin: 8,  platinumMin: 16 },

    // G — Wholesale and Retail Trade | تجارة الجملة والتجزئة
    'G': { name: 'تجارة الجملة والتجزئة',      yellowMin: 20, greenMin: 35, platinumMin: 50 },

    // H — Transportation and Storage | النقل والتخزين
    'H': { name: 'النقل والتخزين',             yellowMin: 8,  greenMin: 15, platinumMin: 25 },

    // I — Accommodation and Food Service | الإقامة وخدمات الطعام
    'I': { name: 'الإقامة وخدمات الطعام (فنادق ومطاعم)', yellowMin: 15, greenMin: 25, platinumMin: 40 },

    // J — Information and Communication | المعلومات والاتصالات
    'J': { name: 'المعلومات والاتصالات',        yellowMin: 10, greenMin: 20, platinumMin: 30 },

    // K — Financial and Insurance Activities | الأنشطة المالية والتأمين
    'K': { name: 'الأنشطة المالية والتأمين',   yellowMin: 25, greenMin: 45, platinumMin: 65 },

    // L — Real Estate Activities | الأنشطة العقارية
    'L': { name: 'الأنشطة العقارية',           yellowMin: 10, greenMin: 20, platinumMin: 35 },

    // M — Professional, Scientific and Technical | الأنشطة المهنية والعلمية
    'M': { name: 'الأنشطة المهنية والعلمية والتقنية', yellowMin: 10, greenMin: 20, platinumMin: 35 },

    // N — Administrative and Support Services | الأنشطة الإدارية
    'N': { name: 'الأنشطة الإدارية وخدمات الدعم', yellowMin: 15, greenMin: 25, platinumMin: 40 },

    // O — Public Administration and Defence | الإدارة العامة والدفاع
    'O': { name: 'الإدارة العامة والدفاع',     yellowMin: 0,  greenMin: 0,  platinumMin: 0  },

    // P — Education | التعليم
    'P': { name: 'التعليم',                    yellowMin: 25, greenMin: 40, platinumMin: 55 },

    // Q — Human Health and Social Work | الصحة والعمل الاجتماعي
    'Q': { name: 'الصحة والعمل الاجتماعي',    yellowMin: 15, greenMin: 30, platinumMin: 45 },

    // R — Arts, Entertainment and Recreation | الفنون والترفيه
    'R': { name: 'الفنون والترفيه والتسلية',   yellowMin: 10, greenMin: 20, platinumMin: 35 },

    // S — Other Service Activities | أنشطة خدمية أخرى
    'S': { name: 'أنشطة الخدمات الأخرى',       yellowMin: 15, greenMin: 25, platinumMin: 40 },

    // T — Activities of Households | أنشطة الأسر المعيشية
    'T': { name: 'أنشطة الأسر المعيشية',       yellowMin: 0,  greenMin: 0,  platinumMin: 0  },

    // U — Activities of Extraterritorial Organisations | هيئات دولية
    'U': { name: 'هيئات دولية وأنشطة خارجية',  yellowMin: 0,  greenMin: 0,  platinumMin: 0  },
};

/** Keyword → ISIC4 section mapping (Arabic activity name fallback) */
const NITAQAT_KEYWORDS = [
    ['زراع',         'A'], ['غابات',        'A'], ['صيد أسماك',    'A'], ['مزارع',        'A'],
    ['تعدين',        'B'], ['استخراج',      'B'], ['نفط',          'B'], ['محاجر',        'B'],
    ['تصنيع',        'C'], ['صناع',         'C'], ['مصنع',         'C'], ['إنتاج صناعي',  'C'],
    ['غذائي',        'C'], ['نسيج',         'C'], ['ملابس',        'C'], ['مواد بناء',    'C'],
    ['كيماويات',     'C'], ['أدوية',        'C'], ['مركبات',       'C'], ['طباعة',        'C'],
    ['كهرب',         'D'], ['الغاز',        'D'], ['طاقة',         'D'],
    ['مياه',         'E'], ['صرف صحي',      'E'], ['نفايات',       'E'],
    ['بناء',         'F'], ['تشييد',        'F'], ['مقاول',        'F'], ['عقود إنشائية', 'F'],
    ['تجارة',        'G'], ['بيع بالتجزئة', 'G'], ['بيع بالجملة',  'G'], ['مبيعات',       'G'],
    ['سيارات',       'G'], ['محلات',        'G'],
    ['نقل',          'H'], ['شحن',          'H'], ['مواصلات',      'H'], ['تخزين',        'H'],
    ['لوجستي',       'H'], ['بريد',         'H'],
    ['فندق',         'I'], ['مطعم',         'I'], ['ضيافة',        'I'], ['سياح',         'I'],
    ['وجبات',        'I'], ['ترفيه سياحي',  'I'],
    ['معلومات',      'J'], ['اتصال',        'J'], ['برمجة',        'J'], ['تقنية معلومات','J'],
    ['إنترنت',       'J'], ['اتصالات',      'J'], ['رقمي',         'J'],
    ['بنك',          'K'], ['مصرف',         'K'], ['تأمين',        'K'], ['مالي',         'K'],
    ['استثمار',      'K'], ['تمويل',        'K'], ['صرافة',        'K'],
    ['عقار',         'L'], ['إيجار',        'L'], ['تطوير عقاري',  'L'],
    ['استشار',       'M'], ['هندسة',        'M'], ['قانون',        'M'], ['محاسب',        'M'],
    ['بحث علمي',     'M'], ['إعلام وتسويق', 'M'], ['دعاية',        'M'],
    ['توظيف',        'N'], ['أمن',          'N'], ['تنظيف',        'N'], ['خدمات إدارية', 'N'],
    ['سياحة أعمال',  'N'],
    ['تعليم',        'P'], ['مدرسة',        'P'], ['جامعة',        'P'], ['تدريب',        'P'],
    ['صحة',          'Q'], ['مستشفى',       'Q'], ['طب',           'Q'], ['صيدل',         'Q'],
    ['رعاية صحية',   'Q'], ['عيادة',        'Q'],
    ['ترفيه',        'R'], ['فن',           'R'], ['رياضة',        'R'], ['سينما',        'R'],
    ['مسرح',         'R'],
    ['تصليح',        'S'], ['خياطة',        'S'], ['حلاقة',        'S'], ['جمالية',       'S'],
    ['خدمات شخصية',  'S'],
];

const NITAQAT_DEFAULT = { name: 'عام (افتراضي)', yellowMin: 10, greenMin: 20, platinumMin: 35 };

/**
 * Returns the Nitaqat band data for a given facility.
 * @param {string} isic4 - ISIC4 code stored on the facility (e.g. "G47", "F41")
 * @param {string} activityName - Arabic economic activity name
 * @returns {{ name, yellowMin, greenMin, platinumMin }}
 */
function getNitaqatBand(isic4, activityName) {
    // 1. Try ISIC4 section letter (first char)
    if (isic4 && isic4.trim().length > 0) {
        const letter = isic4.trim().charAt(0).toUpperCase();
        if (NITAQAT_SECTIONS[letter]) return NITAQAT_SECTIONS[letter];
    }
    // 2. Keyword fallback against activity name
    if (activityName) {
        for (const [kw, section] of NITAQAT_KEYWORDS) {
            if (activityName.includes(kw)) return NITAQAT_SECTIONS[section];
        }
    }
    return NITAQAT_DEFAULT;
}
