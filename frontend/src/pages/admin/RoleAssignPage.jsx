import React, { useState, useEffect, useCallback } from 'react';
import { staffAPI } from '../../api/staffService';

const PERMISSION_MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'staff_management', label: 'Staff Management', icon: '👥' },
  { key: 'users', label: 'Users', icon: '👤' },
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'categories', label: 'Categories', icon: '🗂️' },
  { key: 'brands', label: 'Brands', icon: '🏷️' },
  { key: 'orders', label: 'Orders', icon: '🛒' },
  { key: 'inventory', label: 'Inventory', icon: '🏭' },
  { key: 'coupons', label: 'Coupons', icon: '🎟️' },
  { key: 'reviews', label: 'Reviews', icon: '⭐' },
  { key: 'customers', label: 'Customers', icon: '🤝' },
  { key: 'reports', label: 'Reports', icon: '📈' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

const ACTIONS = ['view', 'create', 'edit', 'delete'];

const initPerms = () =>
  PERMISSION_MODULES.reduce((acc, mod) => {
    acc[mod.key] = { view: false, create: false, edit: false, delete: false };
    return acc;
  }, {});

const permsToMap = (permissionsArr) => {
  const map = initPerms();
  (permissionsArr || []).forEach(p => {
    if (map[p.module] !== undefined) {
      map[p.module] = { view: !!p.view, create: !!p.create, edit: !!p.edit, delete: !!p.delete };
    }
  });
  return map;
};

const mapToPerms = (map) =>
  Object.entries(map).map(([module, actions]) => ({ module, ...actions }));

export default function RoleAssignPage({ onBack, targetStaff }) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(targetStaff || null);
  const [permissions, setPermissions] = useState(initPerms());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [roleName, setRoleName] = useState('');

  const fetchStaffList = useCallback(async () => {
    try {
      const data = await staffAPI.getAll({ limit: 100 });
      setStaffList(data.staff || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchStaffList(); }, [fetchStaffList]);

  useEffect(() => {
    if (selectedStaff) {
      setLoading(true);
      staffAPI.getById(selectedStaff._id)
        .then(data => {
          setPermissions(permsToMap(data.staff?.permissions || []));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedStaff]);

  const toggle = (moduleKey, action) => {
    setPermissions(prev => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [action]: !prev[moduleKey][action] },
    }));
    setSaved(false);
  };

  const toggleRow = (moduleKey) => {
    const current = permissions[moduleKey];
    const allOn = ACTIONS.every(a => current[a]);
    setPermissions(prev => ({
      ...prev,
      [moduleKey]: { view: !allOn, create: !allOn, edit: !allOn, delete: !allOn },
    }));
    setSaved(false);
  };

  const toggleColumn = (action) => {
    const allOn = PERMISSION_MODULES.every(m => permissions[m.key][action]);
    setPermissions(prev => {
      const next = { ...prev };
      PERMISSION_MODULES.forEach(m => { next[m.key] = { ...next[m.key], [action]: !allOn }; });
      return next;
    });
    setSaved(false);
  };

  const selectAll = () => {
    const map = {};
    PERMISSION_MODULES.forEach(m => { map[m.key] = { view: true, create: true, edit: true, delete: true }; });
    setPermissions(map);
    setSaved(false);
  };

  const clearAll = () => { setPermissions(initPerms()); setSaved(false); };

  const handleSave = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    try {
      await staffAPI.updatePermissions(selectedStaff._id, mapToPerms(permissions));
      setSaved(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">Dashboard &rsaquo; Staff Management &rsaquo; <span className="text-[#8B5E3C] font-semibold">Role Assign</span></p>
          <h1 className="text-2xl font-bold text-gray-800">Role Assign & Permissions</h1>
        </div>
        <button onClick={onBack} className="px-4 py-2 border border-[#E6DFD4] rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          ← Back to List
        </button>
      </div>

      {/* Create Role Card */}
      <div className="bg-white rounded-2xl border border-[#E6DFD4] shadow-sm p-5 mb-5">
        <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-[#F8F4EC] rounded-lg flex items-center justify-center text-[#8B5E3C] text-sm">+</span>
          Create Role Template
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={roleName}
            onChange={e => setRoleName(e.target.value)}
            placeholder="Enter Role Name (e.g. Senior Manager)"
            className="flex-1 px-4 py-2.5 text-sm border border-[#E6DFD4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30"
          />
          <button
            onClick={() => { if (roleName.trim()) alert(`Role "${roleName.trim()}" template noted! Assign permissions below.`); }}
            className="px-5 py-2.5 bg-[#8B5E3C] hover:bg-[#7a5234] text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Create Role
          </button>
        </div>
      </div>

      {/* Staff Selector */}
      <div className="bg-white rounded-2xl border border-[#E6DFD4] shadow-sm p-5 mb-5">
        <label className="block text-sm font-bold text-gray-700 mb-2">Select Staff Member to Assign Permissions</label>
        <select
          value={selectedStaff?._id || ''}
          onChange={e => {
            const found = staffList.find(s => s._id === e.target.value);
            setSelectedStaff(found || null);
            setSaved(false);
          }}
          className="w-full md:w-96 px-4 py-2.5 text-sm border border-[#E6DFD4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 bg-white"
        >
          <option value="">-- Select Staff --</option>
          {staffList.map(s => <option key={s._id} value={s._id}>{s.fullName} ({s.role})</option>)}
        </select>
      </div>

      {/* Permission Matrix */}
      {selectedStaff && (
        <div className="bg-white rounded-2xl border border-[#E6DFD4] shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EAE2] bg-[#FAFAFA]">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center font-bold text-sm">
                {selectedStaff.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{selectedStaff.fullName}</p>
                <p className="text-xs text-gray-500">{selectedStaff.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={selectAll} className="px-3 py-1.5 text-xs font-semibold border border-[#E6DFD4] rounded-lg hover:bg-[#F8F4EC] text-gray-600 transition-colors">Select All</button>
              <button onClick={clearAll} className="px-3 py-1.5 text-xs font-semibold border border-[#E6DFD4] rounded-lg hover:bg-[#F8F4EC] text-gray-600 transition-colors">Clear All</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading permissions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F8F4EC]">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-48">Module</th>
                    {ACTIONS.map(action => (
                      <th key={action} className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                        <button onClick={() => toggleColumn(action)} className="hover:text-[#8B5E3C] transition-colors capitalize">{action}</button>
                      </th>
                    ))}
                    <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-gray-500">All</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MODULES.map((mod, idx) => {
                    const perm = permissions[mod.key] || {};
                    const allOn = ACTIONS.every(a => perm[a]);
                    return (
                      <tr key={mod.key} className={`border-b border-[#F0EAE2] hover:bg-[#FDF9F5] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                        <td className="px-5 py-3.5 font-semibold text-gray-700">
                          <span className="mr-2">{mod.icon}</span>{mod.label}
                        </td>
                        {ACTIONS.map(action => (
                          <td key={action} className="px-5 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={!!perm[action]}
                              onChange={() => toggle(mod.key, action)}
                              className="w-4 h-4 accent-[#8B5E3C] rounded cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="px-5 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={allOn}
                            onChange={() => toggleRow(mod.key)}
                            className="w-4 h-4 accent-[#8B5E3C] rounded cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Save */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#E6DFD4] bg-[#FAFAFA]">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Permissions saved successfully!
              </span>
            )}
            {!saved && <span />}
            <div className="flex gap-3">
              <button onClick={onBack} className="px-5 py-2.5 border border-[#E6DFD4] rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#7a5234] disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
