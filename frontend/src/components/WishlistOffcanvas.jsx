import React from 'react';

export default function WishlistOffcanvas({ isOpen, onClose, wishlistItems, onRemove, onMoveToCart }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Offcanvas Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-wood-medium/20">
          <h2 className="font-serif text-2xl font-bold text-wood-dark">Wishlist</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-wood-dark/60 hover:text-wood-dark hover:bg-wood-light/40 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Wishlist Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-wood-dark/50 space-y-3">
              <span className="text-4xl">❤️</span>
              <p>Your wishlist is empty.</p>
            </div>
          ) : (
            wishlistItems.map((item, index) => (
              <div key={index} className="flex gap-4 p-3 bg-wood-cream/30 rounded-2xl border border-wood-medium/10">
                <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-wood-medium/10 flex items-center justify-center">
                  <img 
                    src={item.images?.[0] || item.image || '/wood-placeholder.png'} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display='none'; }}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-wood-dark line-clamp-2">{item.name}</h4>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="font-serif font-bold text-wood-dark">
                      ${item.price?.toFixed(2)}
                    </span>
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={() => onMoveToCart(item, index)}
                        className="text-[10px] bg-wood-dark text-white px-2 py-1 rounded hover:bg-wood-medium transition-colors uppercase tracking-wide font-bold"
                      >
                        Move to Cart
                      </button>
                      <button 
                        onClick={() => onRemove(index)}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wide"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
