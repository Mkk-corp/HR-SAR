# وثيقة مواصفات متطلبات النظام (SRS)
## نظام إدارة الموارد البشرية — HR Management System

---

**الإصدار:** 1.0
**التاريخ:** 2026-03-28
**الحالة:** قيد التطوير

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
├── index.html          # الصفحة الرئيسية الوحيدة
├── css/
│   └── styles.css      # جميع التنسيقات
├── js/
│   └── app.js          # جميع المنطق والتفاعل
├── BRD.md
└── SRS.md
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

```javascript
function navigate(page) { ... }
function navigateToFacility(id) { currentFacilityId = id; navigate('facility-detail'); }
```

### 3.2 الصفحات المتاحة

| معرف الصفحة | عنصر HTML | عنوان الصفحة | رابط الشريط الجانبي |
|---|---|---|---|
| `dashboard` | `#page-dashboard` | لوحة التحكم | `[data-page="dashboard"]` |
| `employees` | `#page-employees` | الموظفون | `[data-page="employees"]` |
| `add-employee` | `#page-add-employee` | إضافة موظف جديد | — (زر في صفحة الموظفين) |
| `facilities` | `#page-facilities` | المنشآت | `[data-page="facilities"]` |
| `facility-detail` | `#page-facility-detail` | يُعرض اسم المنشأة | يضيء `[data-page="facilities"]` |
| `employee-detail` | `#page-employee-detail` | يُعرض اسم الموظف | يضيء `[data-page="employees"]` |
| `reports` | `#page-reports` | التقارير | `[data-page="reports"]` |

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
  entryDate:   String,   // ISO date string | ''
  idExpiry:    String,   // ISO date string | ''
  workAddress: String,   // ''
  bank:        String,   // اسم البنك | ''
  iban:        String,   // رقم IBAN | ''
  countryCode: String,   // '+966' | ''
  phone:       String,   // رقم الهاتف | ''
  photo:       Object|null,  // { name, size, type, data: base64, uploadedAt } | null
  createdAt:   String,   // ISO datetime string
}
```

### 4.2 نموذج المنشأة (Facility)

```javascript
{
  id:              String,        // uid() — فريد، مُولَّد تلقائياً
  type:            String,        // 'اساسية' | 'فرعيه' — إلزامي
  parentId:        String|null,   // Facility.id للمنشأة الأم | null
  name:            String,        // اسم المنشأة — إلزامي
  nationalNumber:  String,        // الرقم الوطني الموحد | ''
  crNumber:        String,        // رقم السجل التجاري | ''
  crDate:          String,        // ISO date string | ''
  taxNumber:       String,        // الرقم الضريبي | ''
  insuranceNumber: String,        // رقم التأمينات | ''
  nationalAddress: String,        // رابط / كود العنوان | ''
  workLocation:    String,        // وصف الموقع | ''
  createdAt:       String,        // ISO datetime string
}
```

### 4.3 قيم الحالة الوظيفية

| القيمة | الشارة (Badge) | الوصف |
|---|---|---|
| `نشط` | `badge-success` (أخضر) | موظف نشط حالياً |
| `غير نشط` | `badge-danger` (أحمر) | موظف غير نشط |
| `خروج نهائي` | `badge-danger` (أحمر) | انتهت خدمته نهائياً |
| `خروج مؤقت` | `badge-warning` (أصفر) | إجازة بدون راتب أو مهمة خارجية |
| `اجازة` | `badge-warning` (أصفر) | في إجازة |

---

## 5. التخزين المحلي (localStorage)

| المفتاح | النوع | الوصف |
|---|---|---|
| `hr_employees` | `JSON Array<Employee>` | مصفوفة جميع الموظفين |
| `hr_facilities` | `JSON Array<Facility>` | مصفوفة جميع المنشآت |

**دوال الحفظ:**
```javascript
function save()           { localStorage.setItem('hr_employees',  JSON.stringify(employees));  }
function saveFacilities() { localStorage.setItem('hr_facilities', JSON.stringify(facilities)); }
```

**التهيئة عند الإقلاع:**
```javascript
let employees  = JSON.parse(localStorage.getItem('hr_employees')  || '[]');
let facilities = JSON.parse(localStorage.getItem('hr_facilities') || '[]');
```

**بيانات العينة:** إذا كانت كلتا المصفوفتين فارغتين عند تحميل الصفحة، تُستدعى `loadSampleData()` تلقائياً لتعبئة 4 منشآت و 5 موظفين تجريبيين.

---

## 6. متغيرات الحالة العامة (Global State)

```javascript
let currentEditId          = null;   // id الموظف الذي يُعدَّل حالياً في المودال
let currentFacilityEditId  = null;   // id المنشأة التي تُعدَّل حالياً في المودال
let currentFacilityId      = null;   // id المنشأة المعروضة في صفحة التفاصيل
let currentEmployeeId      = null;   // id الموظف المعروض في صفحة تفاصيل الموظف
let deleteTargetId         = null;   // id الموظف المرشح للحذف
let deleteFacilityTargetId = null;   // id المنشأة المرشحة للحذف
let deleteMode             = null;   // 'employee' | 'facility'
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
| آخر الموظفين | `#recentEmployeesList` | آخر 6 موظفين (`reverse().slice(0,6)`) |
| توزيع المنشآت | `#deptDistribution` | تجميع الموظفين حسب اسم المنشأة |

### 7.2 صفحة الموظفين

**الدوال:** `renderEmployees()`, `populateDeptFilter()`, `applyFilters()`

**منطق البحث والتصفية:**
```javascript
// يبحث في: الاسم، الرقم التوظيفي، الجنسية، اسم المنشأة
const ms = !search ||
  (e.name||'').toLowerCase().includes(search) ||
  (e.code||'').toLowerCase().includes(search) ||
  (e.nationality||'').toLowerCase().includes(search) ||
  getFacilityName(e.facilityId).toLowerCase().includes(search);
return ms && (!facId || e.facilityId === facId) && (!status || e.status === status);
```

**أعمدة الجدول:** الرقم التوظيفي، الموظف (أفاتار/صورة + اسم + جنسية)، نوع الموظف، المنشأة، المرتب، الحالة، الإجراءات

**الإجراءات:** تعديل (يفتح `employeeModal`)، حذف (يفتح `confirmModal`)

**النقر على الصف:** كل صف `<tr data-emp-id="...">` — النقر خارج أزرار الإجراءات ينتقل إلى `employee-detail` عبر `navigateToEmployee(id)`

**الحالة الفارغة:** `#emptyState` يظهر عند عدم وجود نتائج مع زر "إضافة موظف جديد"

### 7.2.1 صفحة تفاصيل الموظف

**الدالة:** `renderEmployeeDetail()`

**المُشغِّل:** `navigateToEmployee(id)` ← يُعيِّن `currentEmployeeId` ويوجّه إلى `employee-detail`

**أقسام الصفحة:**

| المعرف | المحتوى |
|---|---|
| `#employeeBreadcrumb` | مسار التنقل: الموظفون › اسم الموظف |
| `#employeeDetailContent` | محتوى الصفحة الكامل |

**بطاقة الرأس:** صورة الموظف (أو أفاتار ملوَّن)، الاسم، المسمى الوظيفي، اسم المنشأة، الشارات (الحالة، نوع الموظف، حالة العقد، نوع العقد)، أزرار تعديل وحذف.

**الأقسام الأربعة:**
1. **البيانات الشخصية** — رقم الهوية، الجنسية، النوع، تواريخ الهوية ورخصة العمل
2. **بيانات العمل** — الرقم التوظيفي، المنشأة، المسمى، المرتب، نوع العقد وحالته
3. **البنك والتواصل** — البنك، IBAN (بخط monospace واتجاه ltr)، الهاتف
4. **العقد والمستندات** — يظهر فقط إذا وُجد ملف عقد أو مستندات إضافية

**زر تعديل من صفحة التفاصيل:** يفتح `openEditModal(currentEmployeeId)` ← بعد الحفظ يُعيد رسم `renderEmployeeDetail()` لا `renderEmployees()`

**زر حذف من صفحة التفاصيل:** يفتح `confirmModal` — بعد التأكيد ينتقل إلى `employees`

### 7.3 صفحة إضافة موظف

**الدوال:** `renderAddEmployeePage()`, `submitAddEmployee()`

**الحقول الإلزامية للتحقق:** `name, code, nationalId, idNumber, nationality, empType, facilityId, salary`

**تحقق إضافي:** تفرد الرقم التوظيفي — `employees.find(e => e.code === code)`

**بعد الحفظ الناجح:** توجيه تلقائي إلى `employees`

### 7.4 قائمة المنشآت

**الدالة:** `renderFacilities()`

**أعمدة الجدول:** النوع (شارة)، اسم المنشأة (رابط قابل للنقر) + اسم الأب للفرعية، الرقم الوطني، السجل التجاري، تاريخ السجل، عدد الموظفين، الإجراءات

**النقر على اسم المنشأة:** `navigateToFacility(id)` ← يُعيِّن `currentFacilityId` ويوجّه إلى `facility-detail`

### 7.5 صفحة تفاصيل المنشأة

**الدالة:** `renderFacilityDetail()`

**عناصر الصفحة:**

| المعرف | المحتوى |
|---|---|
| `#facilityBreadcrumb` | مسار التنقل: المنشآت › [الأب؟] › الاسم |
| `#facilityInfoCard` | بطاقة بيانات المنشأة كاملة مع زر تعديل |
| `#subFacilitiesCard` | جدول المنشآت الفرعية (يظهر فقط إذا `type === 'اساسية'`) |
| `#facilityEmployeesCard` | جدول الموظفين المرتبطين بهذه المنشأة |

**إظهار العنوان الوطني:** إذا كانت القيمة غير فارغة، تُعرض كرابط `<a href="..." target="_blank">` مع أيقونة خريطة.

**زر "إضافة فرعية":** يستدعي `openAddSubFacilityModal(currentFacilityId)` — يُعبِّئ النموذج مسبقاً بالنوع `فرعيه` والأب المحدد وجميع بيانات الأب.

### 7.6 نموذج المنشأة (Modal)

**الدوال:** `openAddFacilityModal()`, `openEditFacilityModal(id)`, `openAddSubFacilityModal(parentId)`, `closeFacilityModal()`, `saveFacility()`

**سلوك حقل نوع المنشأة:**
- عند اختيار `فرعيه`: يظهر `#fac-parent-row` ويستدعي `populateParentSelect()`
- عند اختيار `اساسية`: يُخفي `#fac-parent-row` ويمسح `fac-parentId`

**الإرث التلقائي عند اختيار الأب:**
```javascript
// تُنسخ هذه الحقول من الأب إلى الفرعية:
nationalNumber, crNumber, crDate, taxNumber, insuranceNumber, nationalAddress, workLocation
// لا يُنسخ: name (يدخله المستخدم يدوياً)
```

**منع التعيين الدائري:** `populateParentSelect()` تستثني المنشأة التي تُعدَّل حالياً من القائمة.

**إعادة الرسم بعد الحفظ:**
```javascript
const onDetail = !document.getElementById('page-facility-detail').classList.contains('hidden');
if (onDetail) renderFacilityDetail(); else renderFacilities();
```

### 7.7 نموذج تعديل الموظف (Modal)

**الدوال:** `openEditModal(id)`, `closeModal()`, `saveEmployee()`

يُعبِّئ النموذج بجميع بيانات الموظف ويحفظ التعديلات في مكان السجل الأصلي (by index).

### 7.8 مودال تأكيد الحذف

**الدوال:** `openConfirmDelete(id)`, `openConfirmDeleteFacility(id)`, `confirmDeleteAction()`, `closeConfirmModal()`

**منطق التوجيه بعد حذف المنشأة:**
```javascript
if (wasCurrentFacility) navigate('facilities');       // حُذفت المنشأة المعروضة حالياً
else if (onDetail)      renderFacilityDetail();       // حُذفت منشأة أخرى من صفحة التفاصيل
else                    renderFacilities();            // حُذفت من قائمة المنشآت
```

---

## 8. الدوال المساعدة (Utilities)

| الدالة | الوصف |
|---|---|
| `uid()` | يولِّد معرفاً فريداً: `'e' + Date.now() + random` |
| `getFacility(id)` | يُرجع كائن المنشأة أو `undefined` |
| `getFacilityName(id)` | يُرجع اسم المنشأة أو `'—'` |
| `avatarColor(name)` | يُحدد لون الأفاتار بناءً على hash الاسم (8 ألوان) |
| `fmt(n)` | يُنسِّق الرقم بالتنسيق العربي السعودي (`ar-SA`) |
| `fmtDate(d)` | يُنسِّق التاريخ بالتنسيق العربي (`day month year`) أو `'—'` |
| `statusBadge(s)` | يُرجع HTML شارة الحالة الوظيفية |
| `empAvatar(name)` | يُرجع HTML دائرة الأفاتار بالحرف الأول واللون |
| `empAvatarEl(emp)` | يُرجع `<img>` من الصورة المحفوظة أو يُعيد `empAvatar(name)` |
| `showToast(msg, type)` | يعرض رسالة إشعار مؤقتة (3 ثوانٍ) |
| `infoItem(label, value)` | يُرجع HTML عنصر في شبكة معلومات المنشأة، مع كشف الروابط |
| `populateFacilitySelect(selectId)` | يُعبِّئ قائمة المنشآت في أي `<select>` |

---

## 9. ربط الأحداث (Event Binding)

### 9.1 الأحداث الثابتة (Direct Binding)

جميعها مُسجَّلة داخل `DOMContentLoaded`:

| الحدث | العنصر | الإجراء |
|---|---|---|
| click | `.nav-link` | `navigate(link.dataset.page)` |
| click | `#addEmployeePageBtn` | `navigate('add-employee')` |
| click | `#emptyAddBtn` | `navigate('add-employee')` |
| input | `#searchInput` | `applyFilters()` |
| change | `#deptFilter` | `applyFilters()` |
| change | `#statusFilter` | `applyFilters()` |
| click | `#ae-saveBtn` | `submitAddEmployee()` |
| click | `#ae-cancelBtn` | `navigate('employees')` |
| click | `#addFacilityBtn` | `openAddFacilityModal()` |
| click | `#emptyAddFacilityBtn` | `openAddFacilityModal()` |
| change | `#fac-type` | `onFacilityTypeChange()` |
| change | `#fac-parentId` | `inheritFromParent(value)` |
| click | `#saveFacilityBtn` | `saveFacility()` |
| click | `#saveEmployeeBtn` | `saveEmployee()` |
| change | `#ae-photo` | معاينة صورة الموظف في حلقة الإضافة |
| change | `#empPhoto` | معاينة صورة الموظف في حلقة التعديل |
| click | `#confirmDeleteBtn` | `confirmDeleteAction()` |
| keydown | `document` | `Escape` → يغلق جميع المودالات |

### 9.2 الأحداث بالتفويض (Event Delegation)

| الحاوية | السمة المستهدفة | الإجراء |
|---|---|---|
| `#facilitiesTableBody` | `[data-facility]` | `navigateToFacility(id)` |
| `#facilitiesTableBody` | `[data-fac-edit]` | `openEditFacilityModal(id)` |
| `#facilitiesTableBody` | `[data-fac-delete]` | `openConfirmDeleteFacility(id)` |
| `#page-facility-detail` | `#backToFacilitiesBtn` | `navigate('facilities')` |
| `#page-facility-detail` | `#editFacilityDetailBtn` | `openEditFacilityModal(currentFacilityId)` |
| `#page-facility-detail` | `#addSubFacilityBtn` | `openAddSubFacilityModal(currentFacilityId)` |
| `#page-facility-detail` | `[data-facility]` | `navigateToFacility(id)` |
| `#page-facility-detail` | `[data-fac-edit]` | `openEditFacilityModal(id)` |
| `#page-facility-detail` | `[data-fac-delete]` | `openConfirmDeleteFacility(id)` |
| `#employeesList` | `[data-edit]` | `openEditModal(id)` |
| `#employeesList` | `[data-delete]` | `openConfirmDelete(id)` |
| `#employeesList` | `tr[data-emp-id]` (النقر على الصف) | `navigateToEmployee(id)` |
| `#page-employee-detail` | `#backToEmployeesBtn` | `navigate('employees')` |
| `#page-employee-detail` | `#editEmployeeDetailBtn` | `openEditModal(currentEmployeeId)` |
| `#page-employee-detail` | `#deleteEmployeeDetailBtn` | يفتح `confirmModal` |

---

## 10. هيكل CSS

### 10.1 المتغيرات (Custom Properties)

```css
/* الألوان الأساسية */
--primary: #2563EB         /* أزرق */
--success: #10B981         /* أخضر */
--warning: #F59E0B         /* برتقالي */
--danger:  #EF4444         /* أحمر */
--purple:  #7C3AED         /* بنفسجي */

/* الشريط الجانبي */
--sidebar-bg: #0F172A
--sidebar-w:  260px

/* العام */
--bg:     #F1F5F9          /* خلفية الصفحة */
--card:   #FFFFFF          /* خلفية البطاقات */
--border: #E2E8F0
--text:   #0F172A          /* النص الأساسي */
--font:   'IBM Plex Sans Arabic', sans-serif
```

### 10.2 كلاسات الشارات (Badges)

| الكلاس | اللون | الاستخدام |
|---|---|---|
| `.badge-success` | أخضر | حالة "نشط" |
| `.badge-danger` | أحمر | حالة "غير نشط"، "خروج نهائي" |
| `.badge-warning` | أصفر | حالة "خروج مؤقت"، "اجازة" |
| `.badge-blue` | أزرق | منشأة أساسية، عدد موظفين |
| `.badge-purple` | بنفسجي | منشأة فرعية |

### 10.3 كلاسات النماذج (Forms)

| الكلاس | الوصف |
|---|---|
| `.form-grid` | شبكة عمودين `grid-template-columns: 1fr 1fr` |
| `.form-span-2` | يمتد على العمودين `grid-column: span 2` |
| `.form-section-label` | عنوان قسم داخل النموذج (نص صغير كبير — uppercase) |
| `.form-card` | بطاقة قسم في صفحة إضافة الموظف |
| `.form-actions-bar` | شريط أزرار الحفظ/إلغاء في أسفل الصفحة |
| `.add-emp-wrapper` | حاوية صفحة إضافة الموظف (max-width: 860px) |

### 10.4 كلاسات صفحة التفاصيل

| الكلاس | الوصف |
|---|---|
| `.detail-wrapper` | حاوية صفحة التفاصيل (max-width: 960px) |
| `.detail-breadcrumb` | شريط مسار التنقل (flexbox، gap: 6px) |
| `.breadcrumb-sep` | فاصل المسار `›` (لون رمادي) |
| `.info-grid` | شبكة 3 أعمدة لعرض بيانات المنشأة |
| `.info-item` | عنصر واحد في شبكة المعلومات (label + value) |
| `.info-label` | تسمية الحقل (uppercase، صغير، رمادي) |
| `.info-value` | قيمة الحقل |
| `.facility-name-link` | اسم المنشأة القابل للنقر (أزرق، تسطير عند hover) |

### 10.5 نقاط الاستجابة (Breakpoints)

| نقطة | التغييرات |
|---|---|
| `≤ 1100px` | stats-grid: 2 أعمدة، dashboard-grid: عمود واحد |
| `≤ 768px` | الشريط الجانبي مخفي (يظهر بزر القائمة)، form-grid: عمود واحد، info-grid: عمودان |
| `≤ 480px` | info-grid: عمود واحد |

---

## 11. مكونات الواجهة (UI Components)

### 11.1 الشريط الجانبي (Sidebar)

- **العرض:** `260px` (ثابت)
- **الخلفية:** `#0F172A` (كحلي غامق)
- **الموضع:** `fixed` على اليمين (RTL)
- **في الجوال:** `transform: translateX(100%)` — يُفتح بزر القائمة مع overlay داكن

### 11.2 المودالات (Modals)

| المعرف | الحجم | الاستخدام |
|---|---|---|
| `#facilityModal` | `modal-lg` (760px) | إضافة/تعديل منشأة |
| `#employeeModal` | `modal-lg` (760px) | تعديل موظف |
| `#confirmModal` | `modal-sm` (430px) | تأكيد الحذف |

جميع المودالات:
- تُغلق بالنقر على `overlay` خارج المودال
- تُغلق بمفتاح `Escape`
- لها `animation: slideUp` عند الظهور

### 11.3 رسائل الإشعار (Toast)

- **الموضع:** أسفل اليسار (`bottom: 24px; left: 24px`)
- **المدة:** 3000ms ثم تختفي
- **الأنواع:** `success` (أخضر)، `error` (أحمر)، `warning` (أصفر)، افتراضي (كحلي)

---

## 12. التحقق من البيانات (Validation)

### 12.1 إضافة / تعديل موظف

| الحقل | نوع التحقق |
|---|---|
| name, code, nationalId, idNumber, nationality, empType, facilityId, salary | `required` — لا يُقبل فراغ |
| code | فريد — مقارنة مع `employees` |

### 12.2 إضافة / تعديل منشأة

| الحقل | نوع التحقق |
|---|---|
| name, type | `required` — لا يُقبل فراغ |

---

## 13. توليد المعرفات (ID Generation)

```javascript
function uid() {
    return 'e' + Date.now() + Math.random().toString(36).slice(2, 7);
}
// مثال: 'e17433521234abcde'
```

التصادم نظرياً ممكن لكن احتماله ضئيل جداً في بيئة مستخدم واحد.

---

## 14. القيود والملاحظات التقنية

| القيد | التفاصيل |
|---|---|
| لا مزامنة | البيانات مخزنة في `localStorage` فقط — لا خادم، لا قاعدة بيانات |
| لا مصادقة | لا يوجد نظام تسجيل دخول أو صلاحيات |
| حجم localStorage | الحد الأقصى ~5MB لكل مصدر (كافٍ لآلاف السجلات) |
| لا رواية للمعاملات | حذف الموظفين أو المنشآت نهائي ولا يمكن التراجع عنه |
| الترابط عند الحذف | حذف منشأة لا يحذف موظفيها تلقائياً — الموظفون يبقون بـ `facilityId` يُشير إلى منشأة محذوفة |
| مستويات الهيكل الهرمي | محدود بمستويين فقط (أساسية → فرعية) — لا يدعم الهيكل الهرمي العميق |
