import axiosClient from "./axiosClient";

const uploadService = {
  uploadImage: async (file) => {
    // Tạo FormData (Bắt buộc khi gửi file)
    const formData = new FormData();
    formData.append('image', file);

    // Gọi API. Lưu ý set header 'multipart/form-data'
    return axiosClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export default uploadService;