import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],

      // Add item to cart
      addToCart: (product, qty = 1) => {
        const variantPrice = product.selectedVariant?.basePrice ?? product.selectedVariant?.price;
        const finalPrice = variantPrice != null ? variantPrice : product.price;

        let finalImage = product.images?.[0]?.url || product.image;
        if (product.selectedVariant?.images?.length > 0) {
          finalImage = product.selectedVariant.images[0]?.url || product.selectedVariant.images[0];
        } else if (product.selectedVariant?.image) {
          finalImage = product.selectedVariant.image;
        }

        const variantOptions = product.selectedVariant?.options
          ?.map(opt => `${opt.attribute?.name || opt.attributeName || 'Option'}: ${opt.value}`)
          ?.join(', ');

        const item = {
          product: product._id,
          name: product.name,
          image: finalImage,
          price: finalPrice,
          weight: product.selectedVariant?.weight || product.shippingWeight || product.weight || product.additionalInfo?.find(info => info.key?.toLowerCase() === 'weight')?.value || '',
          qty,
          variant: product.selectedVariant?._id || product.selectedVariant?.id || null,
          variantOptions: variantOptions || null,
        };

        set((state) => {
          const existItem = state.cartItems.find(
            (x) => x.product === item.product && x.variant === item.variant
          );

          if (existItem) {
            return {
              cartItems: state.cartItems.map((x) =>
                x.product === existItem.product && x.variant === existItem.variant 
                  ? { ...item, qty: x.qty + qty } 
                  : x
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
