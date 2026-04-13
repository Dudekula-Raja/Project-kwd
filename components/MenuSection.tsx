'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Plus, Flame, Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { categories, MenuItem } from '@/data/menu';

export default function MenuSection() {
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        setMenuItems(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchVeg = !vegOnly || item.isVeg;
      const matchSearch =
        !search ||
        item.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        item.nameAr.includes(search);
      return matchCategory && matchVeg && matchSearch;
    });
  }, [activeCategory, vegOnly, search, menuItems]);

  const uniqueCategories = Array.from(new Set(['breakfast', 'lunch', 'dinner', 'snacks', 'biryani', ...menuItems.map(item => item.category)]));
  const allCategories = [
    { id: 'all', nameEn: 'All', nameAr: 'الكل', icon: '🍽️' },
    ...uniqueCategories.map(cat => {
      const existing = categories.find(c => c.id === cat);
      return {
        id: cat,
        nameEn: existing ? existing.nameEn : cat.charAt(0).toUpperCase() + cat.slice(1),
        nameAr: existing ? existing.nameAr : cat,
        icon: existing ? existing.icon : '🍽️'
      };
    })
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder={t.search.placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500/70 text-gray-300 rounded-xl pl-11 pr-4 py-3 outline-none transition-colors text-sm placeholder-gray-600"
          />
        </div>
        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 border ${
            vegOnly
              ? 'bg-green-500/20 border-green-500/50 text-green-400'
              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          <div className={`w-4 h-4 border-2 ${vegOnly ? 'border-green-500' : 'border-gray-500'} rounded-sm flex items-center justify-center`}>
            {vegOnly && <div className="w-2 h-2 bg-green-500 rounded-full" />}
          </div>
          {t.menu.filterVeg}
        </button>
      </div>

      {/* Category tabs — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-3 mb-8 scrollbar-hide">
        {allCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex-shrink-0 ${
              activeCategory === cat.id
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.nameEn} | {cat.nameAr}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + vegOnly + search}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-gray-900 border border-gray-800 hover:border-orange-500/40 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image}
                  alt={`${item.nameEn} | ${item.nameAr}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

                {item.isBestseller && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      🏆 {t.featured.badge}
                    </span>
                  </div>
                )}

                <div className="absolute top-3 right-3">
                  <div className={`w-6 h-6 border-2 ${item.isVeg ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'} rounded-sm flex items-center justify-center`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-bold text-base leading-tight">
                    {item.nameEn} | {item.nameAr}
                  </h3>
                  {item.isSpicy && (
                    <span className="flex items-center gap-1 text-red-400 text-xs font-semibold whitespace-nowrap">
                      <Flame size={11} /> {t.menu.spicy}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">
                  {item.descriptionEn} | {item.descriptionAr}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="flex items-center gap-1 bg-green-600/20 border border-green-600/30 px-2 py-0.5 rounded-full">
                        <Star size={10} className="fill-green-400 text-green-400" />
                        <span className="text-green-400 font-bold text-xs">{item.rating}</span>
                      </div>
                      <span className="text-gray-600 text-xs">({item.reviews.toLocaleString()} {t.menu.reviews})</span>
                    </div>
                    <span className="text-white font-black text-lg">KD {item.price.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => addItem(item)}
                    className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-orange-500/20 text-sm"
                    id={`menu-add-${item.id}`}
                  >
                    <Plus size={14} />
                    {t.menu.addToCart}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-20 text-gray-600">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl font-semibold text-gray-400">No items found</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      )}
    </div>
  );
}
