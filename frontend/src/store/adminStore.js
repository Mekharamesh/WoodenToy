import { create } from 'zustand';

// ==========================================
// ADMIN STORE
// ==========================================
export const useAdminStore = create((set) => ({
    // Sidebar state
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    // Modals state
    modals: {
        category: false,
        subCategory: false,
        attribute: false,
        attributeValue: false,
        product: false,
    },
    openModal: (modalName) =>
        set((state) => ({
            modals: { ...state.modals, [modalName]: true },
        })),
    closeModal: (modalName) =>
        set((state) => ({
            modals: { ...state.modals, [modalName]: false },
        })),

    // Form data state
    formData: {
        category: null,
        subCategory: null,
        attribute: null,
        attributeValue: null,
        product: null,
    },
    setFormData: (type, data) =>
        set((state) => ({
            formData: { ...state.formData, [type]: data },
        })),
    clearFormData: (type) =>
        set((state) => ({
            formData: { ...state.formData, [type]: null },
        })),

    // Loading state
    loading: false,
    setLoading: (loading) => set({ loading }),

    // Filters state
    filters: {
        category: {
            search: '',
            status: '',
            page: 1,
            limit: 10,
        },
        subCategory: {
            search: '',
            category: '',
            status: '',
            page: 1,
            limit: 10,
        },
        attribute: {
            search: '',
            type: '',
            status: '',
            page: 1,
            limit: 10,
        },
        product: {
            search: '',
            category: '',
            subCategory: '',
            status: '',
            page: 1,
            limit: 10,
        },
    },
    updateFilters: (type, filters) =>
        set((state) => ({
            filters: { ...state.filters, [type]: filters },
        })),

    // Breadcrumb
    breadcrumbs: [],
    setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
}));

export default useAdminStore;
