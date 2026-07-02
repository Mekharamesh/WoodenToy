import React, { useState, useEffect } from 'react';
import { staffAPI } from '../../api/staffService';
import { roleAPI } from '../../api/roleService';

const InputField = ({ label, error, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</p>}
  </div>
);

const inputClass = (hasError) =>
  `w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
    hasError ? 'border-red-400 focus:ring-red-200' : 'border-[#E6DFD4] focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]'
  }`;

export default function AddStaffPage({ onBack, onSuccess, editingStaff }) {
  const isEdit = !!editingStaff;

  const [form, setForm] = useState({
    fullName: '', email: '', mobile: '', password: '', role: '', status: 'active',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successStaff, setSuccessStaff] = useState(null);
  const [dynamicRoles, setDynamicRoles] = useState([]);

  useEffect(() => {
    roleAPI.getAll().then(roles => setDynamicRoles(roles)).catch(() => setDynamicRoles([]));
  }, []);

  useEffect(() => {
    if (editingStaff) {
      setForm({
        fullName: editingStaff.fullName || '',
        email: editingStaff.email || '',
        mobile: editingStaff.mobile || '',
        password: '',
        role: editingStaff.role || '',
        status: editingStaff.status || 'active',
      });
    }
  }, [editingStaff]);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!isEdit && !form.password) e.password = 'Password is required.';
    else if (form.password && form.password.length < 8) e.password = 'Password must contain at least 8 characters.';
    if (!form.role) e.role = 'Role is required.';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      let result;
      if (isEdit) {
        result = await staffAPI.update(editingStaff._id, payload);
      } else {
        result = await staffAPI.create(payload);
      }
      setSuccessStaff(result.staff);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (successStaff) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#E6DFD4] shadow-sm p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{isEdit ? 'Staff Updated!' : 'Staff Created!'}</h2>
          <p className="text-gray-500 mb-6 text-sm">
            <strong>{successStaff.fullName}</strong> ({successStaff.role}) has been {isEdit ? 'updated' : 'added'} successfully.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={onBack} className="px-5 py-2.5 border border-[#E6DFD4] rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Back to List
            </button>
            <button
              onClick={() => onSuccess(successStaff)}
              className="px-5 py-2.5 bg-[#8B5E3C] hover:bg-[#7a5234] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Edit Permissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">
          Dashboard &rsaquo; Staff Management &rsaquo; <span className="text-[#8B5E3C] font-semibold">{isEdit ? 'Edit Staff' : 'Add Staff'}</span>
        </p>
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Staff Member' : 'Add New Staff'}</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white rounded-2xl border border-[#E6DFD4] shadow-sm p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2 mb-2 pb-4 border-b border-[#F0EAE2]">
            <div className="w-8 h-8 bg-[#F8F4EC] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="font-bold text-gray-700">Basic Information</h2>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{errors.submit}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Full Name" error={errors.fullName} required>
              <input
                type="text"
                value={form.fullName}
                onChange={handleChange('fullName')}
                placeholder="e.g. Ravi Kumar"
                className={inputClass(errors.fullName)}
              />
            </InputField>
            <InputField label="Email Address" error={errors.email} required>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="e.g. ravi@woodentoys.com"
                className={inputClass(errors.email)}
              />
            </InputField>
            <InputField label="Mobile Number" error={errors.mobile}>
              <input
                type="tel"
                value={form.mobile}
                onChange={handleChange('mobile')}
                placeholder="e.g. 9876543210"
                className={inputClass(errors.mobile)}
              />
            </InputField>
            <InputField label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} error={errors.password} required={!isEdit}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Min. 8 characters"
                  className={inputClass(errors.password) + ' pr-11'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </InputField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Role Assignment" error={errors.role} required>
              <select value={form.role} onChange={handleChange('role')} className={inputClass(errors.role)}>
                <option value="">Select Role...</option>
                {dynamicRoles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
              </select>
            </InputField>
            <InputField label="Status">
              <select value={form.status} onChange={handleChange('status')} className={inputClass(false)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </InputField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onBack} className="px-6 py-2.5 border border-[#E6DFD4] rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#7a5234] disabled:opacity-60 text-white px-7 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Staff'}
          </button>
        </div>
      </form>
    </div>
  );
}
