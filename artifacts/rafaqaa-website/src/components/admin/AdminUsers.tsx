import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus, Shield, Pencil, Trash2, Check, X, Eye, EyeOff,
  UserCheck, UserX, Users, ShieldCheck, ChevronDown
} from "lucide-react";

// ── قائمة الصلاحيات الكاملة مجمّعة بأقسام ──
const ALL_PERMISSIONS = [
  { key: "view_dashboard",         label: "عرض لوحة التحكم",          description: "الإحصائيات العامة",                group: "عام" },
  { key: "view_donations",         label: "عرض التبرعات",              description: "رؤية قائمة جميع التبرعات",         group: "التبرعات" },
  { key: "review_donations",       label: "مراجعة التبرعات",           description: "عرض التبرعات قيد المراجعة",        group: "التبرعات" },
  { key: "approve_donations",      label: "اعتماد التبرعات",           description: "قبول التبرعات المعلقة",            group: "التبرعات" },
  { key: "reject_donations",       label: "رفض التبرعات",              description: "رفض التبرعات غير الصحيحة",        group: "التبرعات" },
  { key: "view_gateway",           label: "عرض الدفع الإلكتروني",      description: "رؤية عمليات الدفع",               group: "بوابة الدفع" },
  { key: "review_gateway",         label: "مراجعة الدفع الإلكتروني",   description: "مراجعة العمليات المعلقة",          group: "بوابة الدفع" },
  { key: "approve_gateway",        label: "اعتماد الدفع الإلكتروني",   description: "قبول أو رفض عمليات الدفع",        group: "بوابة الدفع" },
  { key: "manage_gateway_settings",label: "إعدادات بوابة الدفع",       description: "تعديل إعدادات البوابات",          group: "بوابة الدفع" },
  { key: "manage_manual_payments", label: "إدارة الدفع اليدوي",        description: "التحكم في بوابات الدفع اليدوي",   group: "الميداني" },
  { key: "manage_agents",          label: "إدارة المناديب",            description: "إضافة وتعديل المناديب الميدانيين",group: "الميداني" },
  { key: "manage_field_orders",    label: "إدارة طلبات التحصيل",       description: "متابعة وإدارة طلبات التحصيل",     group: "الميداني" },
  { key: "manage_campaigns",       label: "إدارة الحملات",             description: "إضافة وتعديل وحذف الحملات",       group: "المحتوى" },
  { key: "manage_success_stories", label: "إدارة قصص النجاح",          description: "نشر وتعديل قصص النجاح",           group: "المحتوى" },
  { key: "manage_banners",         label: "إدارة البانرات",            description: "إضافة وتعديل البانرات",           group: "المحتوى" },
  { key: "manage_notifications",   label: "إدارة الإشعارات",           description: "إرسال وإدارة إشعارات التواصل",    group: "النظام" },
  { key: "manage_seo",             label: "إدارة SEO",                 description: "تحسين محركات البحث",              group: "النظام" },
  { key: "manage_users",           label: "إدارة المستخدمين",          description: "إنشاء وتعديل حسابات الأدمن",      group: "النظام" },
  { key: "manage_settings",        label: "الإعدادات العامة",          description: "تعديل إعدادات الموقع",            group: "النظام" },
  { key: "manage_security",        label: "الحماية والأمان",           description: "إدارة الحماية والأمان",           group: "النظام" },
  { key: "view_audit_logs",        label: "عرض سجل العمليات",          description: "الاطلاع على سجل العمليات",        group: "النظام" },
  { key: "manage_backup",          label: "النسخ الاحتياطي",           description: "إجراء وإدارة النسخ الاحتياطية",  group: "النظام" },
];

// تجميع الصلاحيات حسب المجموعة
const GROUPED_PERMISSIONS = ALL_PERMISSIONS.reduce((acc, p) => {
  (acc[p.group] = acc[p.group] || []).push(p);
  return acc;
}, {} as Record<string, typeof ALL_PERMISSIONS>);

const COLOR_OPTIONS = [
  { value: "red", cls: "bg-red-500" }, { value: "blue", cls: "bg-blue-500" },
  { value: "green", cls: "bg-green-500" }, { value: "yellow", cls: "bg-yellow-400" },
  { value: "purple", cls: "bg-purple-500" }, { value: "gray", cls: "bg-gray-500" },
];

function colorClass(color: string) {
  return COLOR_OPTIONS.find(c => c.value === color)?.cls || "bg-gray-400";
}

interface PermissionType {
  id: string; name: string; description?: string;
  permissions: Record<string, boolean>; color: string; created_at: string;
}
interface AdminUser {
  id: string; username: string; display_name?: string;
  permission_type_id?: string; permission_type?: PermissionType;
  is_active: boolean; last_login?: string; created_at: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<PermissionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({ username: "", password: "", display_name: "", permission_type_id: "" });
  const [showPass, setShowPass] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editRole, setEditRole] = useState<PermissionType | null>(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "", color: "blue", permissions: {} as Record<string, boolean> });
  const [saving, setSaving] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(Object.keys(GROUPED_PERMISSIONS));

  async function load() {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        api.get<AdminUser[]>("/admin-users"),
        api.get<PermissionType[]>("/permission-types")
      ]);
      setUsers(u); setRoles(r);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreateUser() {
    setEditUser(null);
    setUserForm({ username: "", password: "", display_name: "", permission_type_id: roles[0]?.id || "" });
    setShowPass(false); setShowUserForm(true);
  }

  function openEditUser(u: AdminUser) {
    setEditUser(u);
    setUserForm({ username: u.username, password: "", display_name: u.display_name || "", permission_type_id: u.permission_type_id || "" });
    setShowPass(false); setShowUserForm(true);
  }

  async function saveUser() {
    setSaving(true);
    try {
      const body: any = { ...userForm };
      if (!body.password) delete body.password;
      if (editUser) {
        await api.patch(`/admin-users/${editUser.id}`, body);
        toast({ title: "تم تحديث المستخدم" });
      } else {
        await api.post("/admin-users", body);
        toast({ title: "تم إنشاء المستخدم" });
      }
      setShowUserForm(false); load();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function toggleActive(u: AdminUser) {
    try {
      await api.patch(`/admin-users/${u.id}`, { is_active: !u.is_active });
      toast({ title: u.is_active ? "تم إيقاف الحساب" : "تم تفعيل الحساب" });
      load();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try { await api.delete(`/admin-users/${id}`); toast({ title: "تم الحذف" }); load(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  function openCreateRole() {
    setEditRole(null);
    setRoleForm({ name: "", description: "", color: "blue", permissions: {} });
    setShowRoleForm(true);
  }

  function openEditRole(r: PermissionType) {
    setEditRole(r);
    setRoleForm({ name: r.name, description: r.description || "", color: r.color, permissions: { ...r.permissions } });
    setShowRoleForm(true);
  }

  async function saveRole() {
    setSaving(true);
    try {
      if (editRole) {
        await api.patch(`/permission-types/${editRole.id}`, roleForm);
        toast({ title: "تم تحديث نوع الصلاحية" });
      } else {
        await api.post("/permission-types", roleForm);
        toast({ title: "تم إنشاء نوع الصلاحية" });
      }
      setShowRoleForm(false); load();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function deleteRole(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    try { await api.delete(`/permission-types/${id}`); toast({ title: "تم الحذف" }); load(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  function toggleGroup(grp: string) {
    setOpenGroups(prev => prev.includes(grp) ? prev.filter(g => g !== grp) : [...prev, grp]);
  }

  // حساب عدد الصلاحيات المفعّلة لكل مجموعة
  function groupEnabledCount(grp: string, perms: Record<string, boolean>) {
    return (GROUPED_PERMISSIONS[grp] || []).filter(p => perms[p.key]).length;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold font-display">إدارة المستخدمين والصلاحيات</h2>
        <p className="text-muted-foreground text-sm mt-1">تحكم في وصول أعضاء الفريق إلى لوحة الإدارة</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: "users" as const, label: "المستخدمون", icon: Users, count: users.length },
          { id: "roles" as const, label: "أنواع الصلاحيات", icon: Shield, count: roles.length }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-4 h-4" />{t.label}
            <Badge variant="secondary" className="text-xs">{t.count}</Badge>
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateUser} className="gap-2">
              <UserPlus className="w-4 h-4" />إضافة مستخدم
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد مستخدمون بعد</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {users.map(u => (
                <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${u.permission_type ? colorClass(u.permission_type.color) : "bg-gray-400"}`}>
                    {(u.display_name || u.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{u.display_name || u.username}</span>
                      <span className="text-xs text-muted-foreground">@{u.username}</span>
                      {!u.is_active && <Badge variant="destructive" className="text-xs">موقوف</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {u.permission_type && (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white ${colorClass(u.permission_type.color)}`}>
                          <ShieldCheck className="w-3 h-3" />{u.permission_type.name}
                        </span>
                      )}
                      {u.last_login && (
                        <span className="text-xs text-muted-foreground">
                          آخر دخول: {new Date(u.last_login).toLocaleDateString("ar-EG")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditUser(u)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleActive(u)}>
                      {u.is_active
                        ? <UserX className="w-3.5 h-3.5 text-amber-500" />
                        : <UserCheck className="w-3.5 h-3.5 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteUser(u.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ROLES TAB ── */}
      {tab === "roles" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateRole} className="gap-2">
              <Shield className="w-4 h-4" />إضافة نوع صلاحية
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد أنواع صلاحيات بعد</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {roles.map(r => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${colorClass(r.color)}`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{r.name}</h4>
                      {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditRole(r)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteRole(r.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {/* Permissions grouped preview */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {Object.entries(GROUPED_PERMISSIONS).map(([grp, perms]) => {
                      const enabled = groupEnabledCount(grp, r.permissions);
                      return (
                        <div key={grp}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mt-2 mb-1">{grp} ({enabled}/{perms.length})</p>
                          {perms.map(p => (
                            <div key={p.key} className="flex items-center gap-1.5 py-0.5">
                              {r.permissions[p.key]
                                ? <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                                : <X className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />}
                              <span className={`text-xs ${r.permissions[p.key] ? "text-foreground" : "text-muted-foreground/40"}`}>
                                {p.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    {Object.values(r.permissions).filter(Boolean).length} صلاحية مفعّلة من أصل {ALL_PERMISSIONS.length}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── USER FORM MODAL ── */}
      <AnimatePresence>
        {showUserForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="font-bold text-lg mb-4">{editUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">الاسم المعروض</label>
                  <Input value={userForm.display_name}
                    onChange={e => setUserForm(f => ({ ...f, display_name: e.target.value }))}
                    placeholder="الاسم الكامل" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">اسم المستخدم *</label>
                  <Input value={userForm.username}
                    onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="username" dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {editUser ? "كلمة مرور جديدة (اتركها فارغة للإبقاء)" : "كلمة المرور *"}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      value={userForm.password}
                      onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••" dir="ltr" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">نوع الصلاحية</label>
                  <select
                    value={userForm.permission_type_id}
                    onChange={e => setUserForm(f => ({ ...f, permission_type_id: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                    <option value="">بدون صلاحيات</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={saveUser} disabled={saving} className="flex-1">
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button variant="outline" onClick={() => setShowUserForm(false)} className="flex-1">إلغاء</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ROLE FORM MODAL ── */}
      <AnimatePresence>
        {showRoleForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-lg mb-4">{editRole ? "تعديل نوع صلاحية" : "إنشاء نوع صلاحية جديد"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">اسم النوع *</label>
                  <Input value={roleForm.name}
                    onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="مثال: مشرف تبرعات" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">الوصف</label>
                  <Input value={roleForm.description}
                    onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="وصف مختصر للدور" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">اللون</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button key={c.value} type="button"
                        onClick={() => setRoleForm(f => ({ ...f, color: c.value }))}
                        className={`w-7 h-7 rounded-full ${c.cls} transition-transform ${roleForm.color === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-60 hover:opacity-100"}`} />
                    ))}
                  </div>
                </div>

                {/* Permissions — مقسّمة بأقسام قابلة للطي */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">الصلاحيات</label>
                    <div className="flex gap-2 text-xs">
                      <button type="button" onClick={() => {
                        const all: Record<string, boolean> = {};
                        ALL_PERMISSIONS.forEach(p => all[p.key] = true);
                        setRoleForm(f => ({ ...f, permissions: all }));
                      }} className="text-primary hover:underline">تحديد الكل</button>
                      <span className="text-muted-foreground">|</span>
                      <button type="button" onClick={() => setRoleForm(f => ({ ...f, permissions: {} }))}
                        className="text-destructive hover:underline">إلغاء الكل</button>
                    </div>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden">
                    {Object.entries(GROUPED_PERMISSIONS).map(([grp, perms], i) => {
                      const enabledCount = groupEnabledCount(grp, roleForm.permissions);
                      const isOpen = openGroups.includes(grp);
                      return (
                        <div key={grp} className={i > 0 ? "border-t border-border" : ""}>
                          {/* Group header */}
                          <button type="button" onClick={() => toggleGroup(grp)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{grp}</span>
                              <Badge variant={enabledCount > 0 ? "default" : "secondary"} className="text-xs">
                                {enabledCount}/{perms.length}
                              </Badge>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>

                          {/* Group permissions */}
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-3 pt-1 space-y-1 bg-muted/20">
                                  {perms.map(p => (
                                    <label key={p.key}
                                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={!!roleForm.permissions[p.key]}
                                        onChange={() => setRoleForm(f => ({
                                          ...f,
                                          permissions: { ...f.permissions, [p.key]: !f.permissions[p.key] }
                                        }))}
                                        className="w-4 h-4 mt-0.5 rounded accent-primary flex-shrink-0"
                                      />
                                      <div>
                                        <div className="text-sm font-medium leading-tight">{p.label}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {Object.values(roleForm.permissions).filter(Boolean).length} صلاحية مفعّلة من أصل {ALL_PERMISSIONS.length}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6 sticky bottom-0 bg-card pt-3 border-t border-border -mx-6 px-6 pb-1">
                <Button onClick={saveRole} disabled={saving} className="flex-1">
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button variant="outline" onClick={() => setShowRoleForm(false)} className="flex-1">إلغاء</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
