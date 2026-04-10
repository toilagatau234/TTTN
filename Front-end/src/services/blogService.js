import axiosClient from "./axiosClient";

const BLOG_ENDPOINT = '/blogs';

const blogService = {
  getAll: (params) => {
    // params map filter criteria: page, limit, status, category, search
    return axiosClient.get(BLOG_ENDPOINT, { params });
  },

  getBySlug: (slug) => {
    return axiosClient.get(`${BLOG_ENDPOINT}/slug/${slug}`);
  },

  getById: (id) => {
    return axiosClient.get(`${BLOG_ENDPOINT}/${id}`);
  },

  create: (data) => {
    return axiosClient.post(BLOG_ENDPOINT, data);
  },

  update: (id, data) => {
    return axiosClient.put(`${BLOG_ENDPOINT}/${id}`, data);
  },

  delete: (id) => {
    return axiosClient.delete(`${BLOG_ENDPOINT}/${id}`);
  }
};

export default blogService;
