import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, Edit2, Trash2, X, Check, AlertCircle,
  Loader2, Mail, UserCheck
} from "lucide-react";
import { useAuth, ROLES, PERMISSIONS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usersApi } from "../services/workshopApi";

const INITIAL_USERS = [
  { id: "1", name: "Alex Admin", email: "admin@citibank.com", role: ROLES.ADMIN, department: "IT", status: "active", joined: "2024-01-15" },
  { id: "2", name: "Maria Manager", email: "manager@citibank.com", role: ROLES.MANAGER, department: "Operations", status: "active", joined: "2024-02-10" },
  { id: "3", name: "Chris Contrib", email: "contributor@citibank.com", role: ROLES.CONTRIBUTOR, department: "Finance", status: "active", joined: "2024-03-05" },
  { id: "4", name: "Victor Viewer", email: "viewer@citibank.com", role: ROLES.VIEWER, department: "Compliance", status: "active", joined: "2024-03-20" },
  { id: "5", name: "Priya Patel", email: "priya.patel@citibank.com", role: ROLES.CONTRIBUTOR, department: "Engineering", status: "active", joined: "2024-04-01" },
  { id: "6", name: "James Wilson", email: "james.w@citibank.com", role: ROLES.VIEWER, department: "HR", status: "inactive", joined: "2024-01-20" },
  { id: "7", name: "Sarah Chen", email: "s.chen@citibank.com", role: ROLES.MANAGER, department: "Product", status: "active", joined: "2024-02-28" },
  { id: "8", name: "David Kumar", email: "d.kumar@citibank.com", role: ROLES.CONTRIBUTOR, department: "Finance", status: "active", joined: "2024-05-01" },
];

const EMPTY_FORM = { name: "", email: "", role: ROLES.VIEWER, department: "", status: "active" };

const ROLE_BADGE = {
  admin: "badge-admin",
  manager: "badge-manager",
  contributor: "badge-contributor",
  viewer: "badge-viewer",
};

const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  contributor: "Contributor",
  viewer: "Viewer",
};

function UserModal({ user, onSave, onClose, canManageRoles }) {
  const [form, setForm] = useState(user ? { ...user } : { ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (!form.department.trim()) e.department = "Department is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onSave({ ...form, id: user?.id || crypto.randomUUID() });
    setLoading(false);
  };

  const f = (field) => (ev) => { setForm(p => ({ ...p, [field]: ev.target.value })); setErrors(p => { const n = {...p}; delete n[field]; return n; }); };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="modal-header">
          <h3>{user ? "Edit User" : "Add New User"}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="btn-modal-close"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input className="form-input" placeholder="John Doe" value={form.name} onChange={f("name")}/>
              {errors.name && <p className="form-error"><AlertCircle size={12}/>{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="required">*</span></label>
              <input className="form-input" type="email" placeholder="john@citibank.com" value={form.email} onChange={f("email")}/>
              {errors.email && <p className="form-error"><AlertCircle size={12}/>{errors.email}</p>}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={f("role")} disabled={!canManageRoles}>
                  {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {!canManageRoles && <p className="form-error" style={{color:"var(--color-text-muted)"}}>Only admins can change roles</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={f("status")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Department <span className="required">*</span></label>
              <input className="form-input" placeholder="e.g. Engineering" value={form.department} onChange={f("department")}/>
              {errors.department && <p className="form-error"><AlertCircle size={12}/>{errors.department}</p>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="btn-user-save">
              {loading ? <Loader2 size={15} style={{animation:"spin 0.8s linear infinite"}}/> : <Check size={15}/>}
              {loading ? "Saving..." : user ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function UsersPage() {
  const { hasPermission, hasRole } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.USERS_WRITE);
  const canDelete = hasPermission(PERMISSIONS.USERS_DELETE);
  const canManageRoles = hasPermission(PERMISSIONS.ROLES_MANAGE);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | "add" | user object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.list();
      const items = data?.items || data || [];
      setUsers(Array.isArray(items) ? items : INITIAL_USERS);
    } catch (err) {
      // Backend unavailable — show seed data
      setUsers(INITIAL_USERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const handleSave = useCallback(async (data) => {
    try {
      if (data.id && users.find(u => u.id === data.id)) {
        await usersApi.update(data.id, data);
        toast("User updated successfully", "success");
      } else {
        await usersApi.create(data);
        toast("User created successfully", "success");
      }
      setModal(null);
      fetchUsers();
    } catch (err) {
      toast("Save failed: " + err.message, "error");
    }
  }, [users, toast]);

  const handleDelete = useCallback(async (id) => {
    try {
      await usersApi.remove(id);
      setDeleteTarget(null);
      toast("User deleted", "warning");
      fetchUsers();
    } catch (err) {
      toast("Delete failed: " + err.message, "error");
    }
  }, [toast]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    admin: users.filter(u => u.role === ROLES.ADMIN).length,
    manager: users.filter(u => u.role === ROLES.MANAGER).length,
  }), [users]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Users Management</h1>
          <p>Manage platform users, roles, and access permissions</p>
        </div>
        <div className="page-header-right">
          {canWrite && (
            <button className="btn btn-primary" onClick={() => setModal("add")} id="btn-add-user">
              <Plus size={16}/> Add User
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Users", value:stats.total, color:"#6366f1" },
          { label:"Active", value:stats.active, color:"#10b981" },
          { label:"Admins", value:stats.admin, color:"#f43f5e" },
          { label:"Managers", value:stats.manager, color:"#8b5cf6" },
        ].map((s,i) => (
          <motion.div key={s.label} className="metric-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
            <div className="metric-value" style={{color:s.color}}>{s.value}</div>
            <div className="metric-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Table Card */}
      <motion.div className="glass-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
        <div className="card-header">
          <div className="card-title"><h2>All Users</h2><p>{filtered.length} of {users.length} users</p></div>
        </div>
        <div style={{padding:"16px 24px 0"}}>
          <div className="search-bar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon"/>
              <input className="form-input" placeholder="Search by name, email or department…" value={search} onChange={e=>setSearch(e.target.value)} id="input-user-search"/>
            </div>
            <select className="form-select" style={{width:160}} value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} id="select-role-filter">
              <option value="all">All Roles</option>
              {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container" style={{padding:"0 24px 24px"}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Joined</th>
                {(canWrite || canDelete) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Users size={28}/></div>
                    <h3>No users found</h3>
                    <p>Try adjusting your search or filter</p>
                  </div>
                </td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="user-avatar" style={{width:34,height:34,fontSize:12}}>
                        {u.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
                      </div>
                      <div>
                        <p style={{fontWeight:600,color:"var(--color-text-primary)",fontSize:13}}>{u.name}</p>
                        <p style={{fontSize:11,color:"var(--color-text-muted)"}}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`topbar-badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                  <td>{u.department}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span className={`status-dot ${u.status}`}/>
                      <span style={{textTransform:"capitalize",fontSize:13}}>{u.status}</span>
                    </div>
                  </td>
                  <td style={{fontSize:13}}>{u.joined}</td>
                  {(canWrite || canDelete) && (
                    <td>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        {canManageRoles && (
                           <div style={{display:"flex",gap:4,marginRight:8,padding:"4px",background:"rgba(255,255,255,0.03)",borderRadius:8}}>
                              {u.role !== ROLES.MANAGER && <button className="btn btn-ghost btn-sm" style={{padding:"2px 6px",fontSize:10}} onClick={() => handleSave({...u, role: ROLES.MANAGER})} title="Make Manager">M</button>}
                              {u.role !== ROLES.CONTRIBUTOR && <button className="btn btn-ghost btn-sm" style={{padding:"2px 6px",fontSize:10}} onClick={() => handleSave({...u, role: ROLES.CONTRIBUTOR})} title="Make Contributor">C</button>}
                              {u.role !== ROLES.VIEWER && <button className="btn btn-ghost btn-sm" style={{padding:"2px 6px",fontSize:10}} onClick={() => handleSave({...u, role: ROLES.VIEWER})} title="Make Viewer">V</button>}
                           </div>
                        )}
                        {canWrite && (
                          <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => setModal(u)} id={`btn-edit-user-${u.id}`}>
                            <Edit2 size={14}/>
                          </button>
                        )}
                        {canDelete && (
                          <button className="btn btn-danger btn-icon" title="Delete" onClick={() => setDeleteTarget(u)} id={`btn-delete-user-${u.id}`}>
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <UserModal
            user={modal === "add" ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
            canManageRoles={canManageRoles}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="modal-overlay">
            <motion.div className="modal-content" style={{maxWidth:400}} initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
              <div className="modal-header">
                <h3>Delete User?</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setDeleteTarget(null)}><X size={18}/></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-error">
                  <AlertCircle size={16} style={{flexShrink:0}}/>
                  <span>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteTarget.id)} id="btn-confirm-delete">
                  <Trash2 size={14}/> Delete User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
