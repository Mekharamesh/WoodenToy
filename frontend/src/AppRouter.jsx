import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CartPage from './pages/CartPage';
import ReviewOrderPage from './pages/ReviewOrderPage';
import CompleteOrderPage from './pages/CompleteOrderPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import CashfreeCallbackPage from './pages/CashfreeCallbackPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import WishlistPage from './pages/WishlistPage';
import { authService } from './api/authService';
import CartOffcanvas from './components/CartOffcanvas';
import WishlistOffcanvas from './components/WishlistOffcanvas';
import useCartStore from './store/useCartStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children, user, requiredRole }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && user.role?.toLowerCase() !== requiredRole.toLowerCase() && !user.isStaff) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-4">You don't have permission to access this page.</p>
      </div>
    );
  }
  return children;
};

// Layout Wrapper for hiding header/footer on certain pages
const PageLayout = ({ children, hideHeaderFooter }) => (
  <div className="flex flex-col min-h-screen bg-brand-beige/10">
    {!hideHeaderFooter && <Header />}
    <main className="flex-grow">
      {children}
    </main>
    {!hideHeaderFooter && <Footer />}
  </div>
);

// Wrapper for Admin Layout (different from customer layout)
const AdminLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-brand-beige/10">
    <main className="flex-grow">
      {children}
    </main>
  </div>
);

export default function AppRouter() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [profileData, setProfileData] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Cart state from store
  const { cartItems, addToCart, updateQuantity, removeFromCart, hydrateCartFromBackend } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Navigation handler for backward compatibility
  const handleNavigate = (path, payload = null) => {
    if (payload && typeof payload === 'object') {
      navigate(path, { state: { data: payload } });
    } else if (payload) {
      navigate(`${path}/${payload}`);
    } else {
      navigate(path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (data) => {
    setUser({
      id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      isStaff: data.isStaff
    });
    navigate('/');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setProfileData(null);
    navigate('/');
  };

  const handleAddToCart = (product) => {
    const addedQuantity = product.quantity || 1;
    addToCart(product, addedQuantity);
    setIsCartOpen(true);
  };

  const handleBuyNow = (product) => {
    const addedQuantity = product.quantity || 1;
    addToCart(product, addedQuantity);
    navigate('/review-order');
  };

  const handleUpdateQuantity = (index, delta) => {
    const item = cartItems[index];
    if (!item) return;
    const newQuantity = item.qty + delta;
    if (newQuantity > 0) {
      updateQuantity(item.product, newQuantity, item.variant);
    } else {
      removeFromCart(item.product, item.variant);
    }
  };

  const handleRemoveFromCart = (index) => {
    const item = cartItems[index];
    if (item) {
      removeFromCart(item.product, item.variant);
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
    navigate('/review-order');
  };

  useEffect(() => {
    if (user) {
      hydrateCartFromBackend();
    }
  }, [user, hydrateCartFromBackend]);

  const handleProfileUpdated = (updatedUser) => {
    setUser((current) => ({
      ...current,
      id: updatedUser._id || updatedUser.id || current?.id,
      name: updatedUser.name || current?.name,
      email: updatedUser.email || current?.email,
      role: updatedUser.role || current?.role,
      isStaff: updatedUser.isStaff ?? current?.isStaff,
    }));
    setProfileData((current) => ({
      ...(current || {}),
      user: updatedUser,
    }));
  };

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

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

      {/* Routes */}
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PageLayout>
              <Header
                user={user}
                onLogout={handleLogout}
                onNavigate={handleNavigate}
                cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                onOpenCart={() => setIsCartOpen(true)}
                wishlistCount={wishlistItems.length}
                onOpenWishlist={() => setIsWishlistOpen(true)}
              />
              <Home
                user={user}
                onNavigate={handleNavigate}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
              />
            </PageLayout>
          }
        />

        <Route
          path="/product/:id"
          element={
            <PageLayout>
              <Header
                user={user}
                onLogout={handleLogout}
                onNavigate={handleNavigate}
                cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                onOpenCart={() => setIsCartOpen(true)}
                wishlistCount={wishlistItems.length}
                onOpenWishlist={() => setIsWishlistOpen(true)}
              />
              <ProductDetails
                user={user}
                onNavigate={handleNavigate}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onAddToWishlist={handleAddToWishlist}
              />
            </PageLayout>
          }
        />

        <Route
          path="/login"
          element={
            <PageLayout hideHeaderFooter={true}>
              <Login onAuthSuccess={handleAuthSuccess} onNavigate={handleNavigate} />
            </PageLayout>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute user={user}>
              <PageLayout>
                <Header
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                  cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  wishlistCount={wishlistItems.length}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
                <CartPage onNavigate={handleNavigate} />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/review-order"
          element={
            <ProtectedRoute user={user}>
              <PageLayout>
                <Header
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                  cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  wishlistCount={wishlistItems.length}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
                <ReviewOrderPage onNavigate={handleNavigate} />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/complete-order"
          element={
            <ProtectedRoute user={user}>
              <PageLayout>
                <Header
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                  cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  wishlistCount={wishlistItems.length}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
                <CompleteOrderPage onNavigate={handleNavigate} />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-success/:orderId"
          element={
            <ProtectedRoute user={user}>
              <PageLayout>
                <Header
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                  cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  wishlistCount={wishlistItems.length}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
                <OrderSuccessPage onNavigate={handleNavigate} />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-history"
          element={
            <ProtectedRoute user={user}>
              <PageLayout>
                <Header
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                  cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  wishlistCount={wishlistItems.length}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
                <OrderHistoryPage onNavigate={handleNavigate} />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <PageLayout>
                <Header
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                  cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  wishlistCount={wishlistItems.length}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
                <CustomerProfilePage
                  user={user}
                  profileData={profileData}
                  profileLoading={profileLoading}
                  profileError={profileError}
                  onNavigate={handleNavigate}
                  onLogout={handleLogout}
                  onProfileUpdated={handleProfileUpdated}
                  wishlistItems={wishlistItems}
                  onRemoveFromWishlist={handleRemoveFromWishlist}
                  onMoveToCart={handleMoveToCart}
                />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute user={user}>
              <PageLayout>
                <Header
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                  cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  wishlistCount={wishlistItems.length}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
                <WishlistPage
                  wishlistItems={wishlistItems}
                  onRemove={handleRemoveFromWishlist}
                  onMoveToCart={handleMoveToCart}
                  onNavigate={handleNavigate}
                />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashfree-callback"
          element={
            <ProtectedRoute user={user}>
              <PageLayout>
                <Header
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                  cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  wishlistCount={wishlistItems.length}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
                <CashfreeCallbackPage onNavigate={handleNavigate} />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminLayout>
                <AdminDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all - 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
