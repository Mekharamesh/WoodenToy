import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import { authService } from './api/authService';
import CartOffcanvas from './components/CartOffcanvas';
import WishlistOffcanvas from './components/WishlistOffcanvas';
import CartPage from './pages/CartPage';
import ReviewOrderPage from './pages/ReviewOrderPage';
import CompleteOrderPage from './pages/CompleteOrderPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import useCartStore from './store/useCartStore';
import { Toaster } from 'react-hot-toast';
import CashfreeCallbackPage from './pages/CashfreeCallbackPage';

export default function App() {
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'cashfree-callback') {
      return 'cashfree-callback';
    }

    const savedView = localStorage.getItem('currentView') || 'home';
    const savedUser = authService.getCurrentUser();
    // If the saved view requires auth but there is no user, reset to home
    const authRequiredViews = ['admin', 'profile', 'review-order', 'complete-order', 'order-success', 'order-history', 'cashfree-callback'];
    if (authRequiredViews.includes(savedView) && !savedUser) {
      localStorage.setItem('currentView', 'home');
      return 'home';
    }
    return savedView;
  }); // 'home' | 'login' | 'profile' | 'product-detail' | 'admin'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [user, setUser] = useState(() => authService.getCurrentUser());
  
  // Profile query state
  const [profileData, setProfileData] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Cart state from store
  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const handleAddToCart = (product) => {
    const addedQuantity = product.quantity || 1;
    // Map to store format to ensure consistency if needed, but addToCart handles product mapping
    addToCart(product, addedQuantity);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (index, delta) => {
    // CartOffcanvas uses array index, but useCartStore uses productId
    const item = cartItems[index];
    if (!item) return;
    const newQuantity = item.qty + delta;
    if (newQuantity > 0) {
      updateQuantity(item.product, newQuantity);
    } else {
      removeFromCart(item.product);
    }
  };

  const handleRemoveFromCart = (index) => {
    const item = cartItems[index];
    if (item) {
      removeFromCart(item.product);
    }
  };

  const handleAddToWishlist = (product) => {
    const exists = wishlistItems.some(item => {
      const isSameProduct = (item._id && product._id && item._id === product._id) || 
                            (item.id && product.id && item.id === product.id);
      if (!isSameProduct) return false;
      const itemVariantId = item.selectedVariant?._id || item.selectedVariant?.id;
      const productVariantId = product.selectedVariant?._id || product.selectedVariant?.id;
      return itemVariantId === productVariantId;
    });
    if (!exists) {
      setWishlistItems([...wishlistItems, product]);
    }
    setIsWishlistOpen(true);
  };

  const handleRemoveFromWishlist = (index) => {
    const newWishlist = [...wishlistItems];
    newWishlist.splice(index, 1);
    setWishlistItems(newWishlist);
  };

  const handleMoveToCart = (item, index) => {
    handleAddToCart(item);
    handleRemoveFromWishlist(index);
  };

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    handleNavigate('cart');
  };

  // Removed redundant load session on mount since it's now initialized in useState

  const handleAuthSuccess = (data) => {
    setUser({
      id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      isStaff: data.isStaff
    });
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setView('home');
    localStorage.removeItem('currentView');
    localStorage.removeItem('user');
    setProfileData(null);
  };

  const handleNavigate = (targetView, payload = null) => {
    const activeUser = (targetView === 'admin' && payload && payload.role) ? payload : user || authService.getCurrentUser();
    if (targetView === 'admin' && (!activeUser || (activeUser.role?.toLowerCase() !== 'admin' && !activeUser.isStaff))) {
      alert("Unauthorized access");
      return;
    }
    setView(targetView);
    localStorage.setItem('currentView', targetView);
    if (targetView === 'product-detail' || targetView === 'order-success' || targetView === 'cashfree-callback') {
      setSelectedProduct(payload);
    } else {
      setSelectedProduct(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch data from backend protected profile endpoint to test authentication flow
  useEffect(() => {
    if (view === 'profile' && user) {
      setProfileLoading(true);
      setProfileError('');
      setProfileData(null);
      
      authService.getProfile()
        .then(data => {
          setProfileData(data);
        })
        .catch(err => {
          setProfileError(err.message || 'Failed to fetch protected profile data.');
        })
        .finally(() => {
          setProfileLoading(false);
        });
    }
  }, [view, user]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-beige/10">
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      
      {/* Header component */}
      {view !== 'admin' && view !== 'login' && (
        <Header 
          user={user} 
          onLogout={handleLogout} 
          onNavigate={handleNavigate}
          cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          wishlistCount={wishlistItems.length}
          onOpenWishlist={() => setIsWishlistOpen(true)}
        />
      )}

      {/* Cart Offcanvas */}
      <CartOffcanvas 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckoutClick}
      />

      {/* Wishlist Offcanvas */}
      <WishlistOffcanvas 
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemove={handleRemoveFromWishlist}
        onMoveToCart={handleMoveToCart}
      />

      {/* Main Pages content */}
      <main className="flex-grow">
        
        {view === 'home' && (
          <Home 
            user={user} 
            onNavigate={handleNavigate} 
            onAddToCart={handleAddToCart} 
            onAddToWishlist={handleAddToWishlist} 
          />
        )}

        {view === 'product-detail' && (
          <ProductDetails
            product={selectedProduct}
            user={user}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
          />
        )}

        {view === 'login' && (
          <Login onAuthSuccess={handleAuthSuccess} onNavigate={handleNavigate} />
        )}

        {view === 'admin' && (user?.role?.toLowerCase() === 'admin' || user?.isStaff) ? (
          <AdminDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
        ) : view === 'admin' ? (
          <div className="p-10 text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Blocked or Debugging Info</h1>
            <pre className="text-left bg-gray-100 p-4 mt-4 inline-block text-sm">
              {JSON.stringify({ user, role: user?.role, isStaff: user?.isStaff, rawRole: user?.role?.toLowerCase() }, null, 2)}
            </pre>
            <button onClick={() => { localStorage.clear(); window.location.href = '/?view=login'; }} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Reset & Login</button>
          </div>
        ) : null}

        {view === 'cart' && (
          <CartPage onNavigate={handleNavigate} />
        )}

        {view === 'review-order' && user && (
          <ReviewOrderPage onNavigate={handleNavigate} />
        )}

        {view === 'complete-order' && user && (
          <CompleteOrderPage onNavigate={handleNavigate} />
        )}

        {view === 'order-success' && user && (
          <OrderSuccessPage orderId={selectedProduct} onNavigate={handleNavigate} />
        )}

        {view === 'cashfree-callback' && user && (
          <CashfreeCallbackPage onNavigate={handleNavigate} />
        )}

        {view === 'order-history' && user && (
          <OrderHistoryPage onNavigate={handleNavigate} />
        )}

        {view === 'profile' && user && (
          <section className="py-20 max-w-xl mx-auto px-6">
            <div className="bg-white border border-brand-medium/20 rounded-3xl p-8 shadow-2xl space-y-6 text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2.5 bg-brand-dark"></div>
              
              <h2 className="font-serif text-3xl font-bold text-brand-dark">User Account</h2>
              <div className="w-12 h-1 bg-brand-medium rounded-full"></div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-brand-medium/20 border border-brand-medium text-brand-dark text-xl font-bold rounded-full flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-brand-dark">{user.name}</h3>
                    <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-brand-green/35 text-brand-dark rounded-full capitalize">
                      {user.role} Account
                    </span>
                  </div>
                </div>

                <div className="border-t border-brand-medium/10 pt-4 space-y-2.5 text-sm text-brand-dark">
                  <p><strong>Email Address:</strong> {user.email}</p>
                  <p><strong>Account ID:</strong> {user.id}</p>
                </div>

                {/* API Request Token Verification container */}
                <div className="bg-brand-beige border border-brand-medium/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-brand-medium tracking-wider">ðŸ”’ Protected Backend Profile</h4>
                    <span className="text-[10px] bg-brand-dark text-brand-beige px-2 py-0.5 rounded font-mono">Bearer Token</span>
                  </div>

                  {profileLoading && (
                    <p className="text-xs text-gray-500 italic">Querying `/api/auth/profile` with JWT auth headers...</p>
                  )}

                  {profileError && (
                    <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg text-left">
                      <p className="font-bold">Authorization Failure</p>
                      <p>{profileError}</p>
                    </div>
                  )}

                  {profileData && (
                    <div className="space-y-2">
                      <p className="text-xs text-green-700 font-bold">âœ”ï¸ Access Authorized! Response:</p>
                      <pre className="bg-white/70 border border-brand-medium/10 p-2.5 rounded text-[10px] font-mono overflow-x-auto text-brand-dark max-h-32">
                        {JSON.stringify(profileData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => handleNavigate('home')}
                  className="bg-brand-light hover:bg-brand-medium/20 text-brand-dark font-bold text-xs px-5 py-2.5 rounded-xl border border-brand-medium/20 cursor-pointer"
                >
                  Return Home
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Sign Out
                </button>
              </div>

            </div>
          </section>
        )}

      </main>

      {/* Footer component */}
      {view !== 'admin' && view !== 'login' && (
        <Footer />
      )}

    </div>
  );
}


