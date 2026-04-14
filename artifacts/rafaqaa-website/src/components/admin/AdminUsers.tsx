import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus, Shield, Pencil, Trash2, Check, X, Plus, Eye, EyeOff,
  UserCheck, UserX, Users, ShieldCheck
} from "lucide-react";

const ALL_PERMISSIONS = [
  { key: "manage_campaigns", label: "إدارة الحملات", description: "إضافة وتعديل وحذف الحملات" },
  { key: "manage_donations", label: "إدارة التبرعات", description: "عرض وتعديل بيانات التبرعات" },
  { key: "approve_donations", label: "اعتماد التبرعات", description: "قبول أو رفض التبرعات المعلقة" },
  { key: "manage_settings", label: "إعدادات الموقع", description: "تعديل إعدادات الموقع" },
  { key: "manage_banners", label: "إدارة البانرات", description: "إضافة وتعديل البانرات" },
  { key: "manage_users", label: "إدارة المستخدمين", description: "إنشاء وتعديل حسابات الأدمن" },
  { key: "view_reports", label: "عرض التقارير", description: "الاطلاع على الإحصائيات" },
  { key: "delete_records", label: "حذف البيانات", description: "حذف أي سجلات" },
];

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

  async function load() {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([api.get<AdminUser[]>("/admin-users"), api.get<PermissionType[]>("/permission-types")]);
      setUsers(u); setRoles(r);
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
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
      if (editUser) { await api.patch(`/admin-users/${editUser.id}`, body); toast({ title: "تم تحديث المستخدم" }); }
      else { await api.post("/admin-users", body); toast({ title: "تم إنشاء المستخدم" }); }
      setShowUserForm(false); load();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }
  async function toggleActive(u: AdminUser) {
    try { await api.patch(`/admin-users/${u.id}`, { is_active: !u.is_active }); toast({ title: u.is_active ? "تم إيقاف الحساب" : "تم تفعيل الحساب" }); load(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }
  async function deleteUser(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try { await api.delete(`/admin-users/${id}`); toast({ title: "تم الحذف" }); load(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }
  function openCreateRole() {
    setEditRole(null); setRoleForm({ name: "", description: "", color: "blue", permissions: {} }); setShowRoleForm(true);
  }
  function openEditRole(r: PermissionType) {
    setEditRole(r); setRoleForm({ name: r.name, description: r.description || "", color: r.color, permissions: { ...r.permissions } }); setShowRoleForm(true);
  }
  async function saveRole() {
    setSaving(true);
    try {
      if (editRole) { await api.patch(`/permission-types/${editRole.id}`, roleForm); toast({ title: "تم التحديث" }); }
      else { await api.post("/permission-types", roleForm); toast({ title: "تم الإنشاء" }); }
      setShowRoleForm(false); load();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }
  async function deleteRole(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    try { await api.delete(`/permission-types/${id}`); toast({ title: "تم الحذف" }); load(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold font-display">إدارة المستخدمين والصلاحيات</h2>
        <p className="text-muted-foreground text-sm mt-1">تحكم في وصول أعضاء الفريق إلى لوحة الإدارة</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {[{ id: "users" as const, label: "المستخدمون", icon: Users, count: users.length },
          { id: "roles" as const, label: "أنواع الصلاحيات", icon: Shield, count: roles.length }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-4 h-4" />{t.label}
            <Badge variant="secondary" className="text-xs">{t.count}</Badge>
          </button>
        ))}
      </div>

      {/* USERS */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button onClick={openCreateUser} className="gap-2"><UserPlus className="w-4 h-4" />إضافة مستخدم</Button></div>
          {loading ? <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div> : users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا يوجد مستخدمون بعد</p></div>
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
                      {u.last_login && <span className="text-xs text-muted-foreground">آخر دخول: {new Date(u.last_login).toLocaleDateString("ar-EG")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditUser(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleActive(u)}>
                      {u.is_active ? <UserX className="w-3.5 h-3.5 text-amber-500" /> : <UserCheck className="w-3.5 h-3.5 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteUser(u.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ROLES */}
      {tab === "roles" && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button onClick={openCreateRole} className="gap-2"><Plus className="w-4 h-4" />إنشاء نوع صلاحية</Button></div>
          {loading ? <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div> : roles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><Shield className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد أنواع صلاحيات</p></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {roles.map(r => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${colorClass(r.color)}`} />
                      <h3 className="font-semibold">{r.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditRole(r)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteRole(r.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground mb-3">{r.description}</p>}
                  <div className="space-y-1.5">
                    {ALL_PERMISSIONS.map(p => (
                      <div key={p.key} className="flex items-center gap-2">
                        {r.permissions[p.key] ? <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />}
                        <span className={`text-xs ${r.permissions[p.key] ? "text-foreground" : "text-muted-foreground/50"}`}>{p.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    {users.filter(u => u.permission_type_id === r.id).length} مستخدم مرتبط
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USER MODAL */}
      <AnimatePresence>
        {showUserForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{editUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowUserForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-3">
                <div><label className="text-sm font-medium mb-1 block">الاسم الظاهر</label>
                  <Input placeholder="مثال: محمد أحمد" value={userForm.display_name} onChange={e => setUserForm(f => ({ ...f, display_name: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1 block">اسم المستخدم *</label>
                  <Input placeholder="مثال: mohamed" dir="ltr" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1 block">{editUser ? "كلمة مرور جديدة (فارغة = لا تغيير)" : "كلمة المرور *"}</label>
                  <div className="relative">
                    <Input type={showPass ? "text" : "password"} placeholder="6 أحرف على الأقل" dir="ltr"
                      value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-2.5 text-muted-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div><label className="text-sm font-medium mb-1 block">نوع الصلاحية *</label>
                  <select value={userForm.permission_type_id} onChange={e => setUserForm(f => ({ ...f, permission_type_id: e.target.value }))}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                    <option value="">-- اختر --</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button variant="outline" onClick={() => setShowUserForm(false)}>إلغاء</Button>
                <Button onClick={saveUser} disabled={saving}>{saving ? "..." : editUser ? "تحديث" : "إنشاء"}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ROLE MODAL */}
      <AnimatePresence>
        {showRoleForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{editRole ? "تعديل نوع الصلاحية" : "إنشاء نوع صلاحية جديد"}</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowRoleForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-3">
                <div><label className="text-sm font-medium mb-1 block">الاسم *</label>
                  <Input placeholder="مثال: مشرف الحملات" value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1 block">الوصف</label>
                  <Input placeholder="وصف مختصر للصلاحية" value={roleForm.description} onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">اللون</label>
                  <div className="flex gap-2">{COLOR_OPTIONS.map(c => (
                    <button key={c.value} onClick={() => setRoleForm(f => ({ ...f, color: c.value }))}
                      className={`w-8 h-8 rounded-full ${c.cls} border-2 transition-transform ${roleForm.color === c.value ? "border-foreground scale-110" : "border-transparent"}`} />
                  ))}</div>
                </div>
                <div><label className="text-sm font-medium mb-2 block">الصلاحيات</label>
                  <div className="space-y-2 bg-muted/30 rounded-xl p-4">
                    {ALL_PERMISSIONS.map(p => (
                      <label key={p.key} className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={!!roleForm.permissions[p.key]}
                          onChange={() => setRoleForm(f => ({ ...f, permissions: { ...f.permissions, [p.key]: !f.permissions[p.key] } }))}
                          className="w-4 h-4 mt-0.5 rounded" />
                        <div><div className="text-sm font-medium">{p.label}</div>
                          <div className="text-xs text-muted-foreground">{p.description}</div></div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button variant="outline" onClick={() => setShowRoleForm(false)}>إلغاء</Button>
                <Button onClick={saveRole} disabled={saving}>{saving ? "..." : editRole ? "تحديث" : "إنشاء"}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
