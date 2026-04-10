const blogService = require('../services/blogService');

exports.getAllBlogs = async (req, res) => {
  try {
    const result = await blogService.getAllBlogs(req.query);
    res.status(200).json({ 
      success: true, 
      data: result.blogs,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await blogService.getBlogBySlug(req.params.slug);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const blog = await blogService.getBlogById(req.params.id);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    // authorId: req.user._id, authorName: req.user.name (được truyền từ auth middleware)
    const blog = await blogService.createBlog(req.body, req.user._id, req.user.name);
    res.status(201).json({ success: true, data: blog, message: 'Tạo bài viết thành công' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await blogService.updateBlog(req.params.id, req.body);
    res.status(200).json({ success: true, data: blog, message: 'Cập nhật bài viết thành công' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    await blogService.deleteBlog(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa bài viết' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
