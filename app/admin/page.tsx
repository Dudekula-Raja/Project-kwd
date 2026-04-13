'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Plus, X, Save, Wand2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { MenuItem, categories } from '@/data/menu';

const initialFormState: Partial<MenuItem> = {
  nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '', price: 0,
  image: '', category: 'biryani', isVeg: false, isBestseller: false, isSpicy: false, badge: ''
};

export default function AdminPage() {
  const { t, lang, isRTL } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState<'overview' | 'pos' | 'menu' | 'users' | 'orders'>('overview');
  
  // Analytics State
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MenuItem>>(initialFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  // POS State
  const [posCart, setPosCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [posUser, setPosUser] = useState<string>(''); // Can be an existing user ID or 'walk_in'
  const [walkInName, setWalkInName] = useState('');
  const [posCategory, setPosCategory] = useState<string>('all');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, ordersRes, usersRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/orders'),
        fetch('/api/users')
      ]);
      const menuData = await menuRes.json();
      const ordersData = await ordersRes.json();
      const usersData = await usersRes.json();

      setItems(Array.isArray(menuData) ? menuData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = editingId !== null;
      const url = '/api/menu';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...formData, id: editingId } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  const openEdit = (item: MenuItem) => {
    setFormData(item);
    setEditingId(item.id);
    setIsNewCategory(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsNewCategory(false);
    setIsModalOpen(false);
  };

  const handleTranslateField = async (field: 'name' | 'description') => {
    const enText = field === 'name' ? formData.nameEn : formData.descriptionEn;
    const arText = field === 'name' ? formData.nameAr : formData.descriptionAr;
    
    if (!enText || arText) return; // Skip if no English text or Arabic already exists
    
    setIsTranslating(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(enText)}&langpair=en|ar`);
      const data = await res.json();
      if (data.responseData?.translatedText) {
         setFormData(prev => ({ 
           ...prev, 
           [field === 'name' ? 'nameAr' : 'descriptionAr']: data.responseData.translatedText 
         }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const json = await res.json();
      if (json.success) {
        setFormData(prev => ({ ...prev, image: json.url }));
      } else {
        throw new Error(json.error);
      }
    } catch (err) {
      console.error(err);
      alert('Local image upload failed. Ensure the server has file write permissions.');
    } finally {
      setIsUploading(false);
    }
  };

  const openUserModal = (user: any) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  // Analytics Helpers
  const getFilteredOrders = () => {
    const now = new Date();
    return orders.filter(o => {
      if (!o.createdAt) return true;
      const orderDate = new Date(o.createdAt);
      
      switch (dateFilter) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= oneWeekAgo;
        case 'month':
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        case 'year':
          return orderDate.getFullYear() === now.getFullYear();
        case 'custom':
          if (customStartDate && customEndDate) {
            return orderDate >= new Date(customStartDate) && orderDate <= new Date(customEndDate);
          }
          return true;
        default:
          return true;
      }
    });
  };

  const filteredOrders = getFilteredOrders();
  // Revenue is calculated only for Delivered + Paid orders
  const totalRevenue = filteredOrders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const handlePosCheckout = async () => {
    if (posCart.length === 0) return alert('Cart is empty!');
    if (!posUser) return alert('Please select a customer or walk-in');
    
    setIsCheckoutLoading(true);
    try {
      let finalUserId = posUser;

      // If it's a new walk-in, create the user first
      if (posUser === 'walk_in') {
        if (!walkInName) {
          setIsCheckoutLoading(false);
          return alert('Please enter walk-in customer name');
        }
        const userRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: walkInName })
        });
        const newUser = await userRes.json();
        if (newUser.error) throw new Error(newUser.error);
        finalUserId = newUser.id;
      }

      // Calculate totals
      const subtotal = posCart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);

      // Create POS Order (Instantly Paid & Delivered)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUserId,
          deliveryAddress: 'Dine-In',
          items: posCart.map(c => ({ id: c.item.id, price: c.item.price, quantity: c.quantity })),
          subtotal,
          deliveryFee: 0,
          total: subtotal,
          paymentMethod: 'CASH', // Over the counter
          paymentStatus: 'PAID',
          status: 'DELIVERED'
        })
      });

      if (orderRes.ok) {
        setPosCart([]);
        setPosUser('');
        setWalkInName('');
        alert('POS Order Completed Successfully!');
        fetchData(); // Refresh UI state automatically
      }
    } catch (error) {
      console.error(error);
      alert('Failed to checkout POS order');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-16 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Platform Administration</h1>
            <p className="text-gray-400">Manage menus, users, POS, and view platform analytics.</p>
          </div>
          {activeTab === 'menu' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-colors"
            >
              <Plus size={18} />
              {(t as any).admin.add}
            </button>
          )}
        </div>

        {/* Admin Tabs */}
        <div className="flex overflow-x-auto gap-4 mb-8 pb-2">
          {['overview', 'pos', 'menu', 'users', 'orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-xl font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}
            >
              {tab === 'pos' ? 'Dine-In POS' : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Date Filter Controls */}
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl flex flex-wrap items-center gap-4">
                  <span className="text-gray-400 font-medium">Filter By Date:</span>
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="bg-gray-950 border border-gray-800 text-white px-4 py-2 rounded-xl outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Date Range</option>
                  </select>

                  {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2">
                      <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-gray-950 border border-gray-800 text-gray-300 px-3 py-2 rounded-xl text-sm" />
                      <span className="text-gray-500">to</span>
                      <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-gray-950 border border-gray-800 text-gray-300 px-3 py-2 rounded-xl text-sm" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
                    <p className="text-gray-400 text-sm mb-2 relative z-10">Total Collected Revenue</p>
                    <p className="text-4xl font-black text-white relative z-10">KD {totalRevenue.toFixed(2)}</p>
                    <p className="text-green-400 text-xs mt-2 relative z-10">Only counts Delivered orders</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
                    <p className="text-gray-400 text-sm mb-2">Total Orders Placed</p>
                    <p className="text-4xl font-black text-white">{filteredOrders.length}</p>
                    <p className="text-orange-400 text-xs mt-2">In selected time period</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
                    <p className="text-gray-400 text-sm mb-2">Total Registered Users</p>
                    <p className="text-4xl font-black text-white">{users.length}</p>
                    <p className="text-blue-400 text-xs mt-2">Including walk-ins</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pos' && (
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Menu Selection Side */}
                <div className="flex-[2] bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col max-h-[750px] overflow-hidden">
                  <h2 className="text-xl font-bold text-white mb-4">Select Items</h2>
                  
                  {/* Category Ribbon */}
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide shrink-0">
                    <button 
                      onClick={() => setPosCategory('all')}
                      className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${posCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                      All Items
                    </button>
                    {Array.from(new Set(['breakfast', 'lunch', 'dinner', 'snacks', 'biryani', ...items.map(item => item.category)])).map(catName => {
                      const existingCat = categories.find(c => c.id === catName);
                      const icon = existingCat ? existingCat.icon : '🍽️';
                      const label = existingCat ? existingCat.nameEn : catName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <button 
                          key={catName}
                          onClick={() => setPosCategory(catName)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${posCategory === catName ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        >
                           <span>{icon}</span> {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-10">
                    {items.filter(item => posCategory === 'all' || item.category === posCategory).map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          const existing = posCart.find(c => c.item.id === item.id);
                          if (existing) {
                            setPosCart(posCart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
                          } else {
                            setPosCart([...posCart, { item, quantity: 1 }]);
                          }
                        }}
                        className="bg-gray-950 border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-orange-500/50 hover:bg-gray-800 transition-all flex flex-col items-center text-center group h-auto shrink-0 shadow-sm"
                      >
                        <img src={item.image} alt="" className="w-16 h-16 object-cover rounded-full mb-2 group-hover:scale-110 transition-transform shadow-md" />
                        <p className="text-white font-bold text-sm line-clamp-2 leading-tight">{item.nameEn}</p>
                        <p className="text-gray-500 text-xs mt-1 capitalize">{item.category}</p>
                        <p className="text-orange-400 font-bold mt-1">KD {item.price.toFixed(2)}</p>
                      </div>
                    ))}
                    {items.filter(item => posCategory === 'all' || item.category === posCategory).length === 0 && (
                      <div className="col-span-full text-center py-10 text-gray-600">No items found in this category</div>
                    )}
                  </div>
                </div>

                {/* POS Cart Sidebar */}
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col h-[650px]">
                  <h2 className="text-xl font-bold text-white mb-4">New Dine-In Order</h2>
                  
                  {/* Customer Selection */}
                  <div className="mb-6 space-y-3 p-4 bg-gray-950 rounded-xl border border-gray-800">
                    <label className="text-gray-400 text-sm font-bold">Select Customer</label>
                    <select 
                      value={posUser} 
                      onChange={(e) => setPosUser(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-orange-500"
                    >
                      <option value="">-- Choose User --</option>
                      <option value="walk_in">+ New Walk-In Customer</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                    
                    {posUser === 'walk_in' && (
                      <input 
                        type="text" 
                        placeholder="Enter walk-in name..." 
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-orange-500"
                      />
                    )}
                  </div>

                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                    {posCart.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-500">Cart is empty</div>
                    ) : posCart.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800">
                        <div className="flex-1 truncate pr-2">
                          <p className="text-white text-sm font-bold truncate">{c.item.nameEn}</p>
                          <p className="text-gray-400 text-xs">KD {c.item.price.toFixed(2)} x {c.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-orange-400 font-bold">KD {(c.item.price * c.quantity).toFixed(2)}</p>
                          <button 
                            onClick={() => setPosCart(posCart.filter((_, i) => i !== idx))}
                            className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Footer */}
                  <div className="pt-4 border-t border-gray-800 mt-auto">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-white font-bold text-lg">Total</span>
                      <span className="text-green-400 font-black text-2xl">
                        KD {posCart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                    <button 
                      onClick={handlePosCheckout}
                      disabled={isCheckoutLoading || posCart.length === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-50 transition-all font-bold flex items-center justify-center"
                    >
                      {isCheckoutLoading ? 'Processing...' : 'Mark Paid & Create Order'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800/50 border-b border-gray-700">
                      <th className="p-4 text-gray-400 font-semibold text-sm">Name</th>
                      <th className="p-4 text-gray-400 font-semibold text-sm">Role</th>
                      <th className="p-4 text-gray-400 font-semibold text-sm">Status</th>
                      <th className="p-4 text-gray-400 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-800/50">
                        <td className="p-4 text-white font-bold">{u.name}</td>
                        <td className="p-4 text-gray-300 text-sm">{u.role}</td>
                        <td className="p-4">
                          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">{u.status}</span>
                        </td>
                        <td className="p-4 space-x-2">
                          <button onClick={() => openUserModal(u)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg">View History</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800/50 border-b border-gray-700">
                      <th className="p-4 text-gray-400 font-semibold text-sm">Order ID</th>
                      <th className="p-4 text-gray-400 font-semibold text-sm">Customer</th>
                      <th className="p-4 text-gray-400 font-semibold text-sm">Ordered Items</th>
                      <th className="p-4 text-gray-400 font-semibold text-sm">Status</th>
                       <th className="p-4 text-gray-400 font-semibold text-sm text-right">Total</th>
                       <th className="p-4 text-gray-400 font-semibold text-sm text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} className="border-b border-gray-800/50">
                        <td className="p-4 text-white font-bold text-sm w-32">
                          #{o.id.slice(-6)}
                          <div className="text-gray-600 text-[10px] mt-1 font-normal">{new Date(o.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="p-4 w-48 text-gray-200 text-sm">
                          {o.user ? o.user.name : 'Unknown User'}
                        </td>
                        <td className="p-4 max-w-sm">
                          <div className="flex flex-wrap gap-1.5">
                            {o.items?.map((item: any, i: number) => (
                              <span key={i} className="bg-gray-800 border border-gray-700 text-gray-300 text-[11px] px-2 py-1 rounded-md whitespace-nowrap">
                                {item.quantity}x {item.menuItem?.nameEn || 'Item'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 w-32">
                          <span className={`${o.status === 'DELIVERED' ? 'bg-green-500/10 text-green-400' : o.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'} px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap`}>
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                         <td className="p-4 text-orange-400 font-black text-right w-24">
                           KD {o.total?.toFixed(2)}
                         </td>
                         <td className="p-4 text-right">
                           <button 
                             onClick={() => handleDeleteOrder(o.id)}
                             className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                           >
                             <Trash2 size={16} />
                           </button>
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'menu' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-700">
                    <th className="p-4 text-gray-400 font-semibold text-sm">Item</th>
                    <th className="p-4 text-gray-400 font-semibold text-sm">Category</th>
                    <th className="p-4 text-gray-400 font-semibold text-sm">Price</th>
                    <th className="p-4 text-gray-400 font-semibold text-sm">Tags</th>
                    <th className="p-4 text-gray-400 font-semibold text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="text-white font-bold">{item.nameEn} | {item.nameAr}</p>
                            <p className="text-gray-500 text-xs truncate max-w-[200px]">
                              {item.descriptionEn} | {item.descriptionAr}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300 capitalize text-sm">{item.category}</td>
                      <td className="p-4 text-white font-bold">KD {item.price.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {item.isVeg && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">Veg</span>}
                          {item.isBestseller && <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded">Best</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openEdit(item)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors ml-2">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors ml-2">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            )}
          </>
        )}

        {/* User Detail View Modal */}
        <AnimatePresence>
          {isUserModalOpen && selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0">
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedUser.name}</h2>
                    <p className="text-gray-400 text-sm mt-1">{selectedUser.email} • {selectedUser.phone || 'No phone'} • Registered {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => setIsUserModalOpen(false)} className="bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors">
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto w-full grid md:grid-cols-3 gap-6">
                  {/* User Analytics Summary */}
                  <div className="md:col-span-1 space-y-4">
                    <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Lifetime Spend</p>
                      <p className="text-3xl font-black text-orange-400">
                        KD {orders.filter(o => o.userId === selectedUser.id && o.status === 'DELIVERED').reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Orders</p>
                      <p className="text-3xl font-black text-white">{orders.filter(o => o.userId === selectedUser.id).length}</p>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Account Role</p>
                      <span className="inline-block mt-1 bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-bold">{selectedUser.role}</span>
                    </div>
                  </div>

                  {/* Order History Log */}
                  <div className="md:col-span-2">
                    <h3 className="text-white font-bold mb-4">Complete Order History</h3>
                    <div className="space-y-3">
                      {orders.filter(o => o.userId === selectedUser.id).map(order => (
                        <div key={order.id} className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold text-sm">Order #{order.id.slice(-6)}</p>
                            <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-orange-400 font-bold">KD {order.total.toFixed(2)}</p>
                            <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{order.status}</span>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.userId === selectedUser.id).length === 0 && (
                        <p className="text-gray-500 text-center py-10">No orders placed by this user.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Menu Editing Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {editingId ? (t as any).admin.edit : (t as any).admin.add}
                  </h2>
                  <div className="flex items-center gap-3">
                    {isTranslating && <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"><Wand2 size={14} className="animate-spin" /> Translating...</div>}
                    <button type="button" onClick={closeModal} className="text-gray-400 hover:text-white p-2">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">{(t as any).admin.nameEn}</label>
                      <input required type="text" value={formData.nameEn || ''} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} onBlur={() => handleTranslateField('name')} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">{(t as any).admin.nameAr}</label>
                      <input required type="text" value={formData.nameAr || ''} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500" dir="rtl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">{(t as any).admin.descEn}</label>
                      <textarea required value={formData.descriptionEn || ''} onChange={e => setFormData({ ...formData, descriptionEn: e.target.value })} onBlur={() => handleTranslateField('description')} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 h-24" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">{(t as any).admin.descAr}</label>
                      <textarea required value={formData.descriptionAr || ''} onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 h-24" dir="rtl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">{(t as any).admin.price}</label>
                      <input required type="number" step="0.01" value={formData.price || 0} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">{(t as any).admin.category}</label>
                      {!isNewCategory ? (
                        <select 
                          required 
                          value={formData.category || 'breakfast'} 
                          onChange={e => {
                            if (e.target.value === 'new_category') {
                              setIsNewCategory(true);
                              setFormData({ ...formData, category: '' });
                            } else {
                              setFormData({ ...formData, category: e.target.value });
                            }
                          }} 
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 capitalize"
                        >
                          {Array.from(new Set(['breakfast', 'lunch', 'dinner', 'snacks', 'biryani', ...items.map(i => i.category)])).map(cat => (
                            <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                          ))}
                          <option value="new_category" className="text-orange-400 font-bold">+ New Category...</option>
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <input 
                            required 
                            autoFocus
                            value={formData.category || ''} 
                            onChange={e => setFormData({ ...formData, category: e.target.value.toLowerCase().replace(/\s+/g, '_') })} 
                            className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500" 
                            placeholder="Type new category..."
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              setIsNewCategory(false);
                              setFormData({ ...formData, category: 'breakfast' }); // Fallback
                            }}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded-xl transition-colors shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">{(t as any).admin.badge} (Optional)</label>
                      <input type="text" value={formData.badge || ''} onChange={e => setFormData({ ...formData, badge: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs mb-1">{(t as any).admin.image} Upload</label>
                    <input 
                      required={!formData.image} 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload} 
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-500/10 file:text-orange-500 hover:file:bg-orange-500/20" 
                    />
                    {isUploading && <p className="text-orange-500 text-xs mt-2 animate-pulse font-semibold">Uploading Image File...</p>}
                    {formData.image && !isUploading && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-xs text-green-400 font-semibold bg-green-500/10 px-2 py-1 rounded inline-flex items-center gap-1">
                          <span>✓ Selected: {formData.image.split('/').pop()}</span>
                        </div>
                        <img src={formData.image} className="h-8 w-8 rounded object-cover ml-auto" alt="Preview" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isVeg || false} onChange={e => setFormData({ ...formData, isVeg: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                      <span className="text-gray-300 text-sm">{(t as any).admin.veg}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isBestseller || false} onChange={e => setFormData({ ...formData, isBestseller: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                      <span className="text-gray-300 text-sm">{(t as any).admin.bestseller}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isSpicy || false} onChange={e => setFormData({ ...formData, isSpicy: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                      <span className="text-gray-300 text-sm">{(t as any).admin.spicy}</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-800 mt-6">
                    <button type="button" onClick={closeModal} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors">
                      {(t as any).admin.cancel}
                    </button>
                    <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20">
                      <Save size={18} />
                      {(t as any).admin.save}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
