import React, { useState } from 'react';

export default function Header({ user, onLogout, onNavigate, cartCount, onOpenCart, wishlistCount, onOpenWishlist }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* ── Logo ── */}
          <button
            onClick={() => onNavigate('home')}
            className="flex-shrink-0 font-serif text-2xl font-bold tracking-tight text-brand-dark cursor-pointer"
          >
            WoodenToys
          </button>

          {/* ── Center Navigation ── */}
          <nav className="hidden md:flex items-center space-x-10">
            <a href="#collections" className="text-xs font-medium text-brand-medium hover:text-brand-dark transition-colors tracking-wide uppercase">
              Collections
            </a>
            <a href="#trending" className="text-xs font-medium text-brand-medium hover:text-brand-dark transition-colors tracking-wide uppercase">
              Trending
            </a>
            <a href="#blog" className="text-xs font-medium text-brand-medium hover:text-brand-dark transition-colors tracking-wide uppercase">
              Journal
            </a>
          </nav>

          {/* ── Right: Search + Icons + Auth ── */}
          <div className="flex items-center space-x-6">

            {/* Search */}
            <div className="relative hidden lg:block">
              <input
                type="text"
                placeholder="Search..."
                className="w-48 bg-gray-50 border-none rounded-none py-2 pl-4 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-gray-200 text-brand-dark placeholder-gray-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
            </div>

            {/* Auth / Profile */}
            <div className="relative">
              <button
                onClick={() => user ? setDropdownOpen(!dropdownOpen) : onNavigate('login')}
                className="text-brand-dark hover:text-gray-500 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </button>

              {/* Dropdown */}
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
              className="relative text-brand-dark hover:text-gray-500 transition-colors cursor-pointer flex items-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 text-[9px] font-bold bg-brand-dark text-white rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button 
              onClick={onOpenCart}
              className="relative text-brand-dark hover:text-gray-500 transition-colors cursor-pointer flex items-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span className="absolute -top-1.5 -right-2 w-4 h-4 text-[9px] font-bold bg-brand-dark text-white rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* Overlay to close dropdown on outside click */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      )}
    </header>
  );
}
