# وثيقة مواصفات متطلبات النظام (SRS)
## نظام إدارة الموارد البشرية — HR Management System

---

**الإصدار:** 2.0
**التاريخ:** 2026-04-07
**الحالة:** قيد التطوير

---

## سجل التغييرات

| الإصدار | التاريخ | التغيير |
|---|---|---|
| 1.0 | 2026-03-28 | الإصدار الأولي — Vanilla JS + localStorage |
| 1.1 | 2026-03-30 | إضافة وحدة الخدمات والنقل والتحويل |
| 1.2 | 2026-03-31 | تصحيح هيكل التوجيه في main-content |
| 2.0 | 2026-04-07 | **إعادة هيكلة معمارية كاملة** — React 19 + Vite للواجهة الأمامية؛ ASP.NET Core 10 REST API للخلفية؛ SQL Server + Entity Framework Core؛ ASP.NET Identity + JWT؛ نظام الأدوار والصلاحيات |

---

## 1. نظرة عامة تقنية

### 1.1 نوع التطبيق

Full-Stack Web Application — واجهة أمامية React SPA تتصل بـ REST API خلفية مبنية على ASP.NET Core.

### 1.2 المكدس التقني (Tech Stack)

| الطبقة | التقنية |
|---|---|
| **الواجهة الأمامية** | React 19, Vite 8, React Router DOM v7 |
| **التنسيق** | CSS Modules + CSS Custom Properties (RTL) |
| **الخط** | IBM Plex Sans Arabic — Google Fonts |
| **خادم API** | ASP.NET Core 10 (Web API) |
| **قاعدة البيانات** | SQL Server (LocalDB / SQL Server Express) |
| **ORM** | Entity Framework Core 10 |
| **المصادقة** | ASP.NET Core Identity + JWT Bearer |
| **توثيق API** | Swagger / OpenAPI (Swashbuckle) |
| **أطر خارجية** | Zero JS dependencies على الواجهة الأمامية |

### 1.3 بنية الملفات

```
HR-SAR/
├── APIs/HR-SAR/                        # الخلفية — ASP.NET Core
│   ├── Controllers/                    # نقاط النهاية (Endpoints)
│   │   ├── AuthController.cs
│   │   ├── DashboardController.cs
│   │   ├── EmployeesController.cs
│   │   ├── FacilitiesController.cs
│   │   ├── ProfileController.cs
│   │   ├── RolesController.cs
│   │   ├── TransfersController.cs
│   │   └── UsersController.cs
│   ├── Data/
│   │   ├── AppDbContext.cs             # EF Core DbContext
│   │   └── DataSeeder.cs              # بيانات أولية (Admin + Permissions)
│   ├── DTOs/                           # كائنات نقل البيانات
│   ├── Migrations/                     # ترحيلات قاعدة البيانات
│   ├── Models/                         # نماذج EF Core
│   ├── Services/                       # طبقة الأعمال
│   ├── appsettings.json               # إعدادات DB + JWT
│   └── Program.cs                     # نقطة الإقلاع
│
├── frontend/                           # الواجهة الأمامية — React
│   ├── src/
│   │   ├── api/                        # وحدات استدعاء API
│   │   │   ├── client.js              # apiFetch + buildQuery
│   │   │   ├── auth.api.js
│   │   │   ├── dashboard.api.js
│   │   │   ├── employees.api.js
│   │   │   ├── facilities.api.js
│   │   │   ├── roles.api.js
│   │   │   ├── transfers.api.js
│   │   │   └── users.api.js
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx      # الهيكل العام (Sidebar + TopBar)
│   │   │   │   ├── Sidebar.jsx        # الشريط الجانبي + تصفية الصلاحيات
│   │   │   │   └── TopBar.jsx         # الشريط العلوي
│   │   │   └── ui/
│   │   │       ├── Avatar.jsx
│   │   │       ├── Badge.jsx
│   │   │       ├── ConfirmDialog.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── Toast.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # حالة المصادقة + hasPermission()
│   │   ├── hooks/
│   │   │   └── usePermission.js
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Employees/
│   │   │   ├── Facilities/
│   │   │   ├── Login/
│   │   │   ├── Profile/
│   │   │   ├── Roles/
│   │   │   ├── Transfers/
│   │   │   └── Users/
│   │   ├── styles/
│   │   │   └── global.css             # متغيرات CSS + أنماط مشتركة
│   │   ├── App.jsx                    # Router + Providers
│   │   └── main.jsx                   # نقطة الإقلاع
│   ├── index.html
│   └── vite.config.js
│
├── Documents/
│   ├── BRD.md
│   └── SRS.md
└── HR-SAR.sln
```

---

## 2. متطلبات البيئة

### 2.1 الخلفية (Backend)

| المتطلب | التفاصيل |
|---|---|
| Runtime | .NET 10 SDK |
| قاعدة البيانات | SQL Server (LocalDB أو SQL Server Express) |
| المنفذ الافتراضي | `http://localhost:5140` |

### 2.2 الواجهة الأمامية (Frontend)

| المتطلب | التفاصيل |
|---|---|
| Runtime | Node.js 20+ |
| Package Manager | npm |
| المتصفحات المدعومة | Chrome 90+، Firefox 88+، Edge 90+، Safari 14+ |
| المنفذ الافتراضي | `http://localhost:5173` |

---

## 3. إعدادات التطبيق

### 3.1 إعدادات الخلفية — `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=HR_SAR_DB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "HR-SAR-SuperSecret-JWT-Key-2026-MustBe32CharsMin!",
    "Issuer": "HR-SAR",
    "Audience": "HR-SAR-Client",
    "ExpiryHours": "24"
  }
}
```

### 3.2 إعدادات الواجهة الأمامية — `src/api/client.js`

```javascript
const API_BASE = 'http://localhost:5140/api';
```

---

## 4. المصادقة والتفويض

### 4.1 تدفق تسجيل الدخول

```
POST /api/auth/login
→ يُعيد: { token, userId, email, fullName, roles[], permissions[] }
→ يُخزَّن في localStorage: hr_token + hr_user
→ يُرسَل في كل طلب: Authorization: Bearer <token>
```

### 4.2 نموذج بيانات المستخدم المُعاد (AuthContext)

```javascript
{
  userId:      String,   // GUID
  email:       String,
  fullName:    String,
  jobTitle:    String,
  roleName:    String,   // اسم الدور الأول
  roles:       String[], // أسماء الأدوار
  permissions: String[], // مثال: ['employees.view', 'employees.create', ...]
  isActive:    Boolean,
}
```

### 4.3 نمط الصلاحيات

```
{module}.{action}
```

| الوحدة | الصلاحيات المتاحة |
|---|---|
| employees | view, create, edit, delete |
| facilities | view, create, edit, delete |
| transfers | view, create, edit, delete |
| users | view, create, edit, delete |
| roles | view, create, edit, delete |
| reports | view |
| dashboard | view |

### 4.4 التحقق في الواجهة الأمامية

```javascript
// AuthContext.jsx
hasPermission(perm) {
  if (user.isAdmin || user.isSuperAdmin) return true;
  return user.permissions.includes(perm);
}

// الاستخدام في المكونات
const { hasPermission } = useAuth();
if (hasPermission('employees.create')) { /* أظهر الزر */ }
```

### 4.5 حماية المسارات

- `PrivateRoute` — يُعيد توجيه غير المسجَّلين إلى `/login`
- `PublicRoute` — يُعيد توجيه المسجَّلين إلى `/`
- انتهاء الجلسة (401) — يُنظِّف localStorage ويُعيد التوجيه تلقائياً

---

## 5. التوجيه (Client-Side Routing)

### 5.1 جدول المسارات

| المسار | المكوّن | الحماية | الصلاحية المطلوبة |
|---|---|---|---|
| `/login` | LoginPage | PublicRoute | — |
| `/` | DashboardPage | PrivateRoute | — |
| `/employees` | EmployeesPage | PrivateRoute | employees.view |
| `/facilities` | FacilitiesPage | PrivateRoute | facilities.view |
| `/transfers` | TransfersPage | PrivateRoute | — |
| `/users` | UsersPage | PrivateRoute | users.view |
| `/roles` | RolesPage | PrivateRoute | roles.view |
| `/profile` | ProfilePage | PrivateRoute | — |
| `*` | Redirect → `/` | — | — |

### 5.2 عرض روابط الشريط الجانبي

روابط الشريط الجانبي تُفلتَر بناءً على الصلاحيات قبل الرسم:

```javascript
const visibleItems = NAV_ITEMS.filter((item) =>
  !item.permission || hasPermission(item.permission)
);
```

---

## 6. نقاط النهاية (API Endpoints)

### 6.1 المصادقة — `/api/auth`

| الطريقة | المسار | الوصف |
|---|---|---|
| POST | `/auth/login` | تسجيل الدخول |
| POST | `/auth/register` | تسجيل مستخدم جديد |

### 6.2 الملف الشخصي — `/api/profile`

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/profile` | جلب بيانات المستخدم الحالي |
| PUT | `/profile` | تحديث الاسم والمسمى الوظيفي |
| POST | `/profile/change-password` | تغيير كلمة المرور |

### 6.3 الموظفون — `/api/employees`

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/employees?search=&status=` | قائمة الموظفين مع فلترة |
| GET | `/employees/{id}` | تفاصيل موظف |
| POST | `/employees` | إضافة موظف |
| PUT | `/employees/{id}` | تعديل موظف |
| DELETE | `/employees/{id}` | حذف موظف |

### 6.4 المنشآت — `/api/facilities`

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/facilities?search=` | قائمة المنشآت |
| GET | `/facilities/{id}` | تفاصيل منشأة |
| POST | `/facilities` | إضافة منشأة |
| PUT | `/facilities/{id}` | تعديل منشأة |
| DELETE | `/facilities/{id}` | حذف منشأة |

### 6.5 النقل والتحويل — `/api/transfers`

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/transfers?search=&status=&type=` | قائمة الطلبات |
| GET | `/transfers/{id}` | تفاصيل طلب |
| POST | `/transfers` | إنشاء طلب جديد |
| PUT | `/transfers/{id}/status` | تحديث حالة الطلب |
| DELETE | `/transfers/{id}` | حذف طلب |

### 6.6 المستخدمون — `/api/users`

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/users` | قائمة المستخدمين |
| GET | `/users/{id}` | تفاصيل مستخدم |
| POST | `/users` | إنشاء مستخدم |
| PUT | `/users/{id}` | تعديل مستخدم |
| DELETE | `/users/{id}` | حذف مستخدم |
| POST | `/users/{id}/reset-password` | إعادة تعيين كلمة المرور |

### 6.7 الأدوار والصلاحيات — `/api/roles`

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/roles` | قائمة الأدوار |
| GET | `/roles/{id}` | تفاصيل دور مع صلاحياته |
| POST | `/roles` | إنشاء دور |
| PUT | `/roles/{id}` | تعديل دور |
| DELETE | `/roles/{id}` | حذف دور |
| GET | `/roles/permissions` | قائمة جميع الصلاحيات المتاحة |

### 6.8 لوحة التحكم — `/api/dashboard`

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/dashboard` | إحصائيات الموظفين والمنشآت وآخر النقلات |

---

## 7. نماذج البيانات (Data Models)

### 7.1 نموذج الموظف (Employee)

```csharp
{
  Id:              Guid,
  EmployeeCode:    string,     // فريد — إلزامي
  FullName:        string,     // إلزامي
  NationalId:      string,
  IdNumber:        string,
  Nationality:     string,
  EmployeeType:    string,     // 'سعودي' | 'اجنبي'
  FacilityId:      Guid,       // FK → Facility — إلزامي
  Salary:          decimal,
  Status:          string,     // انظر §7.5
  JobTitle:        string,
  Department:      string,
  Manager:         string,
  WorkLocation:    string,
  Grade:           string,
  EntryDate:       DateTime?,
  IdExpiry:        DateTime?,
  Bank:            string,
  Iban:            string,
  Phone:           string,
  CreatedAt:       DateTime,
  UpdatedAt:       DateTime,
}
```

### 7.2 نموذج المنشأة (Facility)

```csharp
{
  Id:               Guid,
  Name:             string,    // إلزامي
  Type:             string,    // 'اساسية' | 'فرعية'
  ParentId:         Guid?,     // FK → Facility (للفرعية فقط)
  NationalNumber:   string,
  CrNumber:         string,
  CrDate:           DateTime?,
  TaxNumber:        string,
  InsuranceNumber:  string,
  NationalAddress:  string,
  WorkLocation:     string,
  EconomicActivity: string,
  Isic4:            string,
  CreatedAt:        DateTime,
}
```

### 7.3 نموذج طلب النقل (Transfer)

```csharp
{
  Id:                   Guid,
  Type:                 string,     // 'internal' | 'external'
  Direction:            string?,    // 'out' | 'in'
  TransferSubType:      string?,    // 'sponsorship' | 'secondment'
  EmployeeId:           Guid,
  Status:               string,     // انظر §7.6
  EffectiveDate:        DateTime?,
  TargetCompany:        string,
  Reason:               string,
  ExpectedDate:         DateTime?,
  GovernmentRefNumber:  string,
  Notes:                string,
  CreatedBy:            string,
  CreatedAt:            DateTime,
  UpdatedAt:            DateTime,
  RejectionReason:      string,
}
```

### 7.4 نموذج المستخدم (ApplicationUser : IdentityUser)

```csharp
{
  Id:        string,   // GUID
  Email:     string,   // فريد — إلزامي
  FullName:  string,
  JobTitle:  string,
  IsActive:  bool,
  CreatedAt: DateTime,
  // الأدوار والصلاحيات عبر ASP.NET Identity
}
```

### 7.5 قيم الحالة الوظيفية

| القيمة | الشارة | الوصف |
|---|---|---|
| `نشط` | badge-success | موظف نشط |
| `غير نشط` | badge-secondary | موظف غير نشط |
| `خروج نهائي` | badge-danger | انتهت خدمته نهائياً |
| `خروج مؤقت` | badge-warning | مجمَّد أثناء نقل خارجي معلق |
| `اجازة` | badge-warning | في إجازة |

### 7.6 حالات طلب النقل

| الحالة | الوصف |
|---|---|
| `draft` | مسودة |
| `pending_approval` | قيد الاعتماد |
| `approved` | معتمد |
| `pending_government` | معلق — إجراء حكومي |
| `completed` | مكتمل |
| `rejected` | مرفوض |
| `cancelled` | ملغى |

---

## 8. هيكل قاعدة البيانات

### 8.1 الجداول الرئيسية

| الجدول | الوصف |
|---|---|
| `AspNetUsers` | حسابات المستخدمين (Identity) |
| `AspNetRoles` | تعريفات الأدوار |
| `AspNetUserRoles` | ربط المستخدمين بالأدوار |
| `Permissions` | الصلاحيات المتاحة في النظام |
| `RolePermissions` | ربط الأدوار بالصلاحيات |
| `Employees` | بيانات الموظفين |
| `Facilities` | بيانات المنشآت |
| `Transfers` | طلبات النقل والتحويل |

### 8.2 ترحيلات قاعدة البيانات

| الترحيل | التاريخ | المحتوى |
|---|---|---|
| `InitialCreate` | 2026-04-04 | جداول Employees + Facilities + Transfers |
| `AddIdentityAndPermissions` | 2026-04-05 | جداول Identity + Permissions + RolePermissions |

---

## 9. طبقة الواجهة الأمامية

### 9.1 إدارة الحالة (State Management)

لا يوجد مكتبة state management خارجية. الحالة تُدار عبر:

| الآلية | الاستخدام |
|---|---|
| `AuthContext` (React Context) | بيانات المستخدم + الصلاحيات + دوال login/logout |
| `ToastContext` | إشعارات النجاح والخطأ |
| `useState` المحلي | حالة كل صفحة (بيانات، تحميل، نماذج، مودالات) |
| `useCallback + useEffect` | استدعاء API مع تبعيات الفلترة |

### 9.2 نمط استدعاء API

```javascript
// src/api/client.js
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('hr_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    window.location.href = '/';
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
```

### 9.3 نمط الصفحات (Pages Pattern)

كل صفحة تتبع هذا النمط:

```
PageName/
├── PageName.jsx          # المكوّن الرئيسي (جدول + فلترة + إجراءات)
├── PageName.module.css   # تنسيقات محلية
└── EntityModal.jsx       # نموذج الإضافة/التعديل
```

### 9.4 المكونات المشتركة

| المكوّن | الوصف |
|---|---|
| `Modal` | نافذة منبثقة مع إغلاق بـ Escape + النقر الخارجي |
| `ConfirmDialog` | تأكيد الحذف مع أيقونة تحذير |
| `Toast` | إشعارات مؤقتة (3 ثوانٍ) من نوع: success, error, warning, info |
| `Badge` | شارات ملوّنة للحالات |
| `Avatar` | دائرة ملوّنة بالحرف الأول من الاسم |
| `EmptyState` | حالة البيانات الفارغة |

---

## 10. البيانات الأولية (Data Seeding)

يُنفِّذ `DataSeeder.cs` عند أول تشغيل:

1. ينشئ دور **Super Admin** بجميع الصلاحيات
2. ينشئ حساب المدير الافتراضي:
   - **البريد:** `admin@hrsar.com`
   - **كلمة المرور:** `Admin@123456`
3. يُسجِّل جميع الصلاحيات في جدول `Permissions`

---

## 11. المتطلبات غير الوظيفية

| الرقم | المتطلب | القيمة |
|---|---|---|
| NFR-01 | لغة الواجهة | العربية بالكامل، اتجاه RTL |
| NFR-02 | تنسيق الأرقام | ar-SA (toLocaleString) |
| NFR-03 | صلاحية رمز JWT | 24 ساعة |
| NFR-04 | تشفير كلمات المرور | bcrypt عبر ASP.NET Identity |
| NFR-05 | CORS | مفتوح في التطوير، يُقيَّد في الإنتاج |
| NFR-06 | أمان كلمة المرور | 8 أحرف+، حرف كبير، حرف صغير، رقم |

---

## 12. متغيرات CSS الأساسية

```css
:root {
  --primary: #2563EB;      --primary-dark: #1D4ED8;
  --success: #10B981;      --success-bg: #ECFDF5;
  --warning: #F59E0B;      --warning-bg: #FFFBEB;
  --danger:  #EF4444;      --danger-bg:  #FEF2F2;
  --purple:  #7C3AED;      --purple-bg:  #F5F3FF;
  --sidebar-bg: #0F172A;   --sidebar-w: 260px;
  --topbar-h:  68px;
  --radius: 14px;          --radius-sm: 9px;
}
```
