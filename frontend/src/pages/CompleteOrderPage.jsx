import React, { useState, useEffect } from 'react';
import useCartStore from '../store/useCartStore';
import { orderService } from '../api/orderService';
import { authService } from '../api/authService';
import { ArrowLeft, Plus, MapPin, Trash2, CreditCard, Banknote, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { stateDistricts } from '../utils/indiaStates';
import { feeAPI } from '../api/feeService';

export default function CompleteOrderPage({ onNavigate }) {
  const { cartItems, getSubtotal, clearCart } = useCartStore();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState([]);

  const currentUser = authService.getCurrentUser();

  // Form state
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    phone: '',
    landmark: ''
  });

  const availableDistricts = formData.state ? stateDistricts[formData.state] || [] : [];

  useEffect(() => {
    if (cartItems.length === 0) {
      onNavigate('cart');
    }
    // Load saved addresses from localStorage
    const saved = JSON.parse(localStorage.getItem('wooden_toys_addresses') || '[]');
    setSavedAddresses(saved);
    if (saved.length === 0) {
      setIsAddingAddress(true);
    }
    
    // Fetch fees
    const fetchFees = async () => {
      try {
        const data = await feeAPI.getAllFees();
        setFees(data);
      } catch (err) {
        console.error('Error fetching fees', err);
      }
    };
    fetchFees();
  }, [cartItems, onNavigate]);

  const subtotal = getSubtotal();
  
  // Calculate total weight (in kg)
  const totalWeight = cartItems.reduce((acc, item) => {
    let w = parseFloat(item.weight) || 0;
    if (typeof item.weight === 'string' && item.weight.toLowerCase().includes('g') && !item.weight.toLowerCase().includes('kg')) {
      w = w / 1000;
    }
    return acc + (w * item.qty);
  }, 0);

  const currentState = savedAddresses.length > 0 && !isAddingAddress 
    ? savedAddresses[selectedAddressIndex]?.state 
    : formData.state;

  // Calculate dynamic shipping charge
  let shippingCharge = 0; // Default to 0, strictly use configured fees
  let paymentMethodCharge = 0;
  let paymentMethodFeeName = '';
  if (subtotal > 0 && fees.length > 0 && currentState) {
    const matchingFee = fees.find(fee => {
      const isWeightBase = fee.feeCategory?.name?.toLowerCase().includes('weight');
      const isMatchingState = fee.applicationState === currentState || fee.applicationState === 'All';
      const isMatchingPayment = fee.paymentMethod?.name?.toLowerCase() === paymentMethod.toLowerCase();
      return fee.active && isWeightBase && isMatchingState && isMatchingPayment;
    });

    if (matchingFee && matchingFee.weightSlabs && matchingFee.weightSlabs.length > 0) {
      const matchedSlab = matchingFee.weightSlabs.find(slab => totalWeight >= slab.minWeight && totalWeight <= slab.maxWeight);
      if (matchedSlab) {
        if (matchingFee.feeType === 'Percentage') {
          shippingCharge = Math.round(subtotal * (matchedSlab.feeValue / 100));
        } else {
          shippingCharge = matchedSlab.feeValue;
        }
      } else {
        // Dynamic calculation for weights outside configured slabs
        const highestSlab = matchingFee.weightSlabs.reduce((prev, current) => (prev.maxWeight > current.maxWeight) ? prev : current);
        const lowestSlab = matchingFee.weightSlabs.reduce((prev, current) => (prev.minWeight < current.minWeight) ? prev : current);
        
        if (totalWeight > highestSlab.maxWeight) {
          // Extrapolate for higher weights
          if (matchingFee.feeType === 'Percentage') {
            shippingCharge = Math.round(subtotal * (highestSlab.feeValue / 100));
          } else {
            const extraWeight = totalWeight - highestSlab.maxWeight;
            const slabInterval = highestSlab.maxWeight - highestSlab.minWeight || 1; // fallback interval to 1kg if min=max
            const extraIntervals = Math.ceil(extraWeight / slabInterval);
            shippingCharge = highestSlab.feeValue + (extraIntervals * highestSlab.feeValue);
          }
        } else if (totalWeight < lowestSlab.minWeight) {
          // Apply minimum slab fee for lower weights
          shippingCharge = matchingFee.feeType === 'Percentage'
            ? Math.round(subtotal * (lowestSlab.feeValue / 100))
            : lowestSlab.feeValue;
        }
      }
    }

    // Find non-weight based flat fee (like COD charge)
    const matchingFlatFee = fees.find(fee => {
      const isWeightBase = fee.feeCategory?.name?.toLowerCase().includes('weight');
      const isMatchingState = fee.applicationState === currentState || fee.applicationState === 'All';
      const isMatchingPayment = fee.paymentMethod?.name?.toLowerCase() === paymentMethod.toLowerCase();
      return fee.active && !isWeightBase && isMatchingState && isMatchingPayment;
    });

    if (matchingFlatFee && matchingFlatFee.flatFeeValue !== undefined) {
      paymentMethodFeeName = matchingFlatFee.feeName || 'Payment Fee';
      if (matchingFlatFee.feeType === 'Percentage') {
        paymentMethodCharge = Math.round(subtotal * (matchingFlatFee.flatFeeValue / 100));
      } else {
        paymentMethodCharge = matchingFlatFee.flatFeeValue;
      }
    }
  }

  const total = subtotal + shippingCharge + paymentMethodCharge;



  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const finalCity = (formData.state === 'Tamil Nadu' && formData.city === 'Other') ? formData.customCity : formData.city;

    if (!formData.fullName || !formData.address || !finalCity || !formData.state || !formData.pinCode || !formData.phone) {
      return toast.error('Please fill all required fields');
    }
    if (formData.phone.length < 10) {
      return toast.error('Please enter a valid phone number');
    }

    const addressToSave = { ...formData, city: finalCity };
    const updatedAddresses = [...savedAddresses, addressToSave];
    setSavedAddresses(updatedAddresses);
    localStorage.setItem('wooden_toys_addresses', JSON.stringify(updatedAddresses));
    setSelectedAddressIndex(updatedAddresses.length - 1);
    setIsAddingAddress(false);
    toast.success('Address saved!');
  };

  const handleDeleteAddress = (index) => {
    const updated = savedAddresses.filter((_, i) => i !== index);
    setSavedAddresses(updated);
    localStorage.setItem('wooden_toys_addresses', JSON.stringify(updated));
    if (selectedAddressIndex === index) setSelectedAddressIndex(0);
    if (updated.length === 0) setIsAddingAddress(true);
  };

  const handlePlaceOrder = async () => {
    if (savedAddresses.length === 0 && !isAddingAddress) {
      return toast.error('Please add a shipping address');
    }

    const shippingAddress = savedAddresses[selectedAddressIndex];
    if (!shippingAddress) {
      return toast.error('Please select a shipping address');
    }

    try {
      setLoading(true);
      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          qty: item.qty,
          image: item.image,
          price: item.price,
          product: item.product,
          weight: item.weight
        })),
        shippingAddress,
        paymentMethod,
        itemsPrice: subtotal,
        taxPrice: 0,
        shippingPrice: shippingCharge,
        totalPrice: total,
        orderNotes
      };

      const order = await orderService.createOrder(orderData);
      
      toast.success('Order placed successfully!');
      clearCart();
      onNavigate('order-success', order._id);
      
    } catch (error) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-10 max-w-2xl mx-auto">
          <div className="flex items-center text-[#8B5E3C] font-bold">
            <div className="w-8 h-8 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center text-sm shadow-md">1</div>
            <span className="hidden sm:inline ml-2">Cart</span>
          </div>
          <div className="w-10 sm:w-32 h-1 bg-[#8B5E3C] mx-2 sm:mx-4 rounded"></div>
          <div className="flex items-center text-[#8B5E3C] font-bold">
            <div className="w-8 h-8 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center text-sm shadow-md">2</div>
            <span className="hidden sm:inline ml-2">Review</span>
          </div>
          <div className="w-10 sm:w-32 h-1 bg-[#8B5E3C] mx-2 sm:mx-4 rounded"></div>
          <div className="flex items-center text-[#8B5E3C] font-bold">
            <div className="w-8 h-8 rounded-full border-2 border-[#8B5E3C] bg-white flex items-center justify-center text-sm">3</div>
            <span className="hidden sm:inline ml-2">Payment</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => onNavigate('review-order')} className="p-2 bg-white rounded-full text-gray-500 hover:text-[#8B5E3C] shadow-sm transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Order</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column */}
          <div className="lg:w-2/3 space-y-6">
            
            {/* Shipping Details Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E6DFD4]">
              <div className="flex items-center gap-3 mb-6 border-b border-[#E6DFD4] pb-4">
                <div className="w-10 h-10 bg-[#8B5E3C]/10 rounded-full flex items-center justify-center text-[#8B5E3C]">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Shipping Details</h2>
              </div>

              {savedAddresses.length > 0 && !isAddingAddress && (
                <div className="space-y-4 mb-4">
                  {savedAddresses.map((addr, idx) => (
                    <div key={idx} className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedAddressIndex === idx ? 'border-[#8B5E3C] bg-[#F8F4EC]/50' : 'border-[#E6DFD4] hover:border-[#8B5E3C]/50'}`} onClick={() => setSelectedAddressIndex(idx)}>
                      {selectedAddressIndex === idx && (
                        <div className="absolute top-4 right-4 text-[#8B5E3C]">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      <div className="pr-8">
                        <p className="font-bold text-gray-900">{addr.fullName} <span className="font-normal text-gray-500 ml-2">{addr.phone}</span></p>
                        <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pinCode}</p>
                        {addr.landmark && <p className="text-xs text-gray-500 mt-1">Landmark: {addr.landmark}</p>}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteAddress(idx); }}
                        className="absolute bottom-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setIsAddingAddress(true)} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#E6DFD4] rounded-2xl text-[#8B5E3C] font-semibold hover:border-[#8B5E3C] hover:bg-[#F8F4EC]/30 transition-all">
                    <Plus className="w-5 h-5" /> Add New Address
                  </button>
                </div>
              )}

              {isAddingAddress && (
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">House / Street Address *</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">City / District *</label>
                      {formData.state === 'Tamil Nadu' ? (
                        <>
                          <select name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 bg-white" required>
                            <option value="">Select District</option>
                            {availableDistricts.map(district => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                            <option value="Other">Other (Type manually)</option>
                          </select>
                          {formData.city === 'Other' && (
                            <input type="text" name="customCity" value={formData.customCity || ''} onChange={handleInputChange} placeholder="Type your district" className="mt-3 w-full px-4 py-2.5 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30" required />
                          )}
                        </>
                      ) : (
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Enter your district" className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30" required />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                      <select name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 bg-white" required>
                        <option value="">Select State</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Other State">Other State</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode *</label>
                      <input type="text" name="pinCode" value={formData.pinCode} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Landmark (Optional)</label>
                      <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30" />
                    </div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    {savedAddresses.length > 0 && (
                      <button type="button" onClick={() => setIsAddingAddress(false)} className="px-6 py-2.5 rounded-xl font-semibold border border-[#E6DFD4] text-gray-600 hover:bg-gray-50">Cancel</button>
                    )}
                    <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-[#8B5E3C] text-white hover:bg-[#7a5234] flex-1">Save & Use This Address</button>
                  </div>
                </form>
              )}
            </div>

            {/* Payment Method Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E6DFD4]">
              <div className="flex items-center gap-3 mb-6 border-b border-[#E6DFD4] pb-4">
                <div className="w-10 h-10 bg-[#8B5E3C]/10 rounded-full flex items-center justify-center text-[#8B5E3C]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${paymentMethod === 'COD' ? 'border-[#8B5E3C] bg-[#F8F4EC]/50' : 'border-[#E6DFD4] hover:border-[#8B5E3C]/50'}`}>
                  <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-[#8B5E3C] focus:ring-[#8B5E3C]" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-800">Cash on Delivery</span>
                  </div>
                </label>

                <label className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${paymentMethod === 'Cashfree' ? 'border-[#8B5E3C] bg-[#F8F4EC]/50' : 'border-[#E6DFD4] hover:border-[#8B5E3C]/50'}`}>
                  <input type="radio" name="paymentMethod" value="Cashfree" checked={paymentMethod === 'Cashfree'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-[#8B5E3C] focus:ring-[#8B5E3C]" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 block">Pay Online</span>
                      <span className="text-xs text-gray-500">via Cashfree Gateway</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Notes Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E6DFD4]">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Order Notes (Optional)</h2>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Notes about your order, e.g. special notes for delivery."
                className="w-full px-4 py-3 rounded-xl border border-[#E6DFD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 min-h-[100px] resize-y"
              />
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E6DFD4] sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Order</h2>
              
              <div className="space-y-4 mb-6 border-b border-[#E6DFD4] pb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#F8F4EC] rounded-xl overflow-hidden shrink-0 relative">
                      {item.image ? (
                         <img src={item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full bg-gray-200"></div>
                      )}
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">{item.qty}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.weight}</p>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm mb-6 border-b border-[#E6DFD4] pb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="text-gray-900 font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Weight Charge ({totalWeight} kg)</span>
                  <span className="text-gray-900 font-medium">₹{shippingCharge.toLocaleString()}</span>
                </div>
                {paymentMethodCharge > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{paymentMethodFeeName}</span>
                    <span className="text-gray-900 font-medium">₹{paymentMethodCharge.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-lg font-bold text-gray-900">Total To Pay</span>
                <span className="text-3xl font-black text-[#8B5E3C]">₹{total.toLocaleString()}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading || (savedAddresses.length === 0 && !isAddingAddress)}
                className="w-full flex items-center justify-center gap-2 bg-[#8B5E3C] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#7a5234] transition-colors shadow-md shadow-[#8B5E3C]/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Place Order'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
