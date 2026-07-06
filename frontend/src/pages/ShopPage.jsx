import React, { useState, useEffect } from 'react';
import { catalogService } from '../api/catalogService';
import { productV2API } from '../api/catalogV2Service';

export default function ShopPage({ user, onNavigate, onAddToCart, onAddToWishlist, initialFilters }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(initialFilters?.category || '');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(initialFilters?.ageGroup || '');
  
  useEffect(() => {
    // If the navigation payload changes, update our local filters
    if (initialFilters) {
      if (initialFilters.category !== undefined) setSelectedCategory(initialFilters.category);
      if (initialFilters.ageGroup !== undefined) setSelectedAgeGroup(initialFilters.ageGroup);
    }
  }, [initialFilters]);

  useEffect(() => {
    // Fetch categories for the sidebar
    catalogService.getCategories()
      .then(cats => setCategories(cats.filter(c => c.isActive && !c.isDeleted)))
      .catch(err => console.error("Failed to load categories for shop", err));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    // Fetch products based on filters
    const fetchParams = { isActive: 'true' };
    if (selectedCategory) fetchParams.category = selectedCategory;
    if (selectedAgeGroup) fetchParams.ageGroup = selectedAgeGroup;

    productV2API.getAll(fetchParams)
      .then(data => {
        const list = data.products || data.data || [];
        // Optional client-side filtering if backend doesn't support these fully yet
        let filteredList = list;
        if (selectedCategory) {
          filteredList = filteredList.filter(p => p.category === selectedCategory || p.subCategory === selectedCategory || (p.category && p.category._id === selectedCategory) || (p.subCategory && p.subCategory._id === selectedCategory));
        }
        if (selectedAgeGroup) {
          filteredList = filteredList.filter(p => p.ageGroup && p.ageGroup.includes(selectedAgeGroup));
        }
        setProducts(filteredList);
      })
      .catch(err => console.error("Failed to load shop products", err))
      .finally(() => setIsLoading(false));
  }, [selectedCategory, selectedAgeGroup]);

  return (
    <div className="bg-[#FAF8F5] min-h-screen font-sans">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold font-serif text-[#141225] mb-3">
            {selectedCategory ? 'Category Collection' : selectedAgeGroup ? `Toys for ${selectedAgeGroup}` : 'All Products'}
          </h1>
          <p className="text-[#6D625C] max-w-2xl mx-auto">
            Discover our beautiful range of sustainable, educational wooden toys designed to inspire imagination and creativity.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-8">
            <div>
              <h3 className="text-lg font-bold text-[#141225] mb-4 border-b border-[#E9DED3] pb-2">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setSelectedCategory('')}
                    className={`text-sm hover:text-[#8B5E3C] transition-colors ${!selectedCategory ? 'font-bold text-[#8B5E3C]' : 'text-[#4A403B]'}`}
                  >
                    All Categories
                  </button>
                </li>
                {categories.filter(c => !c.parentCategory).map(cat => (
                  <li key={cat._id}>
                    <button 
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`text-sm hover:text-[#8B5E3C] transition-colors ${selectedCategory === cat._id ? 'font-bold text-[#8B5E3C]' : 'text-[#4A403B]'}`}
                    >
                      {cat.name}
                    </button>
                    {/* Subcategories could go here */}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#141225] mb-4 border-b border-[#E9DED3] pb-2">Age Group</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setSelectedAgeGroup('')}
                    className={`text-sm hover:text-[#8B5E3C] transition-colors ${!selectedAgeGroup ? 'font-bold text-[#8B5E3C]' : 'text-[#4A403B]'}`}
                  >
                    All Ages
                  </button>
                </li>
                {['0-6 Months', '6-12 Months', '1-2 Years', '2-3 Years', '3+ Years'].map(age => (
                  <li key={age}>
                    <button 
                      onClick={() => setSelectedAgeGroup(age)}
                      className={`text-sm hover:text-[#8B5E3C] transition-colors ${selectedAgeGroup === age ? 'font-bold text-[#8B5E3C]' : 'text-[#4A403B]'}`}
                    >
                      {age}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-64 text-[#6D625C]">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-xl font-bold text-[#141225] mb-2">No products found</p>
                <p className="text-[#6D625C]">Try adjusting your filters to see more results.</p>
                <button 
                  onClick={() => { setSelectedCategory(''); setSelectedAgeGroup(''); }}
                  className="mt-6 px-6 py-2 bg-[#8B5E3C] text-white rounded-full font-bold text-sm hover:bg-[#724C31] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product._id} className="group relative bg-white rounded-2xl overflow-hidden border border-[#E9DED3] hover:shadow-xl transition-all duration-300">
                    <div 
                      className="aspect-square bg-[#F5F5F5] overflow-hidden cursor-pointer"
                      onClick={() => onNavigate('product-detail', product)}
                    >
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0].url || product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); onAddToWishlist(product); }}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#4A403B] hover:text-red-500 transition-colors shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="text-[10px] font-bold text-[#8A817C] uppercase tracking-wider mb-2">
                        {product.ageGroup && product.ageGroup[0]} {product.ageGroup?.length > 1 && `+${product.ageGroup.length-1}`}
                      </div>
                      <h3 
                        className="text-base font-bold text-[#141225] leading-tight mb-2 cursor-pointer hover:text-[#8B5E3C] transition-colors line-clamp-2 min-h-[40px]"
                        onClick={() => onNavigate('product-detail', product)}
                      >
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        ))}
                        <span className="text-xs text-[#8A817C] ml-1">(12)</span>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-[#141225]">${(product.price || 0).toFixed(2)}</span>
                        <button 
                          onClick={() => onAddToCart(product)}
                          className="w-10 h-10 rounded-full bg-[#FAF4EF] text-[#8B5E3C] flex items-center justify-center hover:bg-[#8B5E3C] hover:text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
