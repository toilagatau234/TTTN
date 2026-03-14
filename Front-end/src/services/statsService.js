import axiosClient from "./axiosClient";

const STATS_ENDPOINT = '/stats';

const statsService = {
  getOverview: () => {
    return axiosClient.get(`${STATS_ENDPOINT}/overview`);
  },

  getRevenueStats: (params) => {
    return axiosClient.get(`${STATS_ENDPOINT}/revenue`, { params });
  },

  getTopProducts: (params) => {
    return axiosClient.get(`${STATS_ENDPOINT}/top-products`, { params });
  },

  getOrderStatusStats: () => {
    return axiosClient.get(`${STATS_ENDPOINT}/order-status`);
  },

  getRecentOrders: (params) => {
    return axiosClient.get(`${STATS_ENDPOINT}/recent-orders`, { params });
  },

  getProductStats: () => {
    return axiosClient.get(`${STATS_ENDPOINT}/products`);
  }
};

export default statsService;
