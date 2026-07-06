import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Download, Plus, Search, ChevronDown, Check, X, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { adminService } from '../../../api/adminService';

export default function CancellationManagementPage() {
  const [activeTab, setActiveTab] = useState('COD');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    orderStatus: 'Order Placed',
    cancellationFee: '',
    timeLimit: '',
    isAllowed: true
  });

  const fetchRules = async () => {
    try {
      const data = await adminService.getCancellationRules();
      if (Array.isArray(data)) {
        setRules(data);
      } else {
        setRules([]);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load cancellation rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSeed = async () => {
    try {
      await adminService.seedCancellationRules();
      toast.success('Rules seeded');
      fetchRules();
    } catch (e) {
      toast.error(e.message || 'Failed to seed rules');
    }
  };

  const handleSaveRule = async () => {
    try {
      const payload = {
        paymentMethod: activeTab,
        orderStatus: formData.orderStatus,
        cancellationFee: Number(formData.cancellationFee) || 0,
        timeLimit: formData.timeLimit ? (formData.timeLimit.toString().includes('Days') || formData.timeLimit.toString().includes('Hours') || formData.timeLimit === '-' || formData.timeLimit === 'Before Delivery' ? formData.timeLimit : `${formData.timeLimit} Days`) : '-',
        isAllowed: formData.isAllowed,
        refundPercentage: 100
      };
      
      if (editingId) {
        await adminService.updateCancellationRule(editingId, payload);
        toast.success('Rule updated successfully');
      } else {
        await adminService.createCancellationRule(payload);
        toast.success('Rule added successfully');
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ orderStatus: 'Order Placed', cancellationFee: '', timeLimit: '', isAllowed: true });
      fetchRules();
    } catch (e) {
      toast.error(e.message || 'Failed to save rule');
    }
  };

  const handleEditRule = (rule) => {
    setFormData({
      orderStatus: rule.orderStatus,
      cancellationFee: rule.cancellationFee,
      timeLimit: rule.timeLimit ? rule.timeLimit.replace(' Days', '') : '',
      isAllowed: rule.isAllowed
    });
    setEditingId(rule._id);
    setIsModalOpen(true);
  };

  const handleDeleteRule = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await adminService.deleteCancellationRule(id);
        toast.success('Rule deleted successfully');
        fetchRules();
      } catch (e) {
        toast.error(e.message || 'Failed to delete rule');
      }
    }
  };

  const filteredRules = rules.filter(r => r.paymentMethod === activeTab);

  const totalRules = filteredRules.length;
  const allowedRules = filteredRules.filter(r => r.isAllowed).length;
  const restrictedRules = filteredRules.filter(r => !r.isAllowed).length;

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-10">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#141225] font-serif">Cancellation Management</h1>
          <p className="text-[#6D625C] mt-2">Configure cancellation rules, fees and refund policies for COD and Online orders.</p>
        </div>

        {/* Tabs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[#E9DED3]">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('COD')}
              className={`pb-4 text-sm font-bold transition-colors relative ${
                activeTab === 'COD' ? 'text-[#9A6031]' : 'text-[#6D625C] hover:text-[#9A6031]'
              }`}
            >
              COD Cancellation
              {activeTab === 'COD' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9A6031]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('Online')}
              className={`pb-4 text-sm font-bold transition-colors relative ${
                activeTab === 'Online' ? 'text-[#9A6031]' : 'text-[#6D625C] hover:text-[#9A6031]'
              }`}
            >
              Online (Cashfree) Cancellation
              {activeTab === 'Online' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9A6031]" />
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-3 pb-4">
            <button onClick={handleSeed} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E9DED3] text-[#6D625C] rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm">
              <Download size={16} />
              Export
            </button>
            <button 
              onClick={() => {
                setEditingId(null);
                setFormData({ orderStatus: 'Order Placed', cancellationFee: '', timeLimit: '', isAllowed: true });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#9A6031] text-white rounded-lg text-sm font-bold hover:bg-[#7E4B25] shadow-sm"
            >
              <Plus size={16} />
              Add Rule
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-[14px] border border-[#E9DED3] p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Check size={20} />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-[#6D625C]">Total Rules</h3>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#141225]">{(totalRules || 0).toString().padStart(2, '0')}</span>
                  </div>
                  <p className="text-xs text-[#8A817C] mt-1">Active cancellation rules</p>
                </div>
              </div>

              <div className="bg-white rounded-[14px] border border-[#E9DED3] p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <Check size={20} />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-[#6D625C]">Cancellation Allowed</h3>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#141225]">{(allowedRules || 0).toString().padStart(2, '0')}</span>
                  </div>
                  <p className="text-xs text-[#8A817C] mt-1">Active rules allowing cancellation</p>
                </div>
              </div>

              <div className="bg-white rounded-[14px] border border-[#E9DED3] p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <AlertCircle size={20} />
                  </div>
                  <div className="text-right">
                    <h3 className="text-xs text-[#6D625C] font-semibold">Last Updated</h3>
                    <p className="text-sm font-bold text-[#141225] mt-1">May 04, 2025</p>
                    <p className="text-[10px] text-[#8A817C]">By elan Admin</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-[#6D625C]">Cancellation Restricted</h3>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#141225]">{(restrictedRules || 0).toString().padStart(2, '0')}</span>
                  </div>
                  <p className="text-xs text-[#8A817C] mt-1">Rules with restrictions</p>
                </div>
              </div>
            </div>

            {/* Rules Table */}
            <div className="bg-white border border-[#E9DED3] rounded-[14px] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E9DED3]">
                <h2 className="text-lg font-bold text-[#141225]">Cancellation Rules ({activeTab})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E9DED3]">
                      <th className="px-6 py-3 text-xs font-bold text-[#6D625C] uppercase tracking-wider">Order Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-[#6D625C] uppercase tracking-wider text-center">Cancellation Fee (₹)</th>
                      <th className="px-6 py-3 text-xs font-bold text-[#6D625C] uppercase tracking-wider text-center">Refund %</th>
                      <th className="px-6 py-3 text-xs font-bold text-[#6D625C] uppercase tracking-wider">Time Limit</th>
                      <th className="px-6 py-3 text-xs font-bold text-[#6D625C] uppercase tracking-wider text-center">Allowed</th>
                      <th className="px-6 py-3 text-xs font-bold text-[#6D625C] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-[#6D625C] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9DED3]">
                    {filteredRules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#141225]">{rule.orderStatus}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-[#141225]">{rule.cancellationFee > 0 ? rule.cancellationFee : '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-[#141225]">{rule.refundPercentage > 0 ? `${rule.refundPercentage}%` : '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-[#141225]">{rule.timeLimit}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-bold ${rule.isAllowed ? 'text-emerald-600' : 'text-red-600'}`}>
                            {rule.isAllowed ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                            rule.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                            rule.status === 'Disabled' ? 'bg-red-100 text-red-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {rule.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {rule.status !== 'Locked' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEditRule(rule)} className="p-1.5 text-[#6D625C] hover:text-[#9A6031] hover:bg-[#F2E3D1] rounded transition-colors border border-[#E9DED3]">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDeleteRule(rule._id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors border border-[#E9DED3]">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#8A817C] text-xl font-bold pr-4">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredRules.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-[#6D625C] text-sm">
                          No rules configured for {activeTab}. Click "Export" &gt; "Seed Rules" or "Add Rule".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-[#E9DED3] bg-[#FAF8F5]">
                <p className="text-xs text-[#8A817C] flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  Rules are applied automatically based on order status and payment method.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar Widgets */}
          <div className="space-y-6">
            
            {/* Refund Calculation Sample */}
            <div className="bg-white border border-[#E9DED3] rounded-[14px] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#141225] mb-5">Refund Calculation (Sample)</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D625C]">Product Amount</span>
                  <span className="font-bold text-[#141225]">₹1,200.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D625C]">Platform Fee</span>
                  <span className="font-bold text-[#141225]">₹100.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D625C]">Weight Charge</span>
                  <span className="font-bold text-[#141225]">₹150.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D625C]">Cancellation Fee</span>
                  <span className="font-bold text-red-600">-₹60.00</span>
                </div>
                <div className="pt-3 border-t border-dashed border-[#E9DED3] flex justify-between">
                  <span className="font-bold text-[#141225]">Refund Amount</span>
                  <span className="font-bold text-emerald-600 text-lg">₹1,090.00</span>
                </div>
              </div>
            </div>

            {/* Recent Cancellation Requests */}
            <div className="bg-white border border-[#E9DED3] rounded-[14px] p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-bold text-[#141225]">Recent Cancellation Requests</h3>
                <button className="text-xs font-bold text-[#6D625C] hover:text-[#9A6031]">View All</button>
              </div>
              <div className="space-y-4 divide-y divide-[#E9DED3]">
                <div className="pt-2 flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#141225]">#WT10012 <span className="text-[#6D625C] font-normal">Suguna M</span></p>
                    <p className="text-xs text-[#8A817C] mt-1">Wrong Product</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded">Pending</span>
                    <p className="text-xs font-bold text-[#141225] mt-1">₹540.00</p>
                  </div>
                </div>
                <div className="pt-4 flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#141225]">#WT10011 <span className="text-[#6D625C] font-normal">Ramesh K</span></p>
                    <p className="text-xs text-[#8A817C] mt-1">Ordered by mistake</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Approved</span>
                    <p className="text-xs font-bold text-[#141225] mt-1">₹690.00</p>
                  </div>
                </div>
                <div className="pt-4 flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#141225]">#WT10010 <span className="text-[#6D625C] font-normal">Kavya S</span></p>
                    <p className="text-xs text-[#8A817C] mt-1">Delivery too late</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">Rejected</span>
                    <p className="text-xs font-bold text-[#141225] mt-1">₹320.00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Type Settings */}
            <div className="bg-white border border-[#E9DED3] rounded-[14px] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#141225] mb-4">Cancellation Type</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="cancelType" defaultChecked className="w-4 h-4 text-[#9A6031] focus:ring-[#9A6031] accent-[#9A6031]" />
                  <span className="text-sm text-[#4A403B] font-medium">Full Refund</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="cancelType" className="w-4 h-4 text-[#9A6031] focus:ring-[#9A6031] accent-[#9A6031]" />
                  <span className="text-sm text-[#4A403B] font-medium">Partial Refund</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="cancelType" className="w-4 h-4 text-[#9A6031] focus:ring-[#9A6031] accent-[#9A6031]" />
                  <span className="text-sm text-[#4A403B] font-medium">Store Credit</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="cancelType" className="w-4 h-4 text-[#9A6031] focus:ring-[#9A6031] accent-[#9A6031]" />
                  <span className="text-sm text-[#4A403B] font-medium">No Refund</span>
                </label>
              </div>
            </div>

            {/* Policy Notes */}
            <div className="bg-[#FFFDFB] border border-[#F2E3D1] rounded-[14px] p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24 text-[#9A6031]" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 18H8.2c-.1 0-.2-.1-.2-.2V17h8v2.8c0 .1-.1.2-.2.2zM16 15H8v-2h8v2zm0-4H8V9h8v2zm-3-6V3.5L18.5 9H13z"/></svg>
              </div>
              <h3 className="text-sm font-bold text-[#8B5E3C] mb-4 flex items-center gap-2">
                <AlertCircle size={16} />
                Cancellation Policy Notes
              </h3>
              <ul className="text-[11px] text-[#6D625C] space-y-2 list-disc pl-4 relative z-10">
                <li>Cancellation is allowed based on the order status and time limit.</li>
                <li>Fees are non-refundable and will be deducted from the refund amount.</li>
                <li>Refund will be processed to the original payment method or wallet.</li>
                <li>Out for delivery and delivered orders are not eligible for cancellation.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Add Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-[#E9DED3] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E9DED3] bg-[#FAF8F5]">
              <div className="flex items-center gap-2 text-[#2D6A4F]">
                <Plus size={20} className="stroke-[3]" />
                <h2 className="text-lg font-bold">{editingId ? 'Edit Cancellation Rule' : 'Add New Cancellation Rule'} ({activeTab})</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#6D625C] hover:text-[#141225] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 border-2 border-dashed border-[#2D6A4F]/20 m-6 rounded-lg bg-white">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#4A403B]">Rule Name (Order Status) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={formData.orderStatus}
                      onChange={(e) => setFormData({ ...formData, orderStatus: e.target.value })}
                      className="w-full appearance-none rounded border border-[#E9DED3] px-3 py-2 text-sm text-[#141225] focus:border-[#9A6031] focus:outline-none focus:ring-1 focus:ring-[#9A6031]"
                    >
                      <option value="Order Placed">Order Placed</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-[#8A817C] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#4A403B]">Cancellation Fee (₹) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    placeholder="Enter fee amount"
                    value={formData.cancellationFee}
                    onChange={(e) => setFormData({ ...formData, cancellationFee: e.target.value })}
                    className="w-full rounded border border-[#E9DED3] px-3 py-2 text-sm text-[#141225] placeholder:text-[#A9A09B] focus:border-[#9A6031] focus:outline-none focus:ring-1 focus:ring-[#9A6031]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#4A403B]">SLA (Days) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    placeholder="Enter SLA in days"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                    className="w-full rounded border border-[#E9DED3] px-3 py-2 text-sm text-[#141225] placeholder:text-[#A9A09B] focus:border-[#9A6031] focus:outline-none focus:ring-1 focus:ring-[#9A6031]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#4A403B]">Status</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status"
                        checked={formData.isAllowed === true}
                        onChange={() => setFormData({ ...formData, isAllowed: true })}
                        className="w-4 h-4 text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F]" 
                      />
                      <span className="text-sm text-[#4A403B] font-medium">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status"
                        checked={formData.isAllowed === false}
                        onChange={() => setFormData({ ...formData, isAllowed: false })}
                        className="w-4 h-4 text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F]" 
                      />
                      <span className="text-sm text-[#4A403B] font-medium">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-2">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-white border border-[#E9DED3] text-[#6D625C] rounded font-bold hover:bg-gray-50 shadow-sm transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveRule}
                  className="px-6 py-2 bg-[#2D6A4F] text-white rounded font-bold hover:bg-[#1B4332] shadow-sm transition-colors text-sm"
                >
                  Save Rule
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
