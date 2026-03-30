# وثيقة مواصفات متطلبات النظام (SRS)
## نظام إدارة الموارد البشرية — HR Management System

---

**الإصدار:** 1.2
**التاريخ:** 2026-03-31
**الحالة:** قيد التطوير

---

## سجل التغييرات

| الإصدار | التاريخ | التغيير |
|---|---|---|
| 1.0 | 2026-03-28 | الإصدار الأولي |
| 1.1 | 2026-03-30 | إضافة وحدة الخدمات (`js/transfers.js`)، صفحات `services` / `transfers` / `transfer-detail`، نموذج بيانات Transfer، مفتاح `hr_transfers` في localStorage |
| 1.2 | 2026-03-31 | تصحيح هيكلي — نقل صفحات الخدمات والنقل إلى داخل `<main class="main-content">` لضمان صحة `margin-right` مقابل الشريط الجانبي |

---

## 1. نظرة عامة تقنية

### 1.1 نوع التطبيق

Single Page Application (SPA) — تطبيق ويب أحادي الصفحة يعمل بالكامل على جانب العميل (Client-Side Only) بدون خادم خلفي.

### 1.2 المكدس التقني (Tech Stack)

| الطبقة | التقنية |
|---|---|
| هيكل الصفحة | HTML5 |
| التنسيق | CSS3 (Custom Properties, Grid, Flexbox) |
| المنطق | Vanilla JavaScript (ES6+, `'use strict'`) |
| الخط | IBM Plex Sans Arabic — Google Fonts |
| التخزين | `localStorage` (Client-side persistence) |
| الأطر والمكتبات | لا يوجد — Zero dependencies |

### 1.3 بنية الملفات

```
HR test/
├── index.html               # الصفحة الرئيسية الوحيدة
├── css/
│   └── styles.css           # جميع التنسيقات
├── js/
│   ├── app.js               # المنطق الأساسي وجميع الوحدات الرئيسية
│   ├── transfers.js         # وحدة النقل والتحويل (مُحمَّل بعد app.js)
│   ├── activities.js        # بيانات الأنشطة الاقتصادية
│   └── nitaqat_lookup.js    # جداول نطاقات السعودة
├── Assets/
│   └── mkk_corp_logo.png
└── Documents/
    ├── BRD.md
    └── SRS.md
```

**ترتيب التحميل:**
```html
<script src="js/activities.js"></script>
<script src="js/nitaqat_lookup.js"></script>
<script src="js/app.js"></script>
<script src="js/transfers.js"></script>  <!-- يعتمد على globals من app.js -->
```

---

## 2. متطلبات البيئة

| المتطلب | التفاصيل |
|---|---|
| المتصفحات المدعومة | Chrome 90+، Firefox 88+، Edge 90+، Safari 14+ |
| الدقة الدنيا | 320px عرضاً |
| الاتصال بالإنترنت | مطلوب فقط لتحميل خط Google Fonts |
| خادم ويب | غير مطلوب — يعمل من `file://` أو أي خادم ثابت |

---

## 3. هيكل التطبيق والتوجيه (Routing)

### 3.1 آلية التوجيه

لا يوجد توجيه مبني على URL. التنقل بين الصفحات يتم عبر:
1. إخفاء جميع عناصر `.page` باستخدام كلاس `hidden`
2. إظهار العنصر المستهدف `#page-{name}` بإزالة `hidden`
3. تحديث الكلاس `active` على رابط الشريط الجانبي
4. استدعاء دالة الرسم الخاصة بالصفحة إن وُجدت

```javascript
function navigate(page) { ... }
function navigateToFacility(id)  { currentFacilityId  = id; navigate('facility-detail');  }
function navigateToEmployee(id)  { currentEmployeeId  = id; navigate('employee-detail');  }
function navigateToTransfer(id)  { currentTransferId  = id; navigate('transfer-detail');  }
```

**ملاحظة هيكلية مهمة:** جميع عناصر `.page` يجب أن تكون بنات مباشرة لـ `<main class="main-content">` حتى ترث `margin-right: var(--sidebar-w)` الذي يمنع ظهور المحتوى خلف الشريط الجانبي.

### 3.2 الصفحات المتاحة

| معرف الصفحة | عنصر HTML | عنوان الصفحة | رابط الشريط الجانبي |
|---|---|---|---|
| `dashboard` | `#page-dashboard` | لوحة التحكم | `[data-page="dashboard"]` |
| `employees` | `#page-employees` | الموظفون | `[data-page="employees"]` |
| `add-employee` | `#page-add-employee` | إضافة موظف جديد | — |
| `facilities` | `#page-facilities` | المنشآت | `[data-page="facilities"]` |
| `facility-detail` | `#page-facility-detail` | تفاصيل المنشأة | يضيء `[data-page="facilities"]` |
| `employee-detail` | `#page-employee-detail` | بيانات الموظف | يضيء `[data-page="employees"]` |
| `reports` | `#page-reports` | التقارير | `[data-page="reports"]` |
| `services` | `#page-services` | الخدمات | `[data-page="services"]` |
| `transfers` | `#page-transfers` | خدمات النقل والتحويل | يضيء `[data-page="services"]` |
| `transfer-detail` | `#page-transfer-detail` | تفاصيل طلب النقل | يضيء `[data-page="services"]` |

**منطق `navTarget` في `navigate()`:**
```javascript
const navTarget = page === 'facility-detail' ? 'facilities'
                : page === 'employee-detail'  ? 'employees'
                : page === 'transfers'        ? 'services'
                : page === 'transfer-detail'  ? 'services'
                : page;
```

---

## 4. نماذج البيانات (Data Models)

### 4.1 نموذج الموظف (Employee)

```javascript
{
  id:          String,   // uid() — فريد، مُولَّد تلقائياً
  name:        String,   // الاسم الكامل — إلزامي
  code:        String,   // الرقم التوظيفي — إلزامي، فريد
  nationalId:  String,   // الرقم القومي — إلزامي
  idNumber:    String,   // رقم الهوية — إلزامي
  nationality: String,   // الجنسية — إلزامي
  empType:     String,   // 'سعودي' | 'اجنبي' — إلزامي
  facilityId:  String,   // مرجع Facility.id — إلزامي
  salary:      Number,   // المرتب الأساسي — إلزامي
  status:      String,   // انظر §4.3
  department:  String,   // الإدارة | ''
  jobTitle:    String,   // المسمى الوظيفي | ''
  manager:     String,   // المدير المباشر | ''
  workLocation:String,   // موقع العمل | ''
  grade:       String,   // الدرجة الوظيفية | ''
  entryDate:   String,   // ISO date string | ''
  idExpiry:    String,   // ISO date string | ''
  bank:        String,   // اسم البنك | ''
  iban:        String,   // رقم IBAN | ''
  countryCode: String,   // '+966' | ''
  phone:       String,   // رقم الهاتف | ''
  photo:       Object|null,
  history:     Array,    // سجل التغييرات — يُضاف عند كل نقل داخلي
  createdAt:   String,   // ISO datetime string
}
```

### 4.2 نموذج المنشأة (Facility)

```javascript
{
  id:              String,
  type:            String,        // 'اساسية' | 'فرعيه'
  parentId:        String|null,
  name:            String,
  nationalNumber:  String,
  crNumber:        String,
  crDate:          String,
  taxNumber:       String,
  insuranceNumber: String,
  nationalAddress: String,
  workLocation:    String,
  economicActivity:String,
  isic4:           String,
  createdAt:       String,
}
```

### 4.3 نموذج طلب النقل (Transfer) — جديد في v1.1

```javascript
{
  // المعرّف والنوع
  id:               String,   // uid()
  type:             String,   // 'internal' | 'external'
  direction:        String|null, // 'out' | 'in' | null (للداخلي)
  transferSubType:  String,   // 'sponsorship' | 'secondment' | undefined

  // بيانات الموظف (لقطة)
  employeeId:       String,   // مرجع Employee.id
  employeeName:     String,   // نسخة من emp.name وقت الإنشاء
  employeeCode:     String,   // نسخة من emp.code وقت الإنشاء

  // الحالة
  status: 'draft'|'pending_approval'|'approved'|'pending_government'|'completed'|'rejected'|'cancelled',

  // حقول النقل الداخلي
  effectiveDate:    String,   // ISO date — تاريخ التفعيل
  changes: {
    facilityId?:    { from: String, to: String },
    branch?:        { from: String, to: String },
    department?:    { from: String, to: String },
    jobTitle?:      { from: String, to: String },
    manager?:       { from: String, to: String },
    workLocation?:  { from: String, to: String },
    salary?:        { from: Number, to: Number },
    grade?:         { from: String, to: String },
  },

  // حقول النقل الخارجي
  targetCompany:    String,   // اسم الجهة المستقبِلة / المُرسِلة
  reason:           String,   // سبب النقل
  expectedDate:     String,   // ISO date — التاريخ المتوقع

  // التسوية (للخروج الخارجي فقط)
  settlement: {
    pendingSalary:  Number,   // الراتب المستحق (تقديري)
    leaveBalance:   Number,   // رصيد الإجازات (تقديري)
    loans:          Number,   // القروض والخصومات
    yearsOfService: String,   // سنوات الخدمة
    dailyRate:      Number,   // معدل اليوم
    total:          Number,   // الإجمالي المستحق
  },

  // التكامل الحكومي
  governmentRefNumber: String,  // رقم المرجع من قوى / أبشر
  completedDate:       String,  // ISO datetime

  // سجل التدقيق
  auditLog: [
    { action: String, details: String, by: String, at: String }
  ],

  // الميتاداتا
  notes:      String,
  createdBy:  String,
  createdAt:  String,   // ISO datetime
  updatedAt:  String,   // ISO datetime
  rejectionReason: String,
}
```

### 4.4 قيم الحالة الوظيفية

| القيمة | الشارة | الوصف |
|---|---|---|
| `نشط` | `badge-success` | موظف نشط حالياً |
| `غير نشط` | `badge-danger` | موظف غير نشط |
| `خروج نهائي` | `badge-danger` | انتهت خدمته نهائياً — يُعيَّن عند إتمام نقل خروج خارجي |
| `خروج مؤقت` | `badge-warning` | مجمَّد أثناء طلب نقل خارجي معلق |
| `اجازة` | `badge-warning` | في إجازة |

---

## 5. التخزين المحلي (localStorage)

| المفتاح | النوع | الوصف |
|---|---|---|
| `hr_employees` | `JSON Array<Employee>` | مصفوفة جميع الموظفين |
| `hr_facilities` | `JSON Array<Facility>` | مصفوفة جميع المنشآت |
| `hr_transfers` | `JSON Array<Transfer>` | مصفوفة جميع طلبات النقل |

**دوال الحفظ:**
```javascript
// app.js
function save()           { localStorage.setItem('hr_employees',  JSON.stringify(employees));  }
function saveFacilities() { localStorage.setItem('hr_facilities', JSON.stringify(facilities)); }

// transfers.js
function saveTransfers()  { localStorage.setItem('hr_transfers',  JSON.stringify(transfers));  }
```

**التهيئة عند الإقلاع:**
```javascript
// app.js
let employees  = JSON.parse(localStorage.getItem('hr_employees')  || '[]');
let facilities = JSON.parse(localStorage.getItem('hr_facilities') || '[]');

// transfers.js
let transfers  = JSON.parse(localStorage.getItem('hr_transfers')  || '[]');
```

---

## 6. متغيرات الحالة العامة (Global State)

**في `app.js`:**
```javascript
let currentEditId          = null;   // id الموظف الذي يُعدَّل حالياً
let currentFacilityEditId  = null;   // id المنشأة التي تُعدَّل حالياً
let currentFacilityId      = null;   // id المنشأة المعروضة في صفحة التفاصيل
let currentEmployeeId      = null;   // id الموظف المعروض في صفحة تفاصيله
let deleteTargetId         = null;   // id المرشح للحذف
let deleteFacilityTargetId = null;
let deleteMode             = null;   // 'employee' | 'facility'
```

**في `transfers.js`:**
```javascript
let transfers              = [];     // مُحمَّل من localStorage
let currentTransferId      = null;   // id طلب النقل المعروض في صفحة التفاصيل
let transferStep           = 1;      // خطوة المعالج (1-3)
let _pendingTransferType   = '';     // 'internal' | 'external'
let _pendingTransferDirection = '';  // 'out' | 'in'
```

---

## 7. المتطلبات الوظيفية التفصيلية

### 7.1 لوحة التحكم

**الدالة:** `dashboard()`

| العنصر | المعرف | المصدر |
|---|---|---|
| إجمالي الموظفين | `#totalEmployees` | `employees.length` |
| الموظفون النشطون | `#activeEmployees` | `employees.filter(e => e.status === 'نشط').length` |
| المنشآت | `#totalDepts` | `facilities.length` |
| إجمالي الرواتب | `#totalSalary` | مجموع `employee.salary` |
| آخر الموظفين | `#recentEmployeesList` | آخر 6 موظفين |
| توزيع المنشآت | `#deptDistribution` | تجميع الموظفين حسب اسم المنشأة |

### 7.2 صفحة الموظفين

**الدوال:** `renderEmployees()`, `populateDeptFilter()`, `applyFilters()`

**منطق البحث والتصفية:**
```javascript
const ms = !search ||
  (e.name||'').toLowerCase().includes(search) ||
  (e.code||'').toLowerCase().includes(search) ||
  (e.nationality||'').toLowerCase().includes(search) ||
  getFacilityName(e.facilityId).toLowerCase().includes(search);
return ms && (!facId || e.facilityId === facId) && (!status || e.status === status);
```

### 7.2.1 صفحة تفاصيل الموظف

**الدالة:** `renderEmployeeDetail()`
**المُشغِّل:** `navigateToEmployee(id)` ← يُعيِّن `currentEmployeeId` ويوجّه إلى `employee-detail`

**الأقسام الأربعة:** البيانات الشخصية · بيانات العمل · البنك والتواصل · العقد والمستندات

### 7.3 صفحة إضافة موظف

**الدوال:** `renderAddEmployeePage()`, `submitAddEmployee()`
**الحقول الإلزامية:** `name, code, nationalId, idNumber, nationality, empType, facilityId, salary`
**تحقق إضافي:** تفرد الرقم التوظيفي

### 7.4 قائمة المنشآت

**الدالة:** `renderFacilities()`
**أعمدة الجدول:** النوع، اسم المنشأة، الرقم الوطني، السجل التجاري، تاريخ السجل، عدد الموظفين، الإجراءات

### 7.5 صفحة تفاصيل المنشأة

**الدالة:** `renderFacilityDetail()`
**العناصر:** `#facilityBreadcrumb`, `#facilityInfoCard`, `#saudizationCard`, `#subFacilitiesCard`, `#facilityEmployeesCard`

### 7.6 نموذج المنشأة (Modal)

**الدوال:** `openAddFacilityModal()`, `openEditFacilityModal(id)`, `openAddSubFacilityModal(parentId)`, `saveFacility()`

### 7.7 نموذج تعديل الموظف (Modal)

**الدوال:** `openEditModal(id)`, `closeModal()`, `saveEmployee()`

### 7.8 حساب نسبة السعودة (Nitaqat)

**الملف:** `js/nitaqat_lookup.js`

| الدالة | الوصف |
|---|---|
| `getNitaqatBand(isic4, activityName)` | يُرجع بيانات نطاقات للنشاط الاقتصادي |
| `calculateSaudizationRate(f)` | يحسب نسبة التوطين ويُرجع `{state, rate, band, category, compliant, ...}` |
| `renderSaudizationCard(f)` | يرسم بطاقة النتيجة في `#saudizationCard` |

### 7.9 مركز الخدمات (Services Hub) — جديد في v1.1

**الدالة:** `renderServices()` — في `transfers.js`

**الصفحة:** `#page-services` — شبكة بطاقات مقسّمة في ثلاثة أقسام.

**البطاقة النشطة الوحيدة:** `#svcTransferBtn` — خدمات النقل والتحويل
- عند الرسم: `renderServices()` تقرأ `transfers` وتعرض عدد الطلبات المعلقة في `#svc-transfers-pending`
- عند النقر: `navigate('transfers')`

**البطاقات الأخرى** (8 بطاقات): غير قابلة للنقر، تعرض شارة "قريباً"

### 7.10 وحدة النقل والتحويل — جديد في v1.1

#### 7.10.1 قائمة الطلبات (`renderTransfers()`)

**الصفحة:** `#page-transfers`

**التصفية:** بتبويبات (`#transferTabs`) وبحث نصي (`#transferSearch`)

| التبويب | `data-filter` | الفلتر |
|---|---|---|
| الكل | `all` | بدون فلتر |
| داخلي | `internal` | `type === 'internal'` |
| خارجي | `external` | `type === 'external'` |
| قيد الاعتماد | `pending` | `status === 'pending_approval'` |
| إجراء حكومي | `govt` | `status === 'pending_government'` |
| مكتمل | `completed` | `status === 'completed'` |

**الإحصائيات الأربعة:** الإجمالي · قيد الاعتماد · إجراء حكومي · مكتمل

**الجدول:** الموظف · النوع · الجهة/الإدارة · تاريخ التفعيل · الحالة · تاريخ الإنشاء · زر عرض

#### 7.10.2 صفحة تفاصيل الطلب (`renderTransferDetail()`)

**الصفحة:** `#page-transfer-detail` → `#transferDetailContent`

يُعيد رسم المحتوى كاملاً عند كل تغيير في الحالة. يتكون من:

| المكوّن | الدالة | شرط الظهور |
|---|---|---|
| بطاقة معلومات الموظف | مضمّنة | دائماً |
| متتبع الخطوات (Stepper) | `renderStepperHTML(t)` | دائماً |
| تفاصيل النقل الداخلي | `renderInternalDetailsHTML(t)` | `type === 'internal'` |
| تفاصيل النقل الخارجي | `renderExternalDetailsHTML(t)` | `type === 'external'` |
| بطاقة التسوية | `renderSettlementHTML(t)` | `type=external, direction=out` |
| أدوات الاعتماد | `renderApprovalActionsHTML(t)` | `status === 'pending_approval'` |
| إرشادات المنصات الحكومية | `renderGovtHandoffHTML(t)` | `status === 'pending_government'` |
| نموذج تأكيد الإتمام | `renderCompleteFormHTML(t)` | `status === 'pending_government'` |
| زر الإلغاء | مضمّن | `status ∈ {draft, pending_approval}` |
| سجل العمليات | `renderAuditLogHTML(t)` | دائماً (إذا وُجدت سجلات) |

**الـ Stepper:**
- داخلي: 4 خطوات (إنشاء → اعتماد → تحديث سجل → مكتمل)
- خارجي خروج: 5 خطوات (إنشاء → اعتماد → تجميد → إجراء حكومي → مكتمل)
- خارجي دخول: 4 خطوات (إنشاء → اعتماد → إجراء حكومي → مكتمل)

#### 7.10.3 معالج الإنشاء (New Transfer Modal)

**المودال:** `#transferModal` — معالج من 3 خطوات

| الخطوة | المحتوى | الدالة |
|---|---|---|
| 1 | اختيار نوع النقل (3 بطاقات) | `renderTransferModalStep()` |
| 2 | نموذج تفاصيل الطلب | `buildInternalForm()` أو `buildExternalForm(dir)` |
| 3 | مراجعة وإرسال | `buildReviewStep()` |

**التحقق في كل خطوة:**
- الخطوة 1: يجب اختيار نوع (`_pendingTransferType !== ''`)
- الخطوة 2: يجب اختيار موظف (`#tr-employee !== ''`)
- الخطوة 3 (إرسال): انظر §7.10.4

#### 7.10.4 دالة `saveNewTransfer()` — منطق زر "إرسال الطلب"

انظر §13 للشرح التفصيلي الكامل.

**الخلاصة:** يُنشئ كائن Transfer، يُسجِّل إدخالَين في `auditLog`، يُغيِّر حالة الموظف (للخروج الخارجي فقط)، يحفظ في `hr_transfers`، يُغلق المودال، يعرض toast نجاح، يُعيد رسم القائمة.

#### 7.10.5 دوال سير العمل

| الدالة | الشرط | التأثير على الموظف | التأثير على الطلب |
|---|---|---|---|
| `approveTransfer(id)` — داخلي | `status === 'pending_approval'` | يُحدِّث جميع الحقول المعدَّلة | `status → 'completed'` |
| `approveTransfer(id)` — خارجي | `status === 'pending_approval'` | `status → 'خروج مؤقت'` | `status → 'pending_government'` |
| `rejectTransfer(id)` | أي حالة | يُعيد `status → 'نشط'` للخارجي | `status → 'rejected'` |
| `cancelTransfer(id)` | `draft` أو `pending_approval` | يُعيد `status → 'نشط'` للخارجي | `status → 'cancelled'` |
| `completeTransfer(id)` | `status === 'pending_government'` | خروج: `status → 'خروج نهائي'` / دخول: `status → 'نشط'` | `status → 'completed'` + `governmentRefNumber` |

#### 7.10.6 حساب التسوية (`calculateSettlement(emp)`)

```javascript
// تُستدعى عند إنشاء طلب نقل خروج خارجي
const dailyRate     = salary / 30;
const yearsOfService = (today - entryDate) / (365.25 * 24 * 3600 * 1000);
const leaveAccrued  = yearsOfService * 30;           // يوم لكل سنة
const leaveRemaining = Math.max(0, leaveAccrued - 15); // افتراض: استُخدم 15 يوم
const leaveBalance  = leaveRemaining * dailyRate;
const pendingSalary = (salary / 30) * dayOfMonth;    // أيام الشهر الحالي
const loans         = 0;                              // placeholder للمستقبل
const total         = pendingSalary + leaveBalance - loans;
```

**تنبيه:** الأرقام تقديرية — يجب مراجعتها مع قسم المالية قبل الصرف.

#### 7.10.7 تطبيق النقل الداخلي (`applyInternalTransfer(transfer)`)

تُستدعى فور اعتماد الطلب الداخلي:
1. تقرأ `transfer.changes`
2. تُعدِّل كل حقل غير فارغ في كائن الموظف
3. تُضيف سجلاً في `emp.history` يتضمن `{ type: 'internal_transfer', date, transferId, changes }`
4. تستدعي `save()` لحفظ التغييرات

#### 7.10.8 نقطة التوقف الحكومية (Legal Handoff)

عند `status === 'pending_government'` تظهر:
1. **بطاقة إرشادية** (`.tr-govt-card`) بخلفية تدرجية زرقاء/بنفسجية
2. **قائمة خطوات مرقّمة** (5 خطوات باللغة العربية)
3. **رابطان مباشران:**
   - منصة قوى: `https://www.qiwa.sa` (زر أزرق)
   - أبشر: `https://www.absher.sa` (زر أخضر داكن)
4. **نموذج إتمام:** حقل لإدخال رقم المرجع الحكومي + زر "تأكيد إتمام النقل"

**النظام لا يُنفِّذ أي إجراء قانوني بنفسه — يتوقف كلياً وينتظر إدخال المستخدم.**

---

## 8. الدوال المساعدة (Utilities)

**في `app.js`:**

| الدالة | الوصف |
|---|---|
| `uid()` | يولِّد معرفاً فريداً: `'e' + Date.now() + random` |
| `getFacility(id)` | يُرجع كائن المنشأة أو `undefined` |
| `getFacilityName(id)` | يُرجع اسم المنشأة أو `'—'` |
| `fmt(n)` | يُنسِّق الرقم بالتنسيق العربي السعودي (`ar-SA`) |
| `fmtDate(d)` | يُنسِّق التاريخ بالتنسيق العربي أو `'—'` |
| `statusBadge(s)` | يُرجع HTML شارة الحالة الوظيفية |
| `empAvatar(name)` / `empAvatarEl(emp)` | أفاتار الموظف (دائرة ملوّنة أو صورة) |
| `showToast(msg, type)` | إشعار مؤقت (3 ثوانٍ) |
| `infoItem(label, value)` | HTML عنصر شبكة معلومات مع كشف الروابط |

**في `transfers.js`:**

| الدالة | الوصف |
|---|---|
| `saveTransfers()` | يحفظ `transfers` في `hr_transfers` |
| `transferStatusBadge(status)` | شارة حالة الطلب بالعربية |
| `transferTypeBadge(type, direction)` | شارة نوع الطلب |
| `subTypeBadge(sub)` | شارة نوع النقل الفرعي (كفالة / إعارة) |
| `addTransferAudit(t, action, details, by)` | يُضيف إدخالاً في `t.auditLog` |
| `calculateSettlement(emp)` | يحسب التسوية التقديرية |
| `applyInternalTransfer(t)` | يُطبِّق تغييرات النقل الداخلي على ملف الموظف |
| `applyExternalTransferOut(t)` | يُحدِّث الموظف إلى `خروج نهائي` |

---

## 9. ربط الأحداث (Event Binding)

### 9.1 الأحداث الثابتة في `app.js` (DOMContentLoaded)

| الحدث | العنصر | الإجراء |
|---|---|---|
| click | `.nav-link` | `navigate(link.dataset.page)` |
| click | `#addEmployeePageBtn` | `navigate('add-employee')` |
| input | `#searchInput` | `applyFilters()` |
| change | `#deptFilter` | `applyFilters()` |
| change | `#statusFilter` | `applyFilters()` |
| click | `#ae-saveBtn` | `submitAddEmployee()` |
| click | `#addFacilityBtn` | `openAddFacilityModal()` |
| change | `#fac-type` | `onFacilityTypeChange()` |
| click | `#saveFacilityBtn` | `saveFacility()` |
| click | `#saveEmployeeBtn` | `saveEmployee()` |
| click | `#confirmDeleteBtn` | `confirmDeleteAction()` |
| keydown | `document` | `Escape` → يغلق جميع المودالات |

### 9.2 الأحداث بالتفويض في `app.js`

| الحاوية | السمة المستهدفة | الإجراء |
|---|---|---|
| `#page-facility-detail` | `#backToFacilitiesBtn` | `navigate('facilities')` |
| `#page-employee-detail` | `#backToEmployeesBtn` | `navigate('employees')` |
| `#page-employee-detail` | `#editEmployeeDetailBtn` | `openEditModal(currentEmployeeId)` |
| `#employeesList` | `tr[data-emp-id]` | `navigateToEmployee(id)` |

### 9.3 الأحداث في `transfers.js` — `initTransferEvents()`

تُستدعى من نهاية `DOMContentLoaded` في `app.js`:
```javascript
if (typeof initTransferEvents === 'function') initTransferEvents();
```

| الحاوية | المستهدف | الإجراء |
|---|---|---|
| `#page-services` | `#svcTransferBtn` | `navigate('transfers')` |
| `#page-transfers` | `#newTransferBtn` | `openNewTransferModal()` |
| `#page-transfers` | `[data-view-transfer]` | `navigateToTransfer(id)` |
| `#page-transfers` | `.transfer-row` (النقر على الصف) | `navigateToTransfer(id)` |
| `#page-transfers` | `[data-filter]` | تحديث الفلتر + `renderTransfers()` |
| `#page-transfer-detail` | `#backToTransfersBtn` | `navigate('transfers')` |
| `#page-transfer-detail` | `#approveTransferBtn` | `approveTransfer(currentTransferId)` |
| `#page-transfer-detail` | `#rejectTransferBtn` | `rejectTransfer(currentTransferId)` |
| `#page-transfer-detail` | `#cancelTransferBtn` | `cancelTransfer(currentTransferId)` |
| `#page-transfer-detail` | `#completeTransferBtn` | `completeTransfer(currentTransferId)` |
| `#transferModal` | `[data-ttype]` | تحديد نوع النقل |
| `#transferModal` | `#trModalNext` | التقدم للخطوة التالية |
| `#transferModal` | `#trModalBack` | العودة للخطوة السابقة |
| `#transferModal` | `#trModalSave` | `saveNewTransfer()` |
| `#transferSearch` | input | `renderTransfers()` |

---

## 10. هيكل CSS

### 10.1 المتغيرات (Custom Properties)

```css
--primary: #2563EB    --success: #10B981    --warning: #F59E0B
--danger:  #EF4444    --purple:  #7C3AED
--sidebar-bg: #0F172A    --sidebar-w: 260px
--bg: #F1F5F9    --card: #FFFFFF    --border: #E2E8F0
--text: #0F172A    --font: 'IBM Plex Sans Arabic', sans-serif
```

### 10.2 كلاسات الشارات (Badges)

| الكلاس | اللون | الاستخدام |
|---|---|---|
| `.badge-success` | أخضر | حالة "نشط" |
| `.badge-danger` | أحمر | حالة "غير نشط"، "خروج نهائي" |
| `.badge-warning` | أصفر | حالة "خروج مؤقت"، "اجازة" |
| `.badge-blue` | أزرق | منشأة أساسية |
| `.badge-purple` | بنفسجي | منشأة فرعية، إجراء حكومي معلق |
| `.badge-teal` | أخضر زمردي | نقل داخلي |
| `.badge-orange` | برتقالي | نقل خارجي خروج |
| `.badge-secondary` | رمادي | مسودة، إعارة |

### 10.3 كلاسات وحدة النقل (Transfers)

| الكلاس | الوصف |
|---|---|
| `.tr-stats` / `.tr-stat` | شريط إحصائيات أعلى الصفحة |
| `.filter-tabs` / `.filter-tab` | تبويبات التصفية |
| `.tr-stepper` / `.tr-step` | متتبع خطوات سير العمل |
| `.step-done` / `.step-active` / `.step-inactive` | حالات خطوات الـ Stepper |
| `.tr-changes-table` | جدول مقارنة قبل/بعد للنقل الداخلي |
| `.tr-settlement-grid` | شبكة بطاقة التسوية المالية |
| `.tr-govt-card` | بطاقة الإرشادات الحكومية |
| `.tr-govt-link.qiwa` / `.tr-govt-link.absher` | أزرار الروابط الحكومية |
| `.tr-audit-log` / `.tr-audit-entry` | سجل العمليات (timeline) |
| `.tr-type-btn` | بطاقة اختيار نوع النقل في المعالج |
| `.tr-review-card` | بطاقة المراجعة قبل الإرسال |
| `.svc-grid` / `.svc-card` | شبكة بطاقات مركز الخدمات |
| `.svc-active` / `.svc-soon` | حالة البطاقة (متاح / قريباً) |

### 10.4 نقاط الاستجابة (Breakpoints)

| نقطة | التغييرات |
|---|---|
| `≤ 1100px` | stats-grid: 2 أعمدة، svc-grid: 2 أعمدة |
| `≤ 768px` | الشريط الجانبي مخفي، form-grid: عمود واحد |
| `≤ 600px` | svc-grid: عمود واحد |
| `≤ 480px` | tr-settlement-grid: عمود واحد |

---

## 11. مكونات الواجهة (UI Components)

### 11.1 الشريط الجانبي

- **العرض:** `260px`، **الموضع:** `fixed; right: 0`
- **عناصر التنقل:** 5 روابط: لوحة التحكم · الموظفون · المنشآت · التقارير · **الخدمات**

### 11.2 المودالات

| المعرف | الحجم | الاستخدام |
|---|---|---|
| `#facilityModal` | `modal-lg` (760px) | إضافة/تعديل منشأة |
| `#employeeModal` | `modal-lg` (760px) | تعديل موظف |
| `#confirmModal` | `modal-sm` (430px) | تأكيد الحذف |
| `#transferModal` | 560px | معالج إنشاء طلب النقل (3 خطوات) |

### 11.3 رسائل الإشعار (Toast)

- **الموضع:** أسفل اليسار
- **المدة:** 3000ms
- **الأنواع:** `success` · `error` · `warning` · افتراضي

---

## 12. التحقق من البيانات (Validation)

### 12.1 إضافة / تعديل موظف

| الحقل | نوع التحقق |
|---|---|
| name, code, nationalId, idNumber, nationality, empType, facilityId, salary | `required` |
| code | فريد — مقارنة مع `employees` |

### 12.2 إضافة / تعديل منشأة

| الحقل | نوع التحقق |
|---|---|
| name, type | `required` |

### 12.3 إنشاء طلب النقل

| الشرط | الرسالة |
|---|---|
| لم يُختر موظف | يرجى اختيار الموظف |
| النقل الداخلي لموظف غير نشط | لا يمكن نقل موظف غير نشط داخلياً |
| نقل خروج لموظف غير نشط | لا يمكن إصدار نقل خروج لموظف غير نشط |
| نقل خارجي بدون اسم جهة | يرجى إدخال اسم الجهة |
| نقل خارجي بدون سبب | يرجى إدخال سبب النقل |
| نقل خروج بدون تحديد النوع | يرجى تحديد نوع النقل |

### 12.4 إتمام النقل الخارجي

| الشرط | الرسالة |
|---|---|
| رقم المرجع الحكومي فارغ | يرجى إدخال رقم المرجع الحكومي |

---

## 13. شرح تفصيلي: ماذا يحدث عند النقر على "إرسال الطلب"؟

يُمثِّل زر **"إرسال الطلب"** الخطوة الأخيرة في معالج إنشاء الطلب (الخطوة 3). عند النقر تُستدعى `saveNewTransfer()` التي تنفّذ التسلسل التالي:

### الخطوة أ — التحقق من صحة البيانات

```
1. هل اختار المستخدم موظفاً؟             → إذا لا: toast خطأ + توقف
2. هل الموظف موجود في النظام؟            → إذا لا: toast خطأ + توقف
3. للنقل الداخلي: هل الموظف نشط؟         → إذا لا: toast خطأ + توقف
4. لنقل الخروج: هل الموظف نشط؟           → إذا لا: toast خطأ + توقف
5. للنقل الخارجي: هل أُدخل اسم الجهة؟   → إذا لا: toast خطأ + توقف
6. للنقل الخارجي: هل أُدخل السبب؟        → إذا لا: toast خطأ + توقف
7. لنقل الخروج: هل حُدِّد نوع النقل؟    → إذا لا: toast خطأ + توقف
```

### الخطوة ب — بناء كائن الطلب

يُنشئ النظام كائن `Transfer` جديداً بمعرّف فريد (`uid()`) وطابع زمني (`now`).

- **للداخلي:** يجمع جميع حقول التغيير من حقول الاستمارة، ويحذف الحقول غير المغيَّرة (`from === to`)
- **للخارجي:** يجمع بيانات الجهة والسبب والتاريخ
- **لنقل الخروج تحديداً:** يستدعي `calculateSettlement(emp)` ويُرفق نتيجتها في `transfer.settlement`

الحالة الأولية للطلب هي دائماً: **`pending_approval`** (لا توجد مرحلة مسودة في التدفق الحالي — يُرسَل مباشرة للاعتماد).

### الخطوة ج — تسجيل سجل التدقيق

يُضيف النظام إدخالَين فورياً في `transfer.auditLog`:
```
1. "تم إنشاء الطلب" — مع اسم الموظف
2. "إرسال للاعتماد" — تأكيد الإرسال التلقائي
```

### الخطوة د — تحديث حالة الموظف (لنقل الخروج فقط)

إذا كان النقل خارجياً باتجاه **خروج**، يُغيِّر النظام فوراً حالة الموظف من `نشط` إلى `خروج مؤقت` ويحفظ في `localStorage` عبر `save()`. هذا يُجمِّد الملف مبدئياً حتى يُبَتَّ في الطلب.

### الخطوة هـ — الحفظ والتحديث

```
1. transfers.push(transfer)    → إضافة الطلب للمصفوفة
2. saveTransfers()             → حفظ hr_transfers في localStorage
3. closeTransferModal()        → إغلاق المودال
4. showToast('تم إرسال طلب النقل للاعتماد', 'success')
5. renderTransfers()           → إعادة رسم قائمة الطلبات مع الطلب الجديد
```

### النتيجة النهائية للمستخدم

| ما يراه المستخدم | ما حدث في الخلفية |
|---|---|
| المودال يُغلق | تم إنشاء الطلب وحفظه |
| رسالة نجاح خضراء | تأكيد بصري بنجاح العملية |
| الطلب يظهر في القائمة بحالة "قيد الاعتماد" | الطلب جاهز لمن يملك صلاحية الاعتماد |
| عداد "قيد الاعتماد" يزيد بواحد | إحصائيات القائمة تتحدث لحظياً |
| للخروج الخارجي: حالة الموظف تتغير لـ "خروج مؤقت" | الملف مجمَّد حتى البتّ في الطلب |

**الخطوة التالية:** يفتح المسؤول المختص صفحة تفاصيل الطلب ويضغط "اعتماد الطلب" أو "رفض الطلب".
