'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function AuthPage() {
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = () => {
     setLoading(true);
     signIn('google', { callbackUrl: '/user' });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative z-10"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-2 hover:scale-105 transition-transform">
              ZomaBir
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back!</h1>
            <p className="text-gray-400">Sign in to access your platform.</p>
          </div>

          <div className="space-y-5">
            <div className="pt-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                   <>
                     <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                     Sign in with Google
                   </>
                )}
              </button>
              <p className="text-center text-gray-500 text-sm mt-4">For Administrators, Riders, and Customers</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
