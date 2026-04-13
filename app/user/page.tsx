'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, MapPin, Package, Clock, CheckCircle2, Navigation, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const isLoading = status === 'loading';
  const { isRTL } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('orders');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
    // Redirect admins and delivery partners to their own dashboards
    if (!isLoading && user?.role === 'ADMIN') {
      router.push('/admin');
    }
    if (!isLoading && user?.role === 'DELIVERY_PARTNER') {
      router.push('/partner');
    }
  }, [isAuthenticated, user, isLoading, router]);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?userId=${user?.id}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch user orders', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'PREPARING': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'OUT_FOR_DELIVERY': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircle2 size={16} />;
      case 'PREPARING': return <Clock size={16} />;
      case 'OUT_FOR_DELIVERY': return <Navigation size={16} />;
      default: return <Package size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-16 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full" />
          
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full p-1 relative z-10">
            <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt={user.name || ''} className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-orange-400" />
              )}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <h1 className="text-3xl font-black text-white mb-1">{user.name}</h1>
            <p className="text-gray-400 mb-4">{user.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300">
                <Package size={14} className="text-blue-400" />
                {orders.length} Orders Total
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}
          >
            Profile Details
          </button>
        </div>

        {/* Content */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {loadingOrders ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-3xl">
                <div className="text-6xl mb-4 opacity-50">🍱</div>
                <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
                <p className="text-gray-500">Looks like you haven't placed an order yet.</p>
                <button onClick={() => router.push('/menu')} className="mt-6 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors">
                  Browse Menu
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-gray-800 pb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">Order #{order.id.slice(-6)}</h3>
                      <p className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-gray-800 text-gray-300 flex items-center justify-center text-xs font-bold">{item.quantity}x</span>
                          {/* FIX: item.menuItem.nameEn, not item.nameEn */}
                          <span className="text-gray-300 font-medium">{item.menuItem?.nameEn || 'Item'}</span>
                        </div>
                        <span className="text-gray-400">KD {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-800 pt-4">
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 bg-gray-800 rounded-lg text-xs font-bold text-gray-300">{order.paymentMethod}</span>
                      {order.rating && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold">
                          <Star size={12} className="fill-green-400" /> {order.rating}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs mb-0.5">Total Paid</p>
                      <p className="text-orange-400 font-black text-xl">KD {order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
             <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>
             <div className="grid sm:grid-cols-2 gap-6">
               <div>
                 <label className="block text-gray-500 text-xs mb-1">Full Name</label>
                 <div className="bg-gray-950 border border-gray-800 text-white px-4 py-3 rounded-xl">{user.name || '—'}</div>
               </div>
               <div>
                 <label className="block text-gray-500 text-xs mb-1">Email Address</label>
                 <div className="bg-gray-950 border border-gray-800 text-white px-4 py-3 rounded-xl">{user.email}</div>
               </div>
               <div>
                 <label className="block text-gray-500 text-xs mb-1">Role</label>
                 <div className="bg-gray-950 border border-gray-800 text-orange-400 font-bold px-4 py-3 rounded-xl">{user.role}</div>
               </div>
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
