import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],

      // Add item to cart
      addToCart: (product, qty = 1) => {
        const item = {
          product: product._id,
          name: product.name,
          image: product.images?.[0]?.url || product.image,
          price: product.price,
          weight: product.weight || 'N/A', // If you have a weight field, else mock/default
          qty,
          variant: product.selectedVariant?._id || product.selectedVariant?.id || null,
        };

        set((state) => {
          const existItem = state.cartItems.find(
            (x) => x.product === item.product && x.variant === item.variant
          );

          if (existItem) {
            return {
              cartItems: state.cartItems.map((x) =>
                x.product === existItem.product && x.variant === existItem.variant ? item : x
              ),
            };
          } else {
            return {
              cartItems: [...state.cartItems, item],
            };
          }
        });
      },

      // Remove item from cart
      removeFromCart: (productId) => {
        set((state) => ({
          cartItems: state.cartItems.filter((x) => x.product !== productId),
        }));
      },

      // Update quantity of specific item
      updateQuantity: (productId, qty) => {
        set((state) => ({
          cartItems: state.cartItems.map((x) =>
            x.product === productId ? { ...x, qty: Number(qty) } : x
          ),
        }));
      },

      // Clear all items
      clearCart: () => {
        set({ cartItems: [] });
      },

      // Calculations
      getSubtotal: () => {
        return get().cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
      },

      getTotalItems: () => {
        return get().cartItems.reduce((acc, item) => acc + item.qty, 0);
      },
    }),
    {
      name: 'wooden-toys-cart', // unique name for localStorage key
    }
  )
);

export default useCartStore;
