'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, DollarSign, Package, Check, X, MapPin, Power, Phone, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function PartnerDashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const isLoading = status === 'loading';
  const { isRTL } = useLanguage();
  const router = useRouter();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
    if (!isLoading && isAuthenticated && user?.role !== 'DELIVERY_PARTNER') {
      router.push('/');
    }
  }, [isAuthenticated, user, isLoading, router]);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders`);
      const allOrders = await res.json();
      
      // Filter for this rider's active orders + pending orders they can claim
      const relevantOrders = allOrders.filter((o: any) => 
        (o.deliveryPartnerId === user?.id) || 
        (o.status === 'PENDING' && !o.deliveryPartnerId)
      );
      
      setOrders(relevantOrders);

      // Calculates mock earnings from completed orders
      const completed = relevantOrders.filter((o: any) => o.status === 'DELIVERED' && o.deliveryPartnerId === user?.id);
      const totalEarnings = completed.reduce((sum: number, o: any) => sum + (o.deliveryFee || 0), 0);
      setEarnings(totalEarnings);

    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const payload: any = { id: orderId, status: newStatus };
      
      if (newStatus === 'OUT_FOR_DELIVERY') {
        payload.deliveryPartnerId = user?.id; // Assign to self
      }
      if (newStatus === 'DELIVERED') {
         payload.deliveredAt = new Date().toISOString();
      }

      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeOrder = orders.find(o => o.deliveryPartnerId === user.id && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const availableOrders = orders.filter(o => o.status === 'PENDING' && !o.deliveryPartnerId);
  const completedOrders = orders.filter(o => o.deliveryPartnerId === user.id && o.status === 'DELIVERED');

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-20 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Top Status Bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36" alt="Profile" className="w-14 h-14 rounded-full object-cover" />
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-900 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
            </div>
            <div>
              <h2 className="text-white font-bold">{user.name}</h2>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Star size={12} className="text-orange-400 fill-orange-400" /> {user.rating || 4.9} • {user.vehicle || 'Bike'}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isOnline ? 'bg-green-500/20 text-green-500 hover:bg-red-500/20 hover:text-red-500' : 'bg-gray-800 text-gray-400 hover:bg-green-500/20 hover:text-green-500'}`}
          >
            <Power size={24} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/10 border border-blue-500/20 rounded-3xl p-5 relative overflow-hidden">
            <DollarSign className="absolute -bottom-2 -right-2 w-20 h-20 text-blue-500/10" />
            <p className="text-blue-300 text-sm font-medium mb-1">Today's Earnings</p>
            <p className="text-white text-3xl font-black">KD {earnings.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 relative overflow-hidden">
            <Package className="absolute -bottom-2 -right-2 w-20 h-20 text-gray-700/30" />
            <p className="text-gray-400 text-sm font-medium mb-1">Completed</p>
            <p className="text-white text-3xl font-black">{completedOrders.length}</p>
          </div>
        </div>

        {/* Not Online Warning */}
        {!isOnline && (
          <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-3xl p-10 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Power size={24} className="text-gray-500" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">You are currently offline</h3>
            <p className="text-gray-500 text-sm">Go online to start receiving delivery requests in your area.</p>
          </div>
        )}

        {/* Active Order View (If rider has accepted an order) */}
        {isOnline && activeOrder && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-blue-400/30">
            <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Dubai&zoom=14&size=600x300&maptype=roadmap&style=feature:all|element:labels|visibility:off&style=feature:water|color:0x0e111a&style=feature:landscape|color:0x151b29&style=feature:road|color:0x222a3f')] opacity-30 mix-blend-overlay object-cover pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/10 uppercase tracking-widest">
                  {activeOrder.status.replace(/_/g, ' ')}
                </div>
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-sm font-bold border border-white/10 flex items-center gap-1">
                  <DollarSign size={14} className="text-green-400" />
                  {activeOrder.deliveryFee.toFixed(2)}
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-4">
                <div className="flex gap-4 items-start mb-4">
                  <div className="mt-1 flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-400" />
                    <div className="w-0.5 h-10 bg-gray-600" />
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Pickup</p>
                      <p className="text-white font-bold">Biryani Spot Restaurant</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Dropoff</p>
                      <p className="text-white font-bold">{activeOrder.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold py-3 px-4 rounded-xl flex-1 transition-all">
                  <Phone size={18} /> Call
                </button>
                <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold py-3 px-4 rounded-xl flex-1 transition-all">
                  <Navigation size={18} /> Map
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                {activeOrder.status === 'PREPARING' && (
                  <button 
                    onClick={() => updateOrderStatus(activeOrder.id, 'OUT_FOR_DELIVERY')}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg transition-all"
                  >
                    Confirm Pickup
                  </button>
                )}
                {activeOrder.status === 'OUT_FOR_DELIVERY' && (
                  <button 
                    onClick={() => updateOrderStatus(activeOrder.id, 'DELIVERED')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-lg transition-all"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Incoming Orders View */}
        {isOnline && !activeOrder && (
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Available Requests ({availableOrders.length})
            </h3>
            
            <div className="space-y-4">
              {availableOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
                   <Navigation size={32} className="mx-auto mb-2 opacity-50" />
                   <p>Searching for nearby orders...</p>
                </div>
              ) : (
                availableOrders.map(order => (
                  <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-gray-400 text-xs">Order #{order.id}</span>
                        <h4 className="text-white font-bold mt-1 max-w-[200px] truncate">{order.deliveryAddress}</h4>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                          <MapPin size={12} /> 2.5 km away
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-full text-sm">
                          KD {order.deliveryFee.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 border-t border-gray-800 pt-4">
                       <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors">
                         Reject
                       </button>
                       <button 
                         onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                         className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                       >
                         Accept Delivery
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
