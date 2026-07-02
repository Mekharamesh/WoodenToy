import React, { useState, useEffect } from 'react';
import { catalogService } from '../api/catalogService';

export default function Header({ user, onLogout, onNavigate, cartCount, onOpenCart, wishlistCount, onOpenWishlist }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await catalogService.getCategories();
        setCategories(cats.filter(c => c.isActive && !c.isDeleted));
      } catch (err) {
        console.error("Failed to load categories for navbar", err);
      }
    };
    fetchCategories();
  }, []);

  const mainCategories = categories.filter(c => !c.parentCategory);
  
  const getSubCategories = (parentId) => {
    return categories.filter(c => 
      c.parentCategory === parentId || 
      (c.parentCategory && c.parentCategory._id === parentId)
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm font-sans">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Top Row: Search | Logo | Icons ── */}
        <div className="flex items-center justify-between h-20 border-b border-gray-50">
          
          {/* Left: Search */}
          <div className="flex items-center flex-1">
            <button className="text-gray-500 hover:text-brand-dark transition-colors p-2 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </div>

          {/* Center: Logo / Website Name */}
          <button
            onClick={() => onNavigate('home')}
            className="flex-shrink-0 font-serif text-3xl font-bold tracking-tight text-brand-dark cursor-pointer text-center"
          >
            WoodenToys
          </button>

          {/* Right: Auth, Wishlist, Cart */}
          <div className="flex items-center justify-end space-x-6 flex-1">
            
            {/* Auth / Profile */}
            <div className="relative">
              <button
                onClick={() => user ? setDropdownOpen(!dropdownOpen) : onNavigate('login')}
                className="text-gray-500 hover:text-brand-dark transition-colors p-2 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </button>

              {/* Profile Dropdown */}
              {dropdownOpen && user && (
                <div className="absolute right-0 mt-3 w-48 bg-white shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-xs font-bold text-brand-dark">{user.name}</p>
                    <p className="text-[10px] text-brand-medium truncate">{user.email}</p>
                  </div>
                  {user.role === 'admin' && (
                    <button 
                      onClick={() => { onNavigate('admin'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-brand-dark hover:bg-gray-50 transition-colors"
                    >
                      Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { onNavigate('profile'); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-brand-dark hover:bg-gray-50 transition-colors"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => { onLogout(); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-gray-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button 
              onClick={onOpenWishlist}
              className="relative text-gray-500 hover:text-brand-dark transition-colors p-2 cursor-pointer flex items-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold bg-brand-dark text-white rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button 
              onClick={onOpenCart}
              className="relative text-gray-500 hover:text-brand-dark transition-colors p-2 cursor-pointer flex items-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold bg-brand-dark text-white rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* ── Bottom Row: Navigation Links ── */}
        <nav className="hidden md:flex items-center justify-center space-x-10 h-14 relative">
          
          <button onClick={() => onNavigate('home')} className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors">
            Home
          </button>
          
          <button className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors">
            All Products
          </button>
          
          <div 
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveMenu('byAge')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors flex items-center gap-1 cursor-default">
              By Age
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {activeMenu === 'byAge' && (
              <div className="absolute top-full left-0 w-48 bg-white shadow-xl border border-gray-100 py-2 z-50">
                {['0-6 Months', '6-12 Months', '1-2 Years', '2-3 Years', '3+ Years'].map(age => (
                  <button key={age} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-dark transition-colors">
                    {age}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div 
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveMenu('byCategory')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors flex items-center gap-1 cursor-default">
              By Category
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {activeMenu === 'byCategory' && (
              <div className="absolute top-full left-0 w-64 bg-white shadow-xl border border-gray-100 py-2 z-50">
                {mainCategories.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">Loading categories...</div>
                ) : (
                  mainCategories.map(mainCat => {
                    const subs = getSubCategories(mainCat._id);
                    return (
                      <div key={mainCat._id} className="group relative">
                        <button className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-dark transition-colors">
                          {mainCat.name}
                          {subs.length > 0 && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" /></svg>
                          )}
                        </button>
                        {/* Nested Dropdown for Subcategories */}
                        {subs.length > 0 && (
                          <div className="absolute top-0 left-full ml-0 w-48 bg-white shadow-xl border border-gray-100 py-2 hidden group-hover:block z-50">
                            {subs.map(subCat => (
                              <button key={subCat._id} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-dark transition-colors">
                                {subCat.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div 
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveMenu('buyInBulk')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors flex items-center gap-1 cursor-default">
              Buy In Bulk
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {activeMenu === 'buyInBulk' && (
              <div className="absolute top-full left-0 w-48 bg-white shadow-xl border border-gray-100 py-2 z-50">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-dark transition-colors">Wholesale Inquiry</button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-dark transition-colors">Corporate Gifting</button>
              </div>
            )}
          </div>

          <button className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors">
            Gift Kit & Card
          </button>
          
          <button className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors">
            Loyalty Rewards
          </button>
          
          <button className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors">
            Blog
          </button>
          
          <button className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors">
            Contact Us
          </button>

        </nav>

      </div>

      {/* Overlay to close profile dropdown on outside click */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      )}
    </header>
  );
}
