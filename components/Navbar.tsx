'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X, MapPin, ChevronDown, User as UserIcon, LogOut, Globe } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { totalItems, setIsOpen } = useCart();
  const { t, toggleLang, lang } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Role-based nav links are handled below — no forced signout needed

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/menu', label: t.nav.menu },
    { href: '/track', label: t.nav.track },
    { href: '/about', label: t.nav.about },
  ];

  if (user?.role === 'ADMIN') {
    navLinks.push({ href: '/admin', label: 'Admin | الإدارة' });
  } else if (user?.role === 'DELIVERY_PARTNER') {
    navLinks.push({ href: '/partner', label: 'Deliveries | التوصيل' });
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-gray-950/95 backdrop-blur-xl shadow-2xl border-b border-orange-500/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                🍚
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-950 animate-pulse" />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-tight tracking-wide">
                Biryani <span className="text-orange-400">Spot</span>
              </p>
              <p className="text-gray-400 text-xs font-medium tracking-widest uppercase">Restaurant</p>
            </div>
          </Link>

          {/* Location pill */}
          <div className="hidden lg:flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 rounded-full px-4 py-2 cursor-pointer hover:border-orange-500/50 transition-colors">
            <MapPin size={14} className="text-orange-400" />
            <span className="text-gray-300 text-sm font-medium">New York</span>
            <ChevronDown size={14} className="text-gray-400" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-orange-400 font-medium text-sm transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="hidden sm:flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-xl transition-all font-medium text-sm"
              id="lang-toggle-btn"
            >
              <Globe size={18} className="text-orange-400" />
              <span>English | Arabic</span>
            </button>

            {/* Cart button */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-orange-500/30"
              id="cart-btn"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">{t.nav.cart}</span>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-white text-orange-600 rounded-full text-xs font-black flex items-center justify-center shadow"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>

            {/* Auth Dropdown / Login Button */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 border border-gray-700 hover:border-orange-500 transition-colors"
                >
                  <UserIcon size={18} className="text-gray-300" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-gray-800 mb-2">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                      </div>
                      {user.role === 'USER' && (
                        <Link
                          href="/user"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-orange-400"
                        >
                          My Profile
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/' });
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden sm:flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full font-semibold text-sm transition-all"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-gray-300 hover:text-white p-2"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-gray-950/98 border-b border-gray-800 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-gray-300 hover:text-orange-400 font-medium py-3 border-b border-gray-800/50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { toggleLang(); setMobileOpen(false); }}
                className="w-full mt-3 text-left text-gray-300 hover:text-orange-400 font-medium py-3"
              >
                <div className="flex items-center justify-between">
                  <span>🌐 {t.language}</span>
                  <Globe size={18} className="text-gray-500" />
                </div>
              </button>
              
              <div className="pt-4 border-t border-gray-800/50">
                {isAuthenticated && user ? (
                  <>
                    <div className="mb-4">
                      <p className="text-white font-bold">{user.name}</p>
                      <p className="text-gray-400 text-xs capitalize">{user.role.toLowerCase()}</p>
                    </div>
                    {user.role === 'USER' && (
                      <Link href="/user" className="block text-gray-300 hover:text-orange-400 font-medium py-3 border-b border-gray-800/50">My Profile</Link>
                    )}
                    <button onClick={() => { signOut({ callbackUrl: '/' }); setMobileOpen(false); }} className="w-full text-left font-bold py-3 text-red-500">Logout</button>
                  </>
                ) : (
                  <Link href="/auth" onClick={() => setMobileOpen(false)} className="block text-white font-medium py-3 text-center bg-gray-800 rounded-xl mt-2">Sign In</Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
