const bannerService = require('../services/bannerService');

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await bannerService.getAllBanners(req.query);
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await bannerService.getActiveBanners();
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBanner = async (req, res) => {
  try {
    const banner = await bannerService.getBannerById(req.params.id);
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const banner = await bannerService.createBanner(req.body);
    res.status(201).json({ success: true, data: banner, message: 'Đã tạo Banner thành công' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await bannerService.updateBanner(req.params.id, req.body);
    res.status(200).json({ success: true, data: banner, message: 'Cập nhật Banner thành công' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await bannerService.deleteBanner(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa Banner' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
