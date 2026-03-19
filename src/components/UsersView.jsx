import { useState, useEffect, useCallback } from "react";
import {
  Users, UserPlus, Building2, Shield, ChevronDown,
  Trash2, Briefcase, UserCheck, Edit3, X, Check,
  AlertTriangle, Zap, Copy, Eye, EyeOff, Search,
  RefreshCw, UserMinus, ClipboardList,
} from "lucide-react";
import { teamApi, PLAN_LIMITS } from "../services/crmApi";

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  OWNER:     { label: "Owner",             color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20" },
  ADMIN:     { label: "Admin",             color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20" },
  MANAGER:   { label: "Manager",           color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
  TEAM_LEAD: { label: "Team Lead",         color: "text-cyan-600 dark:text-cyan-400",     bg: "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20" },
  SALES_REP: { label: "Sales Rep",         color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
  MEMBER:    { label: "Member",            color: "text-slate-600 dark:text-slate-400",   bg: "bg-slate-100 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700" },
};

const ASSIGNABLE_ROLES = [
  { value: "ADMIN",     label: "Admin",     desc: "Full access — manage team & settings" },
  { value: "MANAGER",   label: "Manager",   desc: "View all businesses, assign to reps" },
  { value: "TEAM_LEAD", label: "Team Lead", desc: "View all businesses, manage their reps" },
  { value: "SALES_REP", label: "Sales Rep", desc: "Access only assigned businesses" },
];

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.MEMBER;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = "md" }) {
  const letter = (name || "?")[0].toUpperCase();
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-extrabold flex-shrink-0 shadow-sm`}>
      {letter}
    </div>
  );
}

// ─── Assign businesses modal ──────────────────────────────────────────────────
function AssignModal({ member, businesses, onClose, onSaved, dark }) {
  const [assigned, setAssigned]   = useState(new Set());
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");
  const [error, setError]         = useState("");

  useEffect(() => {
    teamApi.getMemberAssignments(member.id)
      .then(data => {
        setAssigned(new Set(data.map(a => a.bizId)));
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [member.id]);

  const toggle = (bizId) => {
    setAssigned(prev => {
      const next = new Set(prev);
      next.has(bizId) ? next.delete(bizId) : next.add(bizId);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await teamApi.setMemberAssignments(member.id, Array.from(assigned));
      onSaved(member.id, assigned.size);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const filtered = businesses.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${dark ? "bg-slate-900 border border-slate-700/60" : "bg-white border border-slate-200"}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? "border-slate-700/60" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <Avatar name={member.user?.name} size="sm" />
            <div>
              <p className={`text-sm font-bold ${dark ? "text-white" : "text-slate-800"}`}>
                Assign Businesses — {member.user?.name}
              </p>
              <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                <RoleBadge role={member.role} />
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className={`px-5 py-3 border-b ${dark ? "border-slate-700/60" : "border-slate-100"}`}>
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${dark ? "bg-slate-800 border-slate-600" : "bg-slate-50 border-slate-200"}`}>
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search businesses…"
              className={`flex-1 text-xs bg-transparent outline-none placeholder-slate-400 ${dark ? "text-slate-200" : "text-slate-700"}`}
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto px-3 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <RefreshCw size={16} className="text-slate-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No businesses found</p>
          ) : filtered.map(biz => (
            <label key={biz.id} className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${dark ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${assigned.has(biz.id) ? "bg-indigo-500 border-indigo-500" : (dark ? "border-slate-500" : "border-slate-300")}`}>
                {assigned.has(biz.id) && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              <input type="checkbox" className="hidden" checked={assigned.has(biz.id)} onChange={() => toggle(biz.id)} />
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${dark ? "text-slate-200" : "text-slate-700"}`}>{biz.name}</p>
                {biz.category && <p className="text-[11px] text-slate-400 truncate">{biz.category}</p>}
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between gap-3 px-5 py-4 border-t ${dark ? "border-slate-700/60" : "border-slate-100"}`}>
          <span className="text-xs text-slate-400">{assigned.size} selected</span>
          {error && <p className="text-xs text-red-500 truncate">{error}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="text-xs px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {saving && <RefreshCw size={11} className="animate-spin" />}
              Save assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invite member form ───────────────────────────────────────────────────────
function InviteForm({ onSuccess, onCancel, dark }) {
  const [form, setForm]         = useState({ email: "", name: "", role: "SALES_REP", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name) { setError("Email and name are required."); return; }
    setLoading(true);
    setError("");
    try {
      const data = await teamApi.inviteMember(form);
      setResult(data);
      onSuccess(data.member);
    } catch (err) {
      setError(err.message || "Failed to add member");
      setLoading(false);
    }
  };

  const inp = `text-xs rounded-lg border px-3 py-2 w-full outline-none transition-colors ${dark
    ? "bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-indigo-500"
    : "bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"}`;

  if (result) {
    return (
      <div className={`rounded-xl border p-5 ${dark ? "bg-slate-800/50 border-slate-700" : "bg-emerald-50 border-emerald-200"}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Member added!</p>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
          <span className="font-semibold">{result.member?.user?.name}</span> ({result.member?.user?.email}) was added as <RoleBadge role={result.member?.role} />.
        </p>
        {result.tempPassword && (
          <div className={`flex items-center gap-2 mt-3 rounded-lg px-3 py-2 ${dark ? "bg-slate-700" : "bg-white border border-emerald-200"}`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Temp password:</p>
            <code className="flex-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{result.tempPassword}</code>
            <button
              className="text-slate-400 hover:text-indigo-500 transition-colors"
              onClick={() => navigator.clipboard?.writeText(result.tempPassword)}
              title="Copy password"
            >
              <Copy size={13} />
            </button>
          </div>
        )}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Share these credentials with the employee so they can log in.</p>
        <button
          onClick={onCancel}
          className="mt-3 text-xs px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`rounded-xl border p-5 space-y-3 ${dark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
      <p className={`text-sm font-bold mb-1 ${dark ? "text-white" : "text-slate-800"}`}>Add Team Member</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Jane Smith"
            className={inp}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="jane@company.com"
            className={inp}
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Role</label>
        <select
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          className={inp}
        >
          {ASSIGNABLE_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Temporary Password <span className="font-normal text-slate-400">(auto-generated if blank)</span>
        </label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Leave blank for auto-generated"
            className={inp + " pr-9"}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800/40">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 text-xs py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {loading ? <RefreshCw size={11} className="animate-spin" /> : <UserPlus size={12} />}
          Add Member
        </button>
        <button type="button" onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────
function MemberCard({ member, isSelf, canManage, businesses, onRoleChange, onRemove, onAssign, dark }) {
  const [roleOpen, setRoleOpen]   = useState(false);
  const [removing, setRemoving]   = useState(false);
  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.MEMBER;

  const handleRemove = async () => {
    if (!window.confirm(`Remove ${member.user?.name} from the organization?`)) return;
    setRemoving(true);
    try { await onRemove(member.userId); }
    catch (err) { alert(err.message); setRemoving(false); }
  };

  const handleRoleSelect = async (role) => {
    setRoleOpen(false);
    if (role === member.role) return;
    try { await onRoleChange(member.userId, role); }
    catch (err) { alert(err.message); }
  };

  const isOwner = member.role === "OWNER";

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${dark ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
      <Avatar name={member.user?.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold truncate ${dark ? "text-slate-100" : "text-slate-800"}`}>
            {member.user?.name || "—"}
          </p>
          {isSelf && <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">You</span>}
          <RoleBadge role={member.role} />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{member.user?.email}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[11px] text-slate-400">
            <ClipboardList size={10} className="inline mr-0.5" />
            {member._count?.assignments ?? 0} assigned
          </span>
          {member.user?.lastLoginAt && (
            <span className="text-[11px] text-slate-400">
              Last seen {new Date(member.user.lastLoginAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {canManage && !isOwner && !isSelf && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Assign businesses — only for lower roles */}
          {["SALES_REP", "MEMBER"].includes(member.role) && (
            <button
              onClick={() => onAssign(member)}
              title="Assign businesses"
              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors ${dark ? "border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-indigo-400" : "border-slate-200 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"}`}
            >
              <Briefcase size={12} />
            </button>
          )}

          {/* Change role */}
          <div className="relative">
            <button
              onClick={() => setRoleOpen(v => !v)}
              title="Change role"
              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors ${dark ? "border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-blue-400" : "border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"}`}
            >
              <Edit3 size={12} />
            </button>
            {roleOpen && (
              <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-xl z-10 py-1 ${dark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
                {ASSIGNABLE_ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => handleRoleSelect(r.value)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${dark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-700"} ${member.role === r.value ? "font-bold" : ""}`}
                  >
                    {r.label}
                    <span className={`block text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{r.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Remove */}
          <button
            onClick={handleRemove}
            disabled={removing}
            title="Remove member"
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors ${dark ? "border-slate-600 text-slate-400 hover:bg-red-950/30 hover:text-red-400 hover:border-red-800/40" : "border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200"} disabled:opacity-30`}
          >
            {removing ? <RefreshCw size={11} className="animate-spin" /> : <UserMinus size={12} />}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UsersView({ dark, user, org, planTier }) {
  const [members, setMembers]       = useState([]);
  const [loaded, setLoaded]         = useState(false);
  const [error, setError]           = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [assignModal, setAssignModal] = useState(null); // OrgMember object
  const [businesses, setBusinesses] = useState([]);

  const canManage  = ["OWNER", "ADMIN"].includes(user?.role ?? "");
  const limits     = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.BASIC;
  const canAddMore = limits.maxTeamMembers > 1;

  // Load members
  const loadMembers = useCallback(() => {
    setLoaded(false);
    setError("");
    teamApi.listMembers()
      .then(data => { setMembers(data); setLoaded(true); })
      .catch(err => { setError(err.message); setLoaded(true); });
  }, []);

  // Load org's businesses (for assignment modal)
  const loadBusinesses = useCallback(() => {
    import("../services/crmApi").then(({ businessApi }) => {
      businessApi.list({ perPage: 500 })
        .then(data => setBusinesses(data?.businesses ?? []))
        .catch(() => {});
    });
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { if (assignModal) loadBusinesses(); }, [assignModal, loadBusinesses]);

  const handleInviteSuccess = (member) => {
    setMembers(prev => [...prev, member]);
    setShowInvite(false);
  };

  const handleRoleChange = async (userId, role) => {
    const updated = await teamApi.updateRole(userId, role);
    setMembers(prev => prev.map(m => m.userId === userId ? updated : m));
  };

  const handleRemove = async (userId) => {
    await teamApi.removeMember(userId);
    setMembers(prev => prev.filter(m => m.userId !== userId));
  };

  const handleAssignmentSaved = (memberId, count) => {
    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, _count: { ...m._count, assignments: count } } : m,
    ));
  };

  // ── Plan upgrade gate ───────────────────────────────────────────────────────
  const PlanGate = () => (
    <div className={`rounded-2xl border-2 border-dashed p-8 text-center ${dark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}>
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
        <Users size={22} className="text-white" />
      </div>
      <h3 className={`text-base font-bold mb-2 ${dark ? "text-white" : "text-slate-800"}`}>Team Management</h3>
      <p className={`text-sm mb-1 max-w-sm mx-auto ${dark ? "text-slate-400" : "text-slate-500"}`}>
        Add employees to your organization, assign roles, and control which businesses each rep can access.
      </p>
      <p className={`text-xs mb-5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
        Available on <strong>FREELANCER</strong> (3 members) and <strong>AGENCY</strong> (25 members) plans.
      </p>
      <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
        <Zap size={14} className="fill-white" />
        Upgrade Plan
      </button>
    </div>
  );

  const sectionCls = `text-[10px] font-bold uppercase tracking-widest mb-3 ${dark ? "text-slate-500" : "text-slate-400"}`;
  const cardCls    = `rounded-2xl border p-5 mb-6 ${dark ? "bg-slate-900 border-slate-700/60" : "bg-white border-slate-200"}`;

  // ── Org info card ────────────────────────────────────────────────────────────
  const OrgCard = () => (
    <div className={cardCls}>
      <p className={sectionCls}>Organization</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
          <Building2 size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className={`text-base font-bold truncate ${dark ? "text-white" : "text-slate-800"}`}>{org?.name ?? "Your Organization"}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
            <span className={`font-semibold ${limits.maxTeamMembers <= 1 ? "text-red-500" : "text-indigo-500"}`}>{planTier}</span> plan ·{" "}
            {limits.maxTeamMembers > 1
              ? `${limits.maxTeamMembers} seat${limits.maxTeamMembers !== 1 ? "s" : ""} total`
              : "1 seat (upgrade to add team)"}
          </p>
        </div>
        {limits.maxTeamMembers > 1 && members.length > 0 && (
          <div className={`ml-auto flex-shrink-0 text-right ${dark ? "text-slate-400" : "text-slate-500"}`}>
            <p className="text-xl font-bold text-indigo-500">{members.length}</p>
            <p className="text-[11px]">of {limits.maxTeamMembers}</p>
          </div>
        )}
      </div>

      {/* Seat progress bar */}
      {limits.maxTeamMembers > 1 && (
        <div className="mt-4">
          <div className={`h-1.5 rounded-full overflow-hidden ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (members.length / limits.maxTeamMembers) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {limits.maxTeamMembers - members.length} seat{limits.maxTeamMembers - members.length !== 1 ? "s" : ""} remaining
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-0">

      <OrgCard />

      {/* Plan gate — show upgrade CTA if on BASIC */}
      {!canAddMore ? (
        <div className={cardCls}>
          <PlanGate />
        </div>
      ) : (
        <div className={cardCls}>
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={sectionCls}>Team Members</p>
              <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
                Roles control scope of access. Sales Reps only see assigned businesses.
              </p>
            </div>
            {canManage && !showInvite && members.length < limits.maxTeamMembers && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-sm shadow-indigo-500/20"
              >
                <UserPlus size={12} />
                Add Member
              </button>
            )}
          </div>

          {/* Role legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {ASSIGNABLE_ROLES.map(r => (
              <div key={r.value} className="flex items-center gap-1.5">
                <RoleBadge role={r.value} />
                <span className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{r.desc}</span>
              </div>
            ))}
          </div>

          {/* Invite form */}
          {showInvite && (
            <div className="mb-4">
              <InviteForm
                onSuccess={handleInviteSuccess}
                onCancel={() => setShowInvite(false)}
                dark={dark}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800/40 mb-4">
              <AlertTriangle size={12} /> {error}
              <button onClick={loadMembers} className="ml-auto text-red-400 hover:text-red-600"><RefreshCw size={11} /></button>
            </div>
          )}

          {/* Members list */}
          {!loaded ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={18} className="text-slate-300 dark:text-slate-600 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users size={28} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
              <p className={`text-sm font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>No team members yet</p>
              {canManage && (
                <p className="text-xs text-slate-400 mt-1">Click Add Member to invite your first employee.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <MemberCard
                  key={m.id}
                  member={m}
                  isSelf={m.userId === user?.id}
                  canManage={canManage}
                  businesses={businesses}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                  onAssign={setAssignModal}
                  dark={dark}
                />
              ))}
            </div>
          )}

          {/* Limit reached notice */}
          {canManage && members.length >= limits.maxTeamMembers && (
            <div className={`flex items-center gap-2 mt-4 rounded-lg px-3 py-2 text-xs border ${dark ? "bg-amber-950/20 border-amber-800/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
              <AlertTriangle size={12} />
              Member limit reached ({limits.maxTeamMembers}). Upgrade to add more.
            </div>
          )}
        </div>
      )}

      {/* Assignment modal */}
      {assignModal && (
        <AssignModal
          member={assignModal}
          businesses={businesses}
          onClose={() => setAssignModal(null)}
          onSaved={handleAssignmentSaved}
          dark={dark}
        />
      )}
    </div>
  );
}
