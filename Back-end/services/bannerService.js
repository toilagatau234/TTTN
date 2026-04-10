const Banner = require('../models/Banner');
const cloudinary = require('../config/cloudinary');

exports.getAllBanners = async (query = {}) => {
  const { status } = query;
  let filter = {};
  if (status) filter.status = status;

  return await Banner.find(filter).sort('order -createdAt');
};

exports.getActiveBanners = async () => {
  return await Banner.find({ status: 'Active' }).sort('order -createdAt');
};

exports.getBannerById = async (id) => {
  const banner = await Banner.findById(id);
  if (!banner) throw new Error('Banner không tồn tại');
  return banner;
};

exports.createBanner = async (data) => {
  if (data.imageBase64) {
    const uploadRes = await cloudinary.uploader.upload(data.imageBase64, {
      folder: 'rosee/banners',
    });
    data.image = { url: uploadRes.secure_url, publicId: uploadRes.public_id };
  }
  const banner = new Banner(data);
  return await banner.save();
};

exports.updateBanner = async (id, data) => {
  const banner = await Banner.findById(id);
  if (!banner) throw new Error('Banner không tồn tại');

  if (data.imageBase64) {
    // Xóa ảnh cũ nếu có
    if (banner.image && banner.image.publicId) {
       await cloudinary.uploader.destroy(banner.image.publicId);
    }
    const uploadRes = await cloudinary.uploader.upload(data.imageBase64, {
      folder: 'rosee/banners',
    });
    data.image = { url: uploadRes.secure_url, publicId: uploadRes.public_id };
  }

  Object.assign(banner, data);
  return await banner.save();
};

exports.deleteBanner = async (id) => {
  const banner = await Banner.findById(id);
  if (!banner) throw new Error('Banner không tồn tại');

  // Xóa ảnh trên cloudinary
  if (banner.image && banner.image.publicId) {
     await cloudinary.uploader.destroy(banner.image.publicId);
  }

  await banner.deleteOne();
  return { id };
};
