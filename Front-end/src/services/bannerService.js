import axiosClient from "./axiosClient";

const BANNER_ENDPOINT = '/banners';

const bannerService = {
  getAll: (params) => {
    return axiosClient.get(BANNER_ENDPOINT, { params });
  },
  
  getActive: () => {
    return axiosClient.get(`${BANNER_ENDPOINT}/active`);
  },

  getById: (id) => {
    return axiosClient.get(`${BANNER_ENDPOINT}/${id}`);
  },

  create: (data) => {
    return axiosClient.post(BANNER_ENDPOINT, data);
  },

  update: (id, data) => {
    return axiosClient.put(`${BANNER_ENDPOINT}/${id}`, data);
  },

  delete: (id) => {
    return axiosClient.delete(`${BANNER_ENDPOINT}/${id}`);
  }
};

export default bannerService;
