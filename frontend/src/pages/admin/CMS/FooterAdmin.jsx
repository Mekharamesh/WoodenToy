import React, { useState, useEffect, useRef } from 'react';
import { cmsService } from '../../../api/cmsService';
import { Upload, X } from 'lucide-react';

function LogoUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await cmsService.uploadImages([file]);
      onChange(res.data.urls[0]);
    } catch (err) { alert(err.message); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="text-xs font-semibold text-brand-medium uppercase tracking-wider block mb-1">Footer Logo</label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="logo" className="h-12 object-contain rounded" />
            <button type="button" onClick={() => onChange('')}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current.click()}
            className="flex items-center gap-2 border border-dashed border-[#E6DFD4] rounded-lg px-4 py-2 text-sm text-brand-medium hover:bg-[#F7F3EE]">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Logo'}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

export default function FooterAdmin() {
  const [form, setForm] = useState({
    logo: '', description: '', email: '', phone: '',
    facebook: '', instagram: '', youtube: '', twitter: '', copyright: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cmsService.getFooter().then(res => {
      if (res.data) setForm({ logo: res.data.logo || '', description: res.data.description || '', email: res.data.email || '', phone: res.data.phone || '', facebook: res.data.facebook || '', instagram: res.data.instagram || '', youtube: res.data.youtube || '', twitter: res.data.twitter || '', copyright: res.data.copyright || '' });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await cmsService.updateFooter(form); alert('Footer saved!'); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const field = (label, key, placeholder = '', type = 'text') => (
    <div>
      <label className="text-xs font-semibold text-brand-medium uppercase tracking-wider block mb-1">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder} className="w-full border border-[#E6DFD4] rounded-lg px-3 py-2 text-sm" />
    </div>
  );

  if (loading) return <div className="p-8 text-center text-brand-medium text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-brand-dark">Footer Configuration</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#E6DFD4] p-6 shadow-sm space-y-4">
          <h4 className="font-semibold text-brand-dark">Branding</h4>
          <LogoUploader value={form.logo} onChange={(v) => setForm(f => ({ ...f, logo: v }))} />
          <div>
            <label className="text-xs font-semibold text-brand-medium uppercase tracking-wider block mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of your brand..." className="w-full border border-[#E6DFD4] rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          {field('Copyright Text', 'copyright', '© 2025 WoodenToys. All rights reserved.')}
        </div>

        <div className="bg-white rounded-2xl border border-[#E6DFD4] p-6 shadow-sm space-y-4">
          <h4 className="font-semibold text-brand-dark">Contact Info</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Email', 'email', 'hello@woodentoys.com', 'email')}
            {field('Phone', 'phone', '+91 98765 43210')}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6DFD4] p-6 shadow-sm space-y-4">
          <h4 className="font-semibold text-brand-dark">Social Media Links</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Facebook URL', 'facebook', 'https://facebook.com/')}
            {field('Instagram URL', 'instagram', 'https://instagram.com/')}
            {field('YouTube URL', 'youtube', 'https://youtube.com/')}
            {field('Twitter / X URL', 'twitter', 'https://twitter.com/')}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="px-8 py-3 bg-brand-dark text-white text-sm font-semibold rounded-xl hover:bg-black disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Footer Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
