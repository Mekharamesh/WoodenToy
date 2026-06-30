import React, { useState, useEffect } from 'react';
import { catalogService } from '../api/catalogService';

export default function AdminDashboard({ user, onNavigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' | 'catalog' | 'products'
  const [catalogSubTab, setCatalogSubTab] = useState('categories'); // 'categories' | 'subcategories' | etc.
  const [productSubTab, setProductSubTab] = useState('list'); // 'list' | 'add'
  const [categorySubTab, setCategorySubTab] = useState('list'); // 'list' | 'add' | 'edit'

  // Form Fields for Add/Edit Category
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [catBrand, setCatBrand] = useState('WoodenToys');
  const [catName, setCatName] = useState('');
  const [catSubCategories, setCatSubCategories] = useState('');
  const [catAvailableAges, setCatAvailableAges] = useState('');
  const [catAvailableColors, setCatAvailableColors] = useState('');
  const [catAvailableWoodTypes, setCatAvailableWoodTypes] = useState('');
  const [catDescription, setCatDescription] = useState('');
  
  // Hidden fields to keep backend happy
  const [catImage, setCatImage] = useState('');
  const [catDisplayOrder, setCatDisplayOrder] = useState('1');
  const [catIsActive, setCatIsActive] = useState(true);
  const [catSeoTitle, setCatSeoTitle] = useState('');
  const [catSeoDescription, setCatSeoDescription] = useState('');

  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Form Fields for Add Product
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('10');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
  const [selectedAgeColors, setSelectedAgeColors] = useState({});
  const [selectedWeights, setSelectedWeights] = useState([]);
  const [selectedWoodType, setSelectedWoodType] = useState('Beech Wood');
  const [variantData, setVariantData] = useState({}); // { 'age-color-weight': { price: 0, basePrice: 0, stock: 0 } }
  const [photos, setPhotos] = useState([]);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');

  // Classification Options
  const ageGroupOptions = ['0-2 Years', '2-4 Years', '4-6 Years', '6+ Years'];
  const colorOptions = ['Red', 'Blue', 'Green', 'Yellow', 'Natural Wood', 'Multicolor', 'Pastel'];
  const weightOptions = ['250gm', '500gm', '1kg', '2kg'];
  const woodTypeOptions = ['Beech Wood', 'Pine Wood', 'Oak Wood', 'Maple Wood', 'Rubberwood', 'Birch Wood'];


  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = () => {
    // Fetch products
    catalogService.getProducts()
      .then(data => {
        if (data) {
          setProducts(data);
        }
      })
      .catch(err => console.error("Failed to load products in admin", err));

    // Fetch categories
    catalogService.getCategories()
      .then(data => {
        if (data) {
          setCategories(data);
          const topLevel = data.filter(c => !c.parentCategory);
          if (topLevel.length > 0 && !selectedCategory) {
            setSelectedCategory(topLevel[0]._id);
          }
        }
      })
      .catch(err => console.error("Failed to load categories in admin", err));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected subcategory option when main category changes
  useEffect(() => {
    const selectedCategoryObj = categories.find(c => c._id === selectedCategory);
    const subcats = selectedCategoryObj?.subCategoriesList || [];
    if (subcats.length > 0) {
      setSelectedSubCategory(subcats[0]);
    } else {
      setSelectedSubCategory('');
    }
  }, [selectedCategory, categories]);

  // Handle local image file upload & convert to Base64
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = null;
  };

  // Add photo via URL
  const handleAddPhotoUrl = () => {
    if (tempPhotoUrl.trim()) {
      setPhotos(prev => [...prev, tempPhotoUrl.trim()]);
      setTempPhotoUrl('');
    }
  };

  // Move photo position (left/right reordering)
  const movePhoto = (index, direction) => {
    const newPhotos = [...photos];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < photos.length) {
      const temp = newPhotos[index];
      newPhotos[index] = newPhotos[targetIndex];
      newPhotos[targetIndex] = temp;
      setPhotos(newPhotos);
    }
  };

  // Delete photo
  const deletePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Helper to toggle checkbox values
  const toggleSelection = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter(item => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  // Derive variant matrix combinations
  const generateVariants = () => {
    let combinations = [];
    if (selectedAgeGroups.length === 0 || selectedWeights.length === 0) return combinations;
    
    selectedAgeGroups.forEach(age => {
      const colorsForAge = selectedAgeColors[age] || [];
      if (colorsForAge.length === 0) return;
      
      colorsForAge.forEach(color => {
        selectedWeights.forEach(weight => {
          const key = `${age}-${color}-${weight}`;
          combinations.push({ ageGroup: age, color, weight, key });
        });
      });
    });
    return combinations;
  };
  const activeVariants = generateVariants();

  // Full Category Management Handlers
  };
  const activeVariants = generateVariants();

  // Full Category Management Handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = {
        brand: catBrand.trim() || 'WoodenToys',
        name: catName.trim(),
        slug,
        description: catDescription.trim(),
        subCategoriesList: catSubCategories.split(',').map(s => s.trim()).filter(Boolean),
        availableAges: catAvailableAges.split(',').map(s => s.trim()).filter(Boolean),
        availableColors: catAvailableColors.split(',').map(s => s.trim()).filter(Boolean),
        availableWoodTypes: catAvailableWoodTypes.split(',').map(s => s.trim()).filter(Boolean),
        image: catImage.trim(),
        displayOrder: parseInt(catDisplayOrder, 10) || 1,
        isActive: catIsActive,
        seoTitle: catSeoTitle.trim(),
        seoDescription: catSeoDescription.trim()
      };

      if (editCategoryId) {
        await catalogService.updateCategory(editCategoryId, payload);
        setSuccessMsg('Category updated successfully!');
      } else {
        await catalogService.createCategory(payload);
        setSuccessMsg('Category created successfully!');
      }

      // Reload categories list
      const cats = await catalogService.getCategories();
      setCategories(cats);
      
      // Reset form and switch tab
      setCatBrand('WoodenToys');
      setCatName('');
      setCatSubCategories('');
      setCatAvailableAges('');
      setCatAvailableColors('');
      setCatAvailableWoodTypes('');
      setCatDescription('');
      setCatImage('');
      setCatDisplayOrder('1');
      setCatIsActive(true);
      setCatSeoTitle('');
      setCatSeoDescription('');
      setEditCategoryId(null);
      
      setTimeout(() => {
        setCategorySubTab('list');
        setSuccessMsg('');
      }, 1500);

    } catch (err) {
      setErrorMsg(err.message || 'Could not save category');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCreateCategory = async (e) => {
    e.preventDefault();
    if (!quickCatName.trim()) return;
    
    setIsLoading(true);
    try {
      const slug = quickCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      await catalogService.createCategory({
        brand: 'WoodenToys',
        name: quickCatName.trim(),
        slug,
        isActive: true
      });
      setSuccessMsg('Category created successfully!');
      const cats = await catalogService.getCategories();
      setCategories(cats);
      setQuickCatName('');
      setShowAddCategoryModal(false);
      setTimeout(() => setSuccessMsg(''), 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Could not create category');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategoryClick = (category) => {
    setEditCategoryId(category._id);
    setCatBrand(category.brand || 'WoodenToys');
    setCatName(category.name || '');
    setCatSubCategories(category.subCategoriesList ? category.subCategoriesList.join(', ') : '');
    setCatAvailableAges(category.availableAges ? category.availableAges.join(', ') : '');
    setCatAvailableColors(category.availableColors ? category.availableColors.join(', ') : '');
    setCatAvailableWoodTypes(category.availableWoodTypes ? category.availableWoodTypes.join(', ') : '');
    setCatDescription(category.description || '');
    setCatImage(category.image || '');
    setCatDisplayOrder((category.displayOrder || 1).toString());
    setCatIsActive(category.isActive !== false); // default true if undefined
    setCatSeoTitle(category.seoTitle || '');
    setCatSeoDescription(category.seoDescription || '');
    setCategorySubTab('edit');
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await catalogService.deleteCategory(id);
        setCategories(prev => prev.filter(c => c._id !== id));
      } catch (err) {
        alert(err.message || 'Could not delete category.');
      }
    }
  };

  const handleToggleCategoryStatus = async (cat) => {
    try {
      const newStatus = cat.isActive === false ? true : false;
      await catalogService.updateCategory(cat._id, { ...cat, isActive: newStatus });
      setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: newStatus } : c));
    } catch (err) {
        weight: v.weight,
        price: parseFloat(variantData[v.key]?.price || 0),
        basePrice: parseFloat(variantData[v.key]?.basePrice || 0)
      }));

      // 1. Create the Product with new classification fields
      const productPayload = {
        name,
        slug,
        description,
        category: selectedCategory,
        subCategory: selectedSubCategory || null,
        price: parseFloat(price),
        images: photos,
        ageGroup: selectedAgeGroups,
        ageColors: ageColorsArray,
        woodType: selectedWoodType,
        variants: variantsPayload,
        isActive: true
      };

      const product = await catalogService.createProduct(productPayload);

      // 2. Initialize inventory for the product / variants
      if (variantsPayload.length > 0) {
        const inventoryPromises = variantsPayload.map(v => {
          return catalogService.createInventory({
            product: product._id,
            sku: (sku.trim() ? `${sku.trim()}-${v.key}` : `WOOD-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${v.key}`).replace(/[^a-zA-Z0-9-]/g, ''),
            stockQuantity: parseInt(variantData[v.key]?.stock || 0, 10),
            variantKey: v.key
          });
        });
        await Promise.all(inventoryPromises);
      } else {
        const inventoryPayload = {
          product: product._id,
          sku: sku.trim() || `WOOD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          stockQuantity: parseInt(stock, 10) || 0,
          variantKey: 'default'
        };
        await catalogService.createInventory(inventoryPayload);
      }

      setSuccessMsg('Product and inventory created successfully!');
      
      // Reset form fields
      setName('');
      setDescription('');
      setPrice('');
      setSku('');
      setStock('10');
      setPhotos([]);
      setSelectedAgeGroups([]);
      setSelectedAgeColors({});
      setSelectedWoodType('Beech Wood');

      // Reload products list
      loadData();
      
      // Switch back to list view
      setTimeout(() => {
        setProductSubTab('list');
        setSuccessMsg('');
      }, 1500);

    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong while creating the product.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await catalogService.deleteProduct(id);
        setProducts(prev => prev.filter(p => p._id !== id));
      } catch (err) {
        alert(err.message || 'Could not delete product.');
      }
    }
  };

  // Filter parents and children
  const parentCategories = categories.filter(c => !c.parentCategory);
  
  // Dynamic options based on selected category
  const selectedCategoryObj = categories.find(c => c._id === selectedCategory);
  const dynamicSubCategories = selectedCategoryObj?.subCategoriesList || [];
  const dynamicAges = selectedCategoryObj?.availableAges?.length > 0 ? selectedCategoryObj.availableAges : ageGroupOptions;
  const dynamicColors = selectedCategoryObj?.availableColors?.length > 0 ? selectedCategoryObj.availableColors : colorOptions;
  const dynamicWoodTypes = selectedCategoryObj?.availableWoodTypes?.length > 0 ? selectedCategoryObj.availableWoodTypes : woodTypeOptions;

  return (
    <div className="flex h-screen bg-brand-light font-sans text-brand-dark overflow-hidden">
      
      {/* ── SIDEBAR ── */}
      // Reset form fields
      setName('');
      setDescription('');
      setPrice('');
      setSku('');
      setStock('10');
      setPhotos([]);
      setSelectedAgeGroups([]);
      setSelectedAgeColors({});
      setSelectedWoodType('Beech Wood');

      // Reload products list
      loadData();
      
      // Switch back to list view
      setTimeout(() => {
        setProductSubTab('list');
        setSuccessMsg('');
      }, 1500);

    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong while creating the product.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await catalogService.deleteProduct(id);
        setProducts(prev => prev.filter(p => p._id !== id));
      } catch (err) {
        alert(err.message || 'Could not delete product.');
      }
    }
  };

  // Filter parents and children
  const parentCategories = categories.filter(c => !c.parentCategory);
  
  // Dynamic options based on selected category
  const selectedCategoryObj = categories.find(c => c._id === selectedCategory);
  const dynamicSubCategories = selectedCategoryObj?.subCategoriesList || [];
  const dynamicAges = selectedCategoryObj?.availableAges?.length > 0 ? selectedCategoryObj.availableAges : ageGroupOptions;
  const dynamicColors = selectedCategoryObj?.availableColors?.length > 0 ? selectedCategoryObj.availableColors : colorOptions;
  const dynamicWoodTypes = selectedCategoryObj?.availableWoodTypes?.length > 0 ? selectedCategoryObj.availableWoodTypes : woodTypeOptions;

  return (
    <div className="flex h-screen bg-brand-light font-sans text-brand-dark overflow-hidden">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-[260px] bg-white border-r border-[#E6DFD4] flex flex-col justify-between shrink-0 h-full overflow-y-auto">
        <div>
          {/* Logo */}
          <div className="pt-8 pb-6 px-8">
            <h1 className="font-bold text-xl tracking-widest text-brand-dark leading-tight">WOODENTOYS</h1>
            <p className="text-[10px] font-bold text-brand-medium uppercase tracking-widest mt-0.5">Admin Portal</p>
          </div>

          {/* Nav Links */}
          <nav className="px-4 space-y-1 mt-4">
            <button 
              onClick={() => setCurrentTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${currentTab === 'dashboard' ? 'bg-[#E6DFD4] text-brand-dark' : 'text-brand-medium hover:bg-brand-light hover:text-brand-dark'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              Dashboard
            </button>

            <div className="pt-6 space-y-1">
              <div className="px-4 pb-2">
                <p className="text-[10px] font-bold tracking-widest uppercase text-brand-medium">Catalog Management</p>
              </div>
              
              <button 
                onClick={() => {
                  setCurrentTab('catalog');
                  setCategorySubTab('list');
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${currentTab === 'catalog' ? 'bg-[#E6DFD4] text-brand-dark' : 'text-brand-medium hover:bg-brand-light hover:text-brand-dark'}`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                  Categories
                </div>
              </button>

              <button 
                onClick={() => setCurrentTab('subcategories')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${currentTab === 'subcategories' ? 'bg-[#E6DFD4] text-brand-dark' : 'text-brand-medium hover:bg-brand-light hover:text-brand-dark'}`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                  Sub Categories
                </div>
              </button>

              <button 
                onClick={() => setCurrentTab('attributes')}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {currentTab === 'dashboard' && (
            <>
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark font-sans tracking-tight">Dashboard Overview</h2>
                  <p className="text-sm text-brand-medium mt-1">Welcome back. Here's what is happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select className="bg-white border border-[#E6DFD4] text-brand-dark text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-brand-medium cursor-pointer shadow-sm">
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>All Time</option>
                  </select>
                  <button className="bg-brand-dark hover:bg-black text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                <div className="bg-white rounded-2xl p-5 border border-[#E6DFD4] shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-semibold text-brand-medium uppercase tracking-widest">Total Revenue</h3>
                    <span className="text-brand-medium text-sm">$</span>
                  </div>
                  <p className="text-2xl font-bold text-brand-dark mb-4">${totalRevenue.toFixed(2)}</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-green">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    Real-time DB sync
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E6DFD4] shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-semibold text-brand-medium uppercase tracking-widest">Total Orders</h3>
                    <svg className="w-4 h-4 text-brand-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  </div>
                  <p className="text-2xl font-bold text-brand-dark mb-4">{totalOrders}</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-green">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    Real-time DB sync
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E6DFD4] shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-semibold text-brand-medium uppercase tracking-widest">Total Customers</h3>
                    <svg className="w-4 h-4 text-brand-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  </div>
                  <p className="text-2xl font-bold text-brand-dark mb-4">{totalCustomers}</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-green">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    Real-time DB sync
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E6DFD4] shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-semibold text-brand-medium uppercase tracking-widest">Total Products</h3>
                    <svg className="w-4 h-4 text-brand-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  </div>
                  <p className="text-2xl font-bold text-brand-dark mb-4">{products.length}</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-green">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    Real-time DB sync
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E6DFD4] shadow-sm min-h-[300px] flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-brand-dark">Revenue Analytics</h3>
                      <p className="text-xs text-brand-medium mt-1">Daily revenue over the last 30 days</p>
                    </div>
                  </div>
                  <div className="flex-1 border-t border-b border-dashed border-[#E6DFD4] my-2 relative">
                     <div className="absolute inset-0 flex flex-col justify-between py-4">
                       <div className="border-t border-dashed border-[#E6DFD4] w-full"></div>
                       <div className="border-t border-dashed border-[#E6DFD4] w-full"></div>
                       <div className="border-t border-dashed border-[#E6DFD4] w-full"></div>
                     </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#E6DFD4] shadow-sm min-h-[300px] flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-brand-dark">Order Volume</h3>
                    <p className="text-xs text-brand-medium mt-1">Orders by day of week (1=Sun)</p>
                <div className="bg-white rounded-2xl p-6 border border-[#E6DFD4] shadow-sm min-h-[300px] flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-brand-dark">Order Volume</h3>
                    <p className="text-xs text-brand-medium mt-1">Orders by day of week (1=Sun)</p>
                  </div>
                  <div className="flex-1 border-t border-b border-dashed border-[#E6DFD4] my-2 relative">
                     <div className="absolute inset-0 flex flex-col justify-between py-4">
                       <div className="border-t border-dashed border-[#E6DFD4] w-full"></div>
                       <div className="border-t border-dashed border-[#E6DFD4] w-full"></div>
                       <div className="border-t border-dashed border-[#E6DFD4] w-full"></div>
                     </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: CATALOG MANAGEMENT (CATEGORIES) */}
          {currentTab === 'catalog' && catalogSubTab === 'categories' && (
                  <h2 className="text-2xl font-bold text-brand-dark font-serif">Category Management</h2>
                  <p className="text-sm text-brand-medium">Manage top-level categories and their classification metadata.</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCategorySubTab('list')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${categorySubTab === 'list' ? 'bg-brand-dark text-white shadow-md' : 'bg-white border border-[#E6DFD4] text-brand-medium hover:text-brand-dark'}`}
                  >
                    View Categories
                  </button>
                  <button 
                    onClick={() => {
                      setEditCategoryId(null);
                      setCatBrand('WoodenToys');
                      setCatName('');
                      setCatSubCategories('');
                      setCatAvailableAges('');
                      setCatAvailableColors('');
                      setCatAvailableWoodTypes('');
                      setCatDescription('');
                      setCatImage('');
                      setCatDisplayOrder('1');
                      setCatIsActive(true);
                      setCatSeoTitle('');
                      setCatSeoDescription('');
                      setCategorySubTab('add');
                    }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${categorySubTab === 'add' || categorySubTab === 'edit' ? 'bg-brand-dark text-white shadow-md' : 'bg-white border border-[#E6DFD4] text-brand-medium hover:text-brand-dark'}`}
                  >
                    + Add Category
                  </button>
                </div>
              </div>

              {/* CATEGORY LIST SUB TAB */}
              {categorySubTab === 'list' && (
                <div className="bg-white border border-[#E6DFD4] rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-light/50 border-b border-[#E6DFD4] text-brand-medium text-[10px] font-bold tracking-widest uppercase">
                          <th className="py-4 px-6">Image</th>
                          <th className="py-4 px-6">Category</th>
                          <th className="py-4 px-6">Products</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Created</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6DFD4]/55 text-sm text-brand-dark">
                        {categories.filter(c => !c.parentCategory).map((cat) => (
                          <tr key={cat._id} className="hover:bg-brand-light/25 transition-colors">
                            <td className="py-4 px-6">
                              <div className="w-10 h-10 rounded-lg bg-brand-light/60 border border-[#E6DFD4] overflow-hidden shrink-0 flex items-center justify-center text-xl">
                                {cat.image ? (
                                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                ) : (
                                  "📦"
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <h4 className="font-serif font-bold leading-tight">{cat.name}</h4>
                              <p className="text-[10px] text-brand-medium font-mono mt-0.5">{cat.slug}</p>
                            </td>
                            <td className="py-4 px-6 font-semibold">
                              {products.filter(p => p.category?._id === cat._id || p.category === cat._id).length}
                            </td>
                            <td className="py-4 px-6">
                              <button 
                                onClick={() => handleToggleCategoryStatus(cat)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cat.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${cat.isActive !== false ? 'translate-x-4' : 'translate-x-1'}`} />
                              </button>
                            </td>
                            <td className="py-4 px-6 text-xs text-brand-medium">
                              {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : 'Today'}
                            </td>
                            <td className="py-4 px-6 text-right space-x-3">
                              <button 
                                onClick={() => handleEditCategoryClick(cat)}
                                className="text-brand-dark hover:text-black font-bold text-xs"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(cat._id)}
                                className="text-red-600 hover:text-red-800 font-bold text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADD/EDIT CATEGORY SUB TAB */}
              {(categorySubTab === 'add' || categorySubTab === 'edit') && (
                <div className="bg-white border border-[#E6DFD4] rounded-2xl p-8 shadow-sm">
                  {successMsg && <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 text-xs font-bold rounded-r">{successMsg}</div>}
                  {errorMsg && <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-xs font-bold rounded-r">{errorMsg}</div>}

                  <form onSubmit={handleSaveCategory} className="space-y-6 max-w-3xl">
                    <div className="space-y-6 bg-brand-light/40 p-6 rounded-2xl border border-[#E6DFD4]">
                      <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest uppercase text-brand-medium block">Brand Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={catBrand} 
                            onChange={(e) => setCatBrand(e.target.value)} 
                            className="w-full border border-[#E6DFD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-medium bg-white/80 text-brand-dark"
                            placeholder="e.g. MEEYAZH Threads"
                          />
                                className="text-red-600 hover:text-red-800 font-bold text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADD/EDIT CATEGORY SUB TAB */}
              {(categorySubTab === 'add' || categorySubTab === 'edit') && (
                <div className="bg-white border border-[#E6DFD4] rounded-2xl p-8 shadow-sm">
                  {successMsg && <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 text-xs font-bold rounded-r">{successMsg}</div>}
                  {errorMsg && <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-xs font-bold rounded-r">{errorMsg}</div>}

                  <form onSubmit={handleSaveCategory} className="space-y-6 max-w-3xl">
                    <div className="flex justify-end mb-4">
                      <button 
                        type="button"
                        onClick={() => setShowAddCategoryModal(true)}
                        className="bg-brand-dark hover:bg-black text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-colors shadow-sm"
                      >
                        + Add Category
                      </button>
                    </div>

                    <div className="space-y-6 bg-brand-light/40 p-6 rounded-2xl border border-[#E6DFD4]">
                      <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest uppercase text-brand-medium block">Brand Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={catBrand} 
                            onChange={(e) => setCatBrand(e.target.value)} 
                            className="w-full border border-[#E6DFD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-medium bg-white/80 text-brand-dark"
                            placeholder="e.g. MEEYAZH Threads"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-brand-light rounded text-brand-dark cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold tracking-widest uppercase text-brand-medium block">Name</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              required 
                              value={catName} 
                              onChange={(e) => setCatName(e.target.value)} 
                              className="flex-1 border border-[#E6DFD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-medium bg-white/80 text-brand-dark"
                              placeholder="e.g. Puzzle"
                            />
                            <button type="button" className="w-12 h-[46px] flex items-center justify-center bg-brand-medium text-white rounded-xl text-xl font-medium shrink-0 shadow-sm hover:bg-brand-dark transition-colors">
                              +
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[#4a5568] block">Available Wood Types (comma separated)</label>
                          <input 
                            type="text" 
                            value={catAvailableWoodTypes} 
                            onChange={(e) => setCatAvailableWoodTypes(e.target.value)} 
                            className="w-full border border-[#cbd5e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-transparent text-[#2d3748]"
                            placeholder="e.g. Beech, Oak, Pine"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#4a5568] block">Description</label>
                        <textarea 
                          rows="4" 
                          value={catDescription} 
                          onChange={(e) => setCatDescription(e.target.value)} 
                          className="w-full border border-[#cbd5e0] rounded-lg p-4 text-sm focus:outline-none focus:border-green-600 bg-transparent text-[#2d3748]"
                        />
                      </div>

                      <div className="pt-2">
                        <button 
                          type="submit" 
                          disabled={isLoading}
                          className="bg-[#4a7251] hover:bg-[#3d5e42] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
                        >
                          {isLoading ? 'Saving...' : 'Save Category'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCT MANAGEMENT */}
          {currentTab === 'products' && (
            <div className="space-y-6">
              {/* Product Dashboard Tabs Row */}
                          <label className="text-xs font-bold tracking-widest uppercase text-brand-medium block">Available Colors (comma separated)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={catAvailableColors} 
                              onChange={(e) => setCatAvailableColors(e.target.value)} 
                              className="flex-1 border border-[#E6DFD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-medium bg-white/80 text-brand-dark"
                              placeholder="e.g. Red, Blue, Black"
                            />
                            <button type="button" className="w-12 h-[46px] flex items-center justify-center bg-brand-medium text-white rounded-xl text-xl font-medium shrink-0 shadow-sm hover:bg-brand-dark transition-colors">
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold tracking-widest uppercase text-brand-medium block">Available Wood Types (comma separated)</label>
                          <input 
                            type="text" 
                            value={catAvailableWoodTypes} 
                            onChange={(e) => setCatAvailableWoodTypes(e.target.value)} 
                            className="w-full border border-[#E6DFD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-medium bg-white/80 text-brand-dark"
                            placeholder="e.g. Beech, Oak, Pine"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest uppercase text-brand-medium block">Description</label>
                        <textarea 
                          rows="4" 
                          value={catDescription} 
                          onChange={(e) => setCatDescription(e.target.value)} 
                          className="w-full border border-[#E6DFD4] rounded-xl p-4 text-sm focus:outline-none focus:border-brand-medium bg-white/80 text-brand-dark"
                        />
                      </div>

                      <div className="pt-2">
                        <button 
                          type="submit" 
                          disabled={isLoading}
                          className="bg-brand-dark hover:bg-black text-white text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-colors disabled:opacity-60 shadow-md"
                        >
                          {isLoading ? 'Saving...' : 'Save Category'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCT MANAGEMENT */}
          {currentTab === 'products' && (
            <div className="space-y-6">
              {/* Product Dashboard Tabs Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E6DFD4] pb-4 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark font-serif">Product Management</h2>
                  <p className="text-sm text-brand-medium">Manage store items, pricing, inventory, and media assets.</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setProductSubTab('list')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${productSubTab === 'list' ? 'bg-brand-dark text-white shadow-md' : 'bg-white border border-[#E6DFD4] text-brand-medium hover:text-brand-dark'}`}
                  >
                    Product List
                  </button>
                  <button 
                    onClick={() => setProductSubTab('add')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${productSubTab === 'add' ? 'bg-brand-dark text-white shadow-md' : 'bg-white border border-[#E6DFD4] text-brand-medium hover:text-brand-dark'}`}
                  >
                    + Add Product
                  </button>
                </div>
              </div>

              {/* SUB TAB 1: PRODUCT LIST */}
              {productSubTab === 'list' && (
                <div className="bg-white border border-[#E6DFD4] rounded-2xl overflow-hidden shadow-sm">
                  {products.length === 0 ? (
                    <div className="p-16 text-center">
                      <svg className="w-12 h-12 text-brand-medium mx-auto opacity-40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                      <h4 className="font-serif text-lg font-bold text-brand-dark">No Products Found</h4>
                      <p className="text-xs text-brand-medium mt-1">Get started by creating your first wooden toy.</p>
                      <button 
                        onClick={() => setProductSubTab('add')}
                        className="bg-brand-dark text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl mt-4 hover:bg-black transition-colors"
                      >
                        Create Product
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-brand-light/50 border-b border-[#E6DFD4] text-brand-medium text-[10px] font-bold tracking-widest uppercase">

              {/* SUB TAB 2: ADD PRODUCT */}
              {productSubTab === 'add' && (
                <div className="bg-white border border-[#E6DFD4] rounded-2xl p-8 shadow-sm">
                  
                  {/* Banner Messages */}
                  {successMsg && <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 text-xs font-bold rounded-r">{successMsg}</div>}
                  {errorMsg && <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-xs font-bold rounded-r">{errorMsg}</div>}

                  <form onSubmit={handleAddProductSubmit} className="space-y-6">
                    
                    {/* Basic Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Product Name *</label>
                        <input 
                          type="text" 
                          required 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="w-full border border-[#E6DFD4] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-medium"
                          placeholder="e.g. Handmade Oak Blocks"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">SKU Code *</label>
                        <input 
                          type="text" 
                          required 
                          value={sku} 
                          onChange={(e) => setSku(e.target.value)} 
                          className="w-full border border-[#E6DFD4] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-medium"
                          placeholder="e.g. TOY-OAK-BLOCKS"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Price ($) *</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            required 
                            value={price} 
                            onChange={(e) => setPrice(e.target.value)} 
                            className="w-full border border-[#E6DFD4] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-medium"
                            placeholder="e.g. 29.99"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Initial Stock *</label>
                          <input 
                            type="number" 
                            min="0" 
                            required 
                            value={stock} 
                            onChange={(e) => setStock(e.target.value)} 
                            className="w-full border border-[#E6DFD4] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-medium"
                            placeholder="e.g. 10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Product Description *</label>
                        <textarea 
                          rows="2" 
                          required 
                          value={description} 
                          onChange={(e) => setDescription(e.target.value)} 
                          className="w-full border border-[#E6DFD4] rounded-xl p-4 text-sm focus:outline-none focus:border-brand-medium"
                          placeholder="Provide detailed description of materials, safety information, etc."
                        />
                      </div>
                    </div>

                    {/* PRODUCT CLASSIFICATION ACCORDION / BOX */}
                    <div className="bg-[#FAF9F5] border border-[#E6DFD4] rounded-2xl p-6 space-y-6">
                      <div className="border-b border-[#E6DFD4] pb-3 flex justify-between items-center">
                        <div>
                          <h3 className="text-xs font-bold tracking-widest uppercase text-[#807058]">Product Classification</h3>
                          <p className="text-[10px] text-brand-medium mt-0.5">Specify tags, wood source, skill development, and age criteria.</p>
                        </div>
                        <span className="text-xs bg-brand-dark/10 text-brand-dark px-2.5 py-0.5 rounded-full font-bold">Category Flow</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Parent Category Selector */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium">Category *</label>
                          </div>
                          <select 
                            required 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)} 
                            className="w-full border border-[#E6DFD4] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-medium"
                          >
                            <option value="" disabled>Select Category</option>
                            {parentCategories.map(c => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sub Category Selector */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium">Sub Category</label>
                          </div>
                          <select 
                            value={selectedSubCategory} 
                            onChange={(e) => setSelectedSubCategory(e.target.value)} 
                            className="w-full border border-[#E6DFD4] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-medium disabled:opacity-60"
                            disabled={!selectedCategory || dynamicSubCategories.length === 0}
                          >
                            <option value="">None (Top Level Only)</option>
                            {dynamicSubCategories.map(subCatName => (
                              <option key={subCatName} value={subCatName}>{subCatName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* PRODUCT ATTRIBUTES */}
                    {selectedCategory && (
                        <div className="bg-[#FAF9F5] border border-[#E6DFD4] rounded-2xl p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Age Group Checkboxes */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Age Group *</label>
                              <div className="flex flex-wrap gap-4 pt-1">
                                {dynamicAges.map(option => (
                                  <label key={option} className="flex items-center space-x-2 text-xs text-brand-dark font-medium cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedAgeGroups.includes(option)}
                                      onChange={() => {
                                        toggleSelection(option, selectedAgeGroups, setSelectedAgeGroups);
                                        setSelectedAgeColors({});
                                        setSelectedWeights([]);
                                      }}
                                      className="w-4 h-4 rounded text-brand-dark focus:ring-brand-medium"
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Wood Type *</label>
                              <select 
                                value={selectedWoodType}
                                onChange={(e) => setSelectedWoodType(e.target.value)}
                                className="w-full border border-[#E6DFD4] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-medium"
                              >
                                {dynamicWoodTypes.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>

                            {/* Color Checkboxes per Age Group */}
                            {selectedAgeGroups.map(age => (
                              <div key={`color-${age}`} className="space-y-2 col-span-1 md:col-span-2 bg-brand-light/30 p-4 rounded-xl border border-[#E6DFD4]/50">
                                <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Colors for {age} *</label>
                                <div className="flex flex-wrap gap-4 pt-1">
                                  {dynamicColors.map(option => (
                                    <label key={`${age}-${option}`} className="flex items-center space-x-2 text-xs text-brand-dark font-medium cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={(selectedAgeColors[age] || []).includes(option)}
                                        onChange={() => {
                                          const currentColors = selectedAgeColors[age] || [];
                                          let newColors;
                                          if (currentColors.includes(option)) {
                                            newColors = currentColors.filter(c => c !== option);
                                          } else {
                                            newColors = [...currentColors, option];
                                          }
                                          setSelectedAgeColors({ ...selectedAgeColors, [age]: newColors });
                                        }}
                                        className="w-4 h-4 rounded text-brand-dark focus:ring-brand-medium"
                                      />
                                      <span>{option}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {/* Weight Checkboxes */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Weight Variants *</label>
                              <div className="flex flex-wrap gap-4 pt-1">
                                {weightOptions.map(option => (
                                  <label key={option} className="flex items-center space-x-2 text-xs text-brand-dark font-medium cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedWeights.includes(option)}
                                      onChange={() => toggleSelection(option, selectedWeights, setSelectedWeights)}
                                      className="w-4 h-4 rounded text-brand-dark focus:ring-brand-medium"
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Variant Configurator Table */}
                          {activeVariants.length > 0 && (
                            <div className="pt-4 border-t border-[#E6DFD4]">
                              <div className="mb-4">
                                <h3 className="font-serif font-bold text-lg text-brand-dark">Variant Pricing & Stock</h3>
                                <p className="text-xs text-brand-medium mt-0.5">Configure price and inventory stock for each variant combination.</p>
                              </div>
                              
                              <div className="overflow-x-auto bg-white border border-[#E6DFD4] rounded-xl">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-brand-light border-b border-[#E6DFD4]">
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Age Group</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Color</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Weight</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Product Price ($)</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Base Price ($)</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Stock</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeVariants.map((v, idx) => (
                                      <tr key={v.key} className={idx !== activeVariants.length - 1 ? 'border-b border-[#E6DFD4]' : ''}>
                                        <td className="px-4 py-3 text-xs text-brand-dark font-medium">{v.ageGroup}</td>
                                        <td className="px-4 py-3 text-xs text-brand-dark font-medium">{v.color}</td>
                                        <td className="px-4 py-3 text-xs text-brand-dark font-medium">{v.weight}</td>
                                        <td className="px-4 py-2">
                                          <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={variantData[v.key]?.price || ''}
                                            onChange={(e) => setVariantData({
                                              ...variantData,
                                              [v.key]: { ...variantData[v.key], price: e.target.value }
                                            })}
                                            className="w-24 border border-[#E6DFD4] rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-medium"
                                            placeholder="0.00"
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {/* Weight Checkboxes */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Weight Variants *</label>
                              <div className="flex flex-wrap gap-4 pt-1">
                                {weightOptions.map(option => (
                                  <label key={option} className="flex items-center space-x-2 text-xs text-brand-dark font-medium cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedWeights.includes(option)}
                                      onChange={() => toggleSelection(option, selectedWeights, setSelectedWeights)}
                                      className="w-4 h-4 rounded text-brand-dark focus:ring-brand-medium"
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Variant Configurator Table */}
                          {activeVariants.length > 0 && (
                            <div className="pt-4 border-t border-[#E6DFD4]">
                              <div className="mb-4">
                                <h3 className="font-serif font-bold text-lg text-brand-dark">Variant Pricing & Stock</h3>
                                <p className="text-xs text-brand-medium mt-0.5">Configure price and inventory stock for each variant combination.</p>
                              </div>
                              
                              <div className="overflow-x-auto bg-white border border-[#E6DFD4] rounded-xl">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-brand-light border-b border-[#E6DFD4]">
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Age Group</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Color</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Weight</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Product Price ($)</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Base Price ($)</th>
                                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-medium">Stock</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeVariants.map((v, idx) => (
                                      <tr key={v.key} className={idx !== activeVariants.length - 1 ? 'border-b border-[#E6DFD4]' : ''}>
                                        <td className="px-4 py-3 text-xs text-brand-dark font-medium">{v.ageGroup}</td>
                                        <td className="px-4 py-3 text-xs text-brand-dark font-medium">{v.color}</td>
                                        <td className="px-4 py-3 text-xs text-brand-dark font-medium">{v.weight}</td>
                                        <td className="px-4 py-2">
                                          <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={variantData[v.key]?.price || ''}
                                            onChange={(e) => setVariantData({
                                              ...variantData,
                                              [v.key]: { ...variantData[v.key], price: e.target.value }
                                            })}
                                            className="w-24 border border-[#E6DFD4] rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-medium"
                                            placeholder="0.00"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={variantData[v.key]?.basePrice || ''}
                                            onChange={(e) => setVariantData({
                                              ...variantData,
                                              [v.key]: { ...variantData[v.key], basePrice: e.target.value }
                                            })}
                                            className="w-24 border border-[#E6DFD4] rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-medium"
                                            placeholder="0.00"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input 
                                            type="number"
                                            min="0"
                                            value={variantData[v.key]?.stock || ''}
                                            onChange={(e) => setVariantData({
                                              ...variantData,
                                              [v.key]: { ...variantData[v.key], stock: e.target.value }
                                            })}
                                            className="w-20 border border-[#E6DFD4] rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-medium"
                                            placeholder="0"
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                    )}

                    {/* Product Photos Section */}
                    <div className="border-t border-[#E6DFD4] pt-6 space-y-4">
                      <div>
                        <h3 className="font-serif font-bold text-lg text-brand-dark">Product Photos</h3>
                        <p className="text-xs text-brand-medium mt-0.5">Upload local files or add image URLs. Drag-free arrow controls allow you to reorder photos easily.</p>
                      </div>

                      {/* Photo inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Add Photo via URL</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={tempPhotoUrl} 
                              onChange={(e) => setTempPhotoUrl(e.target.value)} 
                              className="w-full border border-[#E6DFD4] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                              placeholder="https://images.unsplash.com/photo-..."
                            />
                            <button 
                              type="button" 
                              onClick={handleAddPhotoUrl}
                              className="bg-brand-dark hover:bg-black text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl whitespace-nowrap"
                            >
                              Add URL
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-brand-medium block">Upload Files</label>
                          <label className="w-full border border-dashed border-[#E6DFD4] hover:bg-brand-light/30 rounded-xl px-4 py-2.5 text-xs text-center font-bold text-brand-dark cursor-pointer block border-brand-medium/40 transition-colors">
                            Choose Files
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              onChange={handleFileUpload} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>

                      {/* Photo Grid / Reordering Area */}
                      {photos.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
                          {photos.map((url, idx) => (
                            <div key={url + idx} className="relative group bg-white border border-[#E6DFD4] rounded-2xl overflow-hidden shadow-sm flex flex-col">
                              <div className="h-28 bg-brand-light/50 relative overflow-hidden flex items-center justify-center border-b border-[#E6DFD4]">
                                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2 bg-brand-dark text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                                  Pos: {idx + 1}
                                </div>
                              </div>

                              <div className="p-2 flex items-center justify-between gap-1 bg-[#FDFCF7]">
                                <div className="flex gap-1">
                                  <button 
                                    type="button" 
                                    disabled={idx === 0}
                                    onClick={() => movePhoto(idx, 'left')}
                                    className="bg-white border border-[#E6DFD4] text-[#807058] hover:bg-brand-light disabled:opacity-30 rounded p-1 text-[10px] font-bold transition-all cursor-pointer"
                                    title="Move Left"
                                  >
                                    ←
                                  </button>
                                  <button 
                                    type="button" 
                                    disabled={idx === photos.length - 1}
                                    onClick={() => movePhoto(idx, 'right')}
                                    className="bg-white border border-[#E6DFD4] text-[#807058] hover:bg-brand-light disabled:opacity-30 rounded p-1 text-[10px] font-bold transition-all cursor-pointer"
                                    title="Move Right"
                                  >
                                    →
                                  </button>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => deletePhoto(idx)}
                                  className="text-red-500 hover:text-red-700 p-1 text-[10px] font-bold transition-all cursor-pointer"
                                  title="Delete Photo"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-brand-light/30 border border-dashed border-[#E6DFD4] rounded-2xl py-12 text-center text-xs text-brand-medium">
                          No photos added yet. Add a URL or upload images to preview and reorder.
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="border-t border-[#E6DFD4] pt-6 flex justify-end gap-3">
                      <button 
                        type="button" 
                        onClick={() => setProductSubTab('list')}
                        className="bg-white border border-[#E6DFD4] hover:bg-brand-light/50 text-brand-dark text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-brand-dark hover:bg-black text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-colors disabled:opacity-60"
                      >
                        {isLoading ? 'Saving Product...' : 'Save Product'}
                      </button>
                    </div>

                  </form>

                </div>
              )}

            </div>
          )}

          {/* TAB 3: SUB CATEGORIES */}
          {currentTab === 'subcategories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E6DFD4] pb-4 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark font-serif">Sub Categories</h2>
                  <p className="text-sm text-brand-medium">Manage sub categories and their mappings to parent categories.</p>
                </div>
                <button className="bg-brand-dark hover:bg-black text-white text-sm font-bold uppercase tracking-wider px-6 py-2 rounded-xl transition-colors shadow-md">
                  + Add Sub Category
                </button>
              </div>
              <div className="bg-white border border-[#E6DFD4] rounded-2xl p-16 text-center shadow-sm">
                <svg className="w-12 h-12 text-brand-medium mx-auto opacity-40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                <h4 className="font-serif text-lg font-bold text-brand-dark">Sub Category Module Coming Soon</h4>
                <p className="text-xs text-brand-medium mt-1">This section is currently under development.</p>
              </div>
            </div>
          )}

          {/* TAB 4: ATTRIBUTES */}
          {currentTab === 'attributes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E6DFD4] pb-4 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark font-serif">Attributes Management</h2>
                  <p className="text-sm text-brand-medium">Manage dynamic product attributes and variations.</p>
                </div>
                <button className="bg-brand-dark hover:bg-black text-white text-sm font-bold uppercase tracking-wider px-6 py-2 rounded-xl transition-colors shadow-md">
                  + Add Attribute
                </button>
              </div>
              <div className="bg-white border border-[#E6DFD4] rounded-2xl p-16 text-center shadow-sm">
                <svg className="w-12 h-12 text-brand-medium mx-auto opacity-40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                <h4 className="font-serif text-lg font-bold text-brand-dark">Attributes Module Coming Soon</h4>
                <p className="text-xs text-brand-medium mt-1">This section is currently under development.</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ADD CATEGORY QUICK MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#E6DFD4]">
              <h3 className="font-bold text-brand-dark tracking-wide">Quick Add Category</h3>
              <button 
                onClick={() => setShowAddCategoryModal(false)}
                className="text-brand-medium hover:text-brand-dark p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleQuickCreateCategory} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-medium block">Category Name</label>
                <input 
                  type="text" 
                  value={quickCatName} 
                  onChange={(e) => setQuickCatName(e.target.value)} 
                  className="w-full border border-[#E6DFD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-medium bg-brand-light/30 text-brand-dark"
                  placeholder="e.g. Dollhouses"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 