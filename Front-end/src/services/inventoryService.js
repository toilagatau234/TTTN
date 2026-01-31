import axiosClient from "./axiosClient";

const INVENTORY_ENDPOINT = '/inventory'; // Backend route
const SUPPLIER_ENDPOINT = '/suppliers'; // Backend route
const ADJUSTMENT_ENDPOINT = '/inventory/adjustments'; // Backend route

const inventoryService = {
  // --- NHÀ CUNG CẤP ---
  getSuppliers: (params) => {
    return axiosClient.get(SUPPLIER_ENDPOINT, { params });
  },
  createSupplier: (data) => {
    return axiosClient.post(SUPPLIER_ENDPOINT, data);
  },

  // --- PHIẾU NHẬP ---
  getImports: (params) => {
    return axiosClient.get(INVENTORY_ENDPOINT, { params });
  },
  getImportDetail: (id) => {
    return axiosClient.get(`${INVENTORY_ENDPOINT}/${id}`);
  },
  createImport: (data) => {
    return axiosClient.post(INVENTORY_ENDPOINT, data);
  },
  
  // --- KIỂM KHO / BÁO HỦY ---
  getAdjustments: (params) => {
    return axiosClient.get(ADJUSTMENT_ENDPOINT, { params });
  },
  createAdjustment: (data) => {
    return axiosClient.post(ADJUSTMENT_ENDPOINT, data);
  }
};

export default inventoryService;