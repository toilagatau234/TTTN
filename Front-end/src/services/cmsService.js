import axiosClient from "./axiosClient";

const BANNER_ENDPOINT = '/banners'; // Backend route
const BLOG_ENDPOINT = '/blogs';     // Backend route

const cmsService = {
  // --- BANNERS ---
  getBanners: (params) => axiosClient.get(BANNER_ENDPOINT, { params }),
  createBanner: (data) => axiosClient.post(BANNER_ENDPOINT, data),
  updateBanner: (id, data) => axiosClient.put(`${BANNER_ENDPOINT}/${id}`, data),
  deleteBanner: (id) => axiosClient.delete(`${BANNER_ENDPOINT}/${id}`),

  // --- BLOGS ---
  getBlogs: (params) => axiosClient.get(BLOG_ENDPOINT, { params }),
  getBlogDetail: (id) => axiosClient.get(`${BLOG_ENDPOINT}/${id}`),
  createBlog: (data) => axiosClient.post(BLOG_ENDPOINT, data),
  updateBlog: (id, data) => axiosClient.put(`${BLOG_ENDPOINT}/${id}`, data),
  deleteBlog: (id) => axiosClient.delete(`${BLOG_ENDPOINT}/${id}`),
};

export default cmsService;