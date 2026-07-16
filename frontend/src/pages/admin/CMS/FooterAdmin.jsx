import React, { useState, useEffect, useRef } from "react";
import { cmsService } from "../../../api/cmsService";
import { Pencil, Trash2, Plus, Eye, EyeOff, Upload, X } from "lucide-react";

// -- Logo Uploader --------------------------------------------------
function LogoUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const res = await cmsService.uploadImages([file]); onChange(res.data.urls[0]); }
    catch (err) { alert(err.message); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <label className="text-xs font-semibold text-brand-medium uppercase tracking-wider block mb-1">Footer Logo</label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="logo" className="h-12 object-contain rounded" />
            <button type="button" onClick={() => onChange("")}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current.click()}
            className="flex items-center gap-2 border border-dashed border-[#E6DFD4] rounded-lg px-4 py-2 text-sm text-brand-medium hover:bg-[#F7F3EE]">
            <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Logo"}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

// -- Empty form template --------------------------------------------
const emptyForm = {
  title: "Default Footer", status: true,
  logo: "", description: "", email: "", phone: "",
  facebook: "", instagram: "", youtube: "", twitter: "",
  copyright: "", position: "",
  mapUrl: "", mapIframe: "",
  lists: [],
};

export default function FooterAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try { const res = await cmsService.getFooters(); setItems(res.data || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  // Auto-resolve maps.app.goo.gl links in mapUrl
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.mapUrl && (form.mapUrl.includes("maps.app.goo.gl") ||
        (form.mapUrl.includes("google.com/maps") && !form.mapUrl.includes("output=embed") && !form.mapUrl.includes("/embed")))) {
        try {
          const res = await cmsService.resolveMapUrl(form.mapUrl);
          if (res.success && res.embedUrl) setForm(f => ({ ...f, mapUrl: res.embedUrl }));
        } catch (err) { console.warn("Could not auto-resolve map URL:", err); }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [form.mapUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, position: form.position === "" ? null : Number(form.position) };
      if (editId) await cmsService.updateFooter(editId, payload);
      else await cmsService.createFooter(payload);
      setShowForm(false); setForm(emptyForm); setEditId(null);
      fetchItems();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setForm({
      title: item.title || "Default Footer",
      status: item.status !== false,
      logo: item.logo || "", description: item.description || "",
      email: item.email || "", phone: item.phone || "",
      facebook: item.facebook || "", instagram: item.instagram || "",
      youtube: item.youtube || "", twitter: item.twitter || "",
      copyright: item.copyright || "",
      position: item.position != null ? item.position : "",
      mapUrl: item.mapUrl || "", mapIframe: item.mapIframe || "",
      lists: item.lists || [],
    });
    setEditId(item._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this footer?")) return;
    try { await cmsService.deleteFooter(id); fetchItems(); }
    catch (err) { alert(err.message); }
  };

  const handleToggle = async (item) => {
    try { await cmsService.updateFooter(item._id, { ...item, status: !item.status }); fetchItems(); }
    catch (err) { alert(err.message); }
  };

  // Footer List helpers
  const addList = () => setForm(f => ({ ...f, lists: [...f.lists, { title: "", links: [] }] }));
  const removeList = (i) => setForm(f => ({ ...f, lists: f.lists.filter((_, idx) => idx !== i) }));
  const updateListTitle = (i, title) => setForm(f => ({ ...f, lists: f.lists.map((l, idx) => idx === i ? { ...l, title } : l) }));
  const addLink = (li) => { const nl = [...form.lists]; nl[li].links.push({ label: "", url: "" }); setForm(f => ({ ...f, lists: nl })); };
  const removeLink = (li, lj) => { const nl = [...form.lists]; nl[li].links.splice(lj, 1); setForm(f => ({ ...f, lists: nl })); };
  const updateLink = (li, lj, field, val) => { const nl = [...form.lists]; nl[li].links[lj][field] = val; setForm(f => ({ ...f, lists: nl })); };

  const field = (label, key, placeholder = "", type = "text") => (
    <div>
      <label className="text-xs font-semibold text-brand-medium uppercase tracking-wider block mb-1">{label}</label>
      <input type={type} placeholder={placeholder} value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-[#E6DFD4] rounded-lg px-3 py-2 text-sm" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* -- Header -- */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-brand-dark">Footer Configuration</h3>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-brand-dark text-white text-sm px-4 py-2 rounded-xl hover:bg-black transition-colors">
          <Plus className="w-4 h-4" /> Add Footer
        </button>
      </div>

      {/* -- FORM -- */}
      {showForm && (
        <div className="bg-[#FDF9F1] rounded-2xl border border-[#E6DFD4] p-6 shadow-sm space-y-6">
          <h4 className="font-semibold text-brand-dark text-base">{editId ? "Edit Footer" : "New Footer"}</h4>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Branding */}
            <div className="bg-white rounded-2xl border border-[#E6DFD4] p-6 shadow-sm space-y-4">
              <h5 className="font-semibold text-brand-dark">Branding</h5>
              <LogoUploader value={form.logo} onChange={v => setForm(f => ({ ...f, logo: v }))} />
              <div>{field("Footer Name / Title", "title", "e.g. Default Footer")}</div>
              <div>
                <label className="text-xs font-semibold text-brand-medium uppercase tracking-wider block mb-1">Description</label>
                <textarea rows={3} placeholder="Brief description shown in footer..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#E6DFD4] rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>{field("Copyright Text", "copyright", "© 2026 WoodenToys. All rights reserved.")}</div>
              <div>
                <label className="text-xs font-semibold text-brand-medium uppercase tracking-wider block mb-1">Position <span className="text-[10px] font-normal">(Homepage order)</span></label>
                <input type="number" min="1" placeholder="e.g. 1, 2, 3..." value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  className="w-full border border-[#E6DFD4] rounded-lg px-3 py-2 text-sm" />
                <p className="text-[10px] text-brand-medium mt-1">Set this to control where the footer section appears on the homepage.</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-[#E6DFD4] p-6 shadow-sm space-y-4">
              <h5 className="font-semibold text-brand-dark">Contact Info</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field("Email", "email", "hello@woodentoys.com", "email")}
                {field("Phone", "phone", "+91 98765 43210")}
              </div>
            </div>

            {/* Map Configuration */}
            <div className="bg-white rounded-2xl border border-[#E6DFD4] p-6 shadow-sm space-y-4">
              <h5 className="font-semibold text-brand-dark">Map Configuration</h5>
              <p className="text-[10px] text-brand-medium">Optional: Provide either a map URL or a map iframe snippet to display a map dynamically.</p>
              <div className="space-y-3">
                {field("Map URL", "mapUrl", "https://www.google.com/maps/embed?...")}
                {form.mapUrl && form.mapUrl.includes("maps.app.goo.gl") && (
                  <p className="text-xs text-orange-500 font-medium">Auto-resolving short link...</p>
                )}
                {field("Map Iframe (HTML)", "mapIframe", '<iframe src="..."></iframe>')}
              </div>
              {(form.mapUrl || form.mapIframe) && (
                <div className="mt-2 border border-[#E6DFD4] rounded-lg p-2 bg-gray-50">
                  <label className="text-xs font-semibold text-brand-medium uppercase tracking-wider block mb-2">Live Preview</label>
                  <div className="w-full overflow-hidden rounded border border-gray-200">
                    {form.mapIframe ? (
                      <div className="w-full h-[250px] [&>iframe]:w-full [&>iframe]:h-full pointer-events-none" dangerouslySetInnerHTML={{ __html: form.mapIframe }} />
                    ) : (
                      <iframe src={form.mapUrl} className="w-full h-[250px] pointer-events-none" style={{ border: 0 }} />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Menu Lists */}
            <div className="bg-white rounded-2xl border border-[#E6DFD4] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-semibold text-brand-dark">Footer Menu Links</h5>
                  <p className="text-[10px] text-brand-medium">Add dynamic lists (e.g. Shop, Support, Policies) with links.</p>
                </div>
                <button type="button" onClick={addList}
                  className="flex items-center gap-1 bg-[#8B5E3C] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#7A5234] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add List
                </button>
              </div>
              <div className="space-y-5">
                {form.lists.map((list, i) => (
                  <div key={i} className="border border-[#E6DFD4] rounded-xl p-4 bg-[#FDF9F1] space-y-3">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-brand-medium uppercase tracking-wider block mb-1">List Title</label>
                        <input type="text" value={list.title} onChange={e => updateListTitle(i, e.target.value)}
                          placeholder="e.g. Shop, Policies..." className="w-full border border-[#E6DFD4] rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <button type="button" onClick={() => removeList(i)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-[#E9DED3]">
                      {list.links.map((link, j) => (
                        <div key={j} className="flex gap-2 items-center">
                          <input type="text" value={link.label} onChange={e => updateLink(i, j, "label", e.target.value)}
                            placeholder="Link Label" className="flex-1 border border-[#E6DFD4] rounded-lg px-3 py-1.5 text-sm" />
                          <input type="text" value={link.url} onChange={e => updateLink(i, j, "url", e.target.value)}
                            placeholder="URL (e.g. /shop)" className="flex-1 border border-[#E6DFD4] rounded-lg px-3 py-1.5 text-sm" />
                          <button type="button" onClick={() => removeLink(i, j)} className="text-red-400 hover:text-red-600 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addLink(i)}
                        className="flex items-center gap-1 text-[#8B5E3C] text-xs font-medium hover:underline mt-1">
                        <Plus className="w-3 h-3" /> Add Link
                      </button>
                    </div>
                  </div>
                ))}
                {form.lists.length === 0 && (
                  <div className="text-center py-6 text-brand-medium text-sm border-2 border-dashed border-[#E6DFD4] rounded-xl">
                    No lists added yet.
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white rounded-2xl border border-[#E6DFD4] p-6 shadow-sm space-y-4">
              <h5 className="font-semibold text-brand-dark">Social Media Links</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field("Facebook URL", "facebook", "https://facebook.com/")}
                {field("Instagram URL", "instagram", "https://instagram.com/")}
                {field("YouTube URL", "youtube", "https://youtube.com/")}
                {field("Twitter / X URL", "twitter", "https://twitter.com/")}
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="footer-status" checked={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.checked }))} />
              <label htmlFor="footer-status" className="text-sm text-brand-dark">Active (visible on site)</label>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-[#E6DFD4]">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-[#E6DFD4] rounded-lg text-brand-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-6 py-2 text-sm bg-brand-dark text-white rounded-lg hover:bg-black disabled:opacity-50">
                {saving ? "Saving..." : "Save Footer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -- LIST VIEW -- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : items.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-brand-medium text-sm bg-white rounded-2xl border border-[#E6DFD4]">
            No footers yet. Add your first footer configuration!
          </div>
        ) : items.map((item) => (
          <div key={item._id} className="bg-white rounded-2xl border border-[#E6DFD4] overflow-hidden shadow-sm">
            {/* Logo Preview */}
            <div className="w-full h-24 bg-[#F7F3EE] flex items-center justify-center px-4">
              {item.logo ? (
                <img src={item.logo} alt="logo" className="h-14 object-contain" />
              ) : (
                <span className="text-brand-medium text-xs">No Logo</span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-brand-dark text-sm">{item.title || "Default Footer"}</h4>
                  {item.description && <p className="text-xs text-brand-medium mt-0.5 line-clamp-2">{item.description}</p>}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {item.status ? "Active" : "Disabled"}
                  </span>
                  {item.position != null && item.position !== "" && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                      Pos: {item.position}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-brand-medium space-y-0.5">
                {item.email && <p>? {item.email}</p>}
                {item.phone && <p>?? {item.phone}</p>}
                {item.lists && item.lists.length > 0 && <p>?? {item.lists.length} link list(s)</p>}
                {(item.mapUrl || item.mapIframe) && <p>?? Map configured</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => handleToggle(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-[#E6DFD4] rounded-lg text-xs text-brand-medium hover:bg-[#F7F3EE] transition-colors">
                  {item.status ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {item.status ? "Disable" : "Enable"}
                </button>
                <button onClick={() => handleEdit(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-[#E6DFD4] rounded-lg text-xs text-brand-medium hover:bg-[#F7F3EE] transition-colors">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(item._id)}
                  className="p-1.5 border border-red-100 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
