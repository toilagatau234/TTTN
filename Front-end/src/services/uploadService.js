import axiosClient from "./axiosClient";

const uploadService = {
  uploadImage: async (file) => {
    // Tạo FormData (Bắt buộc khi gửi file)
    const formData = new FormData();
    formData.append('image', file);

    // Gọi API.
    return axiosClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteImage: (publicId) => {
    return axiosClient.delete('/upload', { data: { publicId } });
  }
};

export default uploadService;