import React, { useState, useEffect } from 'react';
import { Download, Search, ChevronDown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { adminService } from '../../../api/adminService';

export default function RefundManagementPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRefunds = async () => {
    try {
      const data = await adminService.getRefunds();
      if (Array.isArray(data)) {
        setRefunds(data);
      } else {
        setRefunds([]);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleSeed = async () => {
    try {
      await adminService.seedRefunds();
      toast.success('Refunds seeded');
      fetchRefunds();
    } catch (e) {
      toast.error(e.message || 'Failed to seed refunds');
    }
  };

  // Derived Stats
  const totalRefunds = refunds.length;
  const totalAmount = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingRefunds = refunds.filter(r => r.status === 'Pending').length;
  const successfulRefunds = refunds.filter(r => r.status === 'Completed' || r.status === 'Approved Refund').length;
  const processingRefunds = refunds.filter(r => r.status === 'Processing').length;
  const failedRefunds = refunds.filter(r => r.status === 'Failed').length;

  // Chart Data
  const pieData = [
    { name: 'Approved', value: successfulRefunds, color: '#4ade80' },
    { name: 'Pending', value: pendingRefunds, color: '#60a5fa' },
    { name: 'Processing', value: processingRefunds, color: '#fb923c' },
    { name: 'Failed', value: failedRefunds, color: '#f87171' },
  ].filter(d => d.value > 0);

  const codCount = refunds.filter(r => r.paymentType === 'COD').length;
  const cashfreeCount = refunds.filter(r => r.paymentType === 'Cashfree').length;
  
  const barData = [
    { name: 'COD', value: codCount, fill: '#a78bfa' },
    { name: 'Cashfree', value: cashfreeCount, fill: '#60a5fa' },
  ];

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Approved Refund':
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Pending': return 'bg-orange-100 text-orange-700';
      case 'Processing': return 'bg-blue-100 text-blue-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionStyle = (action) => {
    switch(action) {
      case 'Refunded': return 'bg-emerald-500 text-white';
      case 'Refund': return 'bg-[#8B5E3C] text-white';
      case 'Processing': return 'bg-blue-100 text-blue-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#141225] font-serif tracking-tight">Refund Management</h1>
            <p className="text-[#6D625C] mt-1.5 text-sm">Manage pending and processed refunds.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E9DED3] text-[#6D625C] rounded-lg text-sm font-bold shadow-sm">
              Last 30 Days
              <ChevronDown size={14} />
            </button>
            <button onClick={handleSeed} className="flex items-center gap-2 px-4 py-2 bg-[#8B5E3C] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#70482B] transition-colors">
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[14px] border border-[#E9DED3] p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6D625C]">Total Refunds</p>
              <h3 className="text-2xl font-bold text-[#141225] mt-0.5">{totalRefunds}</h3>
              <p className="text-[10px] text-[#8A817C] mt-1">All time total refunds</p>
            </div>
          </div>
          
          <div className="bg-white rounded-[14px] border border-[#E9DED3] p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6D625C]">Total Refunded Amount</p>
              <h3 className="text-2xl font-bold text-[#141225] mt-0.5">₹{totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h3>
              <p className="text-[10px] text-[#8A817C] mt-1">All time refunded amount</p>
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-[#E9DED3] p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6D625C]">Pending Refunds</p>
              <h3 className="text-2xl font-bold text-[#141225] mt-0.5">{pendingRefunds}</h3>
              <p className="text-[10px] text-[#8A817C] mt-1">Refunds in progress</p>
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-[#E9DED3] p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6D625C]">Successful Refunds</p>
              <h3 className="text-2xl font-bold text-[#141225] mt-0.5">{successfulRefunds}</h3>
              <p className="text-[10px] text-[#8A817C] mt-1">Completed refunds</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white rounded-[14px] border border-[#E9DED3] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#141225] mb-6">Refunds by Status</h3>
            <div className="flex items-center">
              <div className="w-1/2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3 pl-6">
                {pieData.map((d, i) => {
                  const perc = totalRefunds ? Math.round((d.value / totalRefunds) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                        <span className="text-[#6D625C]">{d.name}</span>
                      </div>
                      <div className="text-[#141225]">{d.value} <span className="text-[#8A817C]">({perc}%)</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-[#E9DED3] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#141225] mb-6">Refunds by Payment Type</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#8A817C'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#8A817C'}} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="value" barSize={80} radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Data Table Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E9DED3] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select className="bg-white border border-[#E9DED3] text-[#4A403B] text-sm rounded-lg px-4 py-2 focus:outline-none shadow-sm cursor-pointer">
              <option>All Payment Types</option>
              <option>COD</option>
              <option>Cashfree</option>
            </select>
            <select className="bg-white border border-[#E9DED3] text-[#4A403B] text-sm rounded-lg px-4 py-2 focus:outline-none shadow-sm cursor-pointer">
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Completed</option>
            </select>
            <select className="bg-white border border-[#E9DED3] text-[#4A403B] text-sm rounded-lg px-4 py-2 focus:outline-none shadow-sm cursor-pointer">
              <option>All Timelines</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#E9DED3] rounded-[14px] shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E9DED3]">
                  <th className="px-6 py-4 text-[10px] font-bold text-[#6D625C] uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#6D625C] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#6D625C] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#6D625C] uppercase tracking-wider text-center">Payment Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#6D625C] uppercase tracking-wider text-center">SLA Timeline</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#6D625C] uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#6D625C] uppercase tracking-wider text-center">Refund</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#6D625C] uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DED3]">
                {refunds.slice(0, 5).map((refund, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-[#141225]">{refund.orderId}</td>
                    <td className="px-6 py-4 text-xs text-[#141225]">{refund.customerName}</td>
                    <td className="px-6 py-4 text-xs font-bold text-[#141225]">₹{refund.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${refund.paymentType === 'Cashfree' ? 'text-blue-500 bg-blue-50' : 'text-purple-500 bg-purple-50'}`}>
                        {refund.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold ${refund.slaTimeline !== '-' ? 'text-orange-400' : 'text-gray-400'}`}>
                        {refund.slaTimeline}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold ${getStatusStyle(refund.status)}`}>
                        {refund.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-4 py-1.5 rounded-lg text-[10px] font-bold shadow-sm ${getActionStyle(refund.refundActionStatus)}`}>
                        {refund.refundActionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {refunds.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-[#6D625C] text-sm">
                      No refunds found. Click "Export CSV" &gt; Seed Refunds to populate demo data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#E9DED3] flex items-center justify-between">
            <span className="text-xs text-[#8A817C] font-medium">Showing 1 to {Math.min(5, refunds.length)} of {refunds.length} results</span>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-[#8B5E3C] text-white font-bold text-xs shadow-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-[#4A403B] font-bold text-xs transition-colors">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-[#4A403B] font-bold text-xs transition-colors">3</button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-[#4A403B] font-bold text-xs transition-colors">4</button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
