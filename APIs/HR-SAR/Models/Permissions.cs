namespace HR_SAR.Models;

/// <summary>All permission constants. Add new entries here for future features;
/// SuperAdmin is re-seeded with all permissions on every startup.</summary>
public static class Permissions
{
    public static class Dashboard
    {
        public const string View = "dashboard.view";
    }

    public static class Employees
    {
        public const string View   = "employees.view";
        public const string Create = "employees.create";
        public const string Edit   = "employees.edit";
        public const string Delete = "employees.delete";
    }

    public static class Facilities
    {
        public const string View   = "facilities.view";
        public const string Create = "facilities.create";
        public const string Edit   = "facilities.edit";
        public const string Delete = "facilities.delete";
    }

    public static class Transfers
    {
        public const string View   = "transfers.view";
        public const string Create = "transfers.create";
        public const string Edit   = "transfers.edit";
        public const string Delete = "transfers.delete";
    }

    public static class Reports
    {
        public const string View = "reports.view";
    }

    public static class Users
    {
        public const string View   = "users.view";
        public const string Create = "users.create";
        public const string Edit   = "users.edit";
        public const string Delete = "users.delete";
    }

    public static class Roles
    {
        public const string View   = "roles.view";
        public const string Create = "roles.create";
        public const string Edit   = "roles.edit";
        public const string Delete = "roles.delete";
    }

    public static class Profile
    {
        public const string View = "profile.view";
        public const string Edit = "profile.edit";
    }

    /// <summary>All permissions — used for seeding and JWT claims.</summary>
    public static IEnumerable<(string Name, string DisplayName, string Category)> All() =>
    [
        (Dashboard.View, "عرض لوحة التحكم", "Dashboard"),

        (Employees.View,   "عرض الموظفين", "Employees"),
        (Employees.Create, "إضافة موظف",   "Employees"),
        (Employees.Edit,   "تعديل موظف",   "Employees"),
        (Employees.Delete, "حذف موظف",     "Employees"),

        (Facilities.View,   "عرض المنشآت", "Facilities"),
        (Facilities.Create, "إضافة منشأة", "Facilities"),
        (Facilities.Edit,   "تعديل منشأة", "Facilities"),
        (Facilities.Delete, "حذف منشأة",   "Facilities"),

        (Transfers.View,   "عرض النقلات", "Transfers"),
        (Transfers.Create, "إضافة نقلة",  "Transfers"),
        (Transfers.Edit,   "تعديل نقلة",  "Transfers"),
        (Transfers.Delete, "حذف نقلة",    "Transfers"),

        (Reports.View, "عرض التقارير", "Reports"),

        (Users.View,   "عرض المستخدمين", "Users"),
        (Users.Create, "إضافة مستخدم",   "Users"),
        (Users.Edit,   "تعديل مستخدم",   "Users"),
        (Users.Delete, "حذف مستخدم",     "Users"),

        (Roles.View,   "عرض الأدوار", "Roles"),
        (Roles.Create, "إضافة دور",   "Roles"),
        (Roles.Edit,   "تعديل دور",   "Roles"),
        (Roles.Delete, "حذف دور",     "Roles"),

        (Profile.View, "عرض الملف الشخصي",   "Profile"),
        (Profile.Edit, "تعديل الملف الشخصي", "Profile"),
    ];

    /// <summary>Permissions granted to Manager role.</summary>
    public static readonly string[] ManagerPermissions =
    [
        Dashboard.View,
        Employees.View, Employees.Create, Employees.Edit,
        Facilities.View,
        Transfers.View, Transfers.Create,
        Reports.View,
        Profile.View, Profile.Edit,
    ];

    /// <summary>Permissions granted to Employee role.</summary>
    public static readonly string[] EmployeePermissions =
    [
        Dashboard.View,
        Transfers.View,
        Profile.View, Profile.Edit,
    ];
}
