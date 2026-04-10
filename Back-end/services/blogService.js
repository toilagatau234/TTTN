const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');

exports.getAllBlogs = async (query) => {
  const { page = 1, limit = 10, status, category, search } = query;
  let filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  const blogs = await Blog.find(filter)
    .populate('author', 'name avatar')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Blog.countDocuments(filter);

  return {
    blogs,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
};

exports.getBlogBySlug = async (slug) => {
  const blog = await Blog.findOne({ slug }).populate('author', 'name avatar');
  if (!blog) throw new Error('Bài viết không tồn tại');
  
  // Tăng lượt xem
  blog.views += 1;
  await blog.save({ timestamps: false }); // ko cập nhật updatedAt
  
  return blog;
};

exports.getBlogById = async (id) => {
  const blog = await Blog.findById(id);
  if (!blog) throw new Error('Bài viết không tồn tại');
  return blog;
};

exports.createBlog = async (data, authorId, authorName) => {
  if (data.thumbnailBase64) {
    const uploadRes = await cloudinary.uploader.upload(data.thumbnailBase64, {
      folder: 'rosee/blogs',
    });
    data.thumbnail = { url: uploadRes.secure_url, publicId: uploadRes.public_id };
  }
  
  data.author = authorId;
  data.authorName = authorName;

  const blog = new Blog(data);
  return await blog.save();
};

exports.updateBlog = async (id, data) => {
  const blog = await Blog.findById(id);
  if (!blog) throw new Error('Bài viết không tồn tại');

  if (data.thumbnailBase64) {
    if (blog.thumbnail && blog.thumbnail.publicId) {
       await cloudinary.uploader.destroy(blog.thumbnail.publicId);
    }
    const uploadRes = await cloudinary.uploader.upload(data.thumbnailBase64, {
      folder: 'rosee/blogs',
    });
    data.thumbnail = { url: uploadRes.secure_url, publicId: uploadRes.public_id };
  }

  Object.assign(blog, data);
  return await blog.save();
};

exports.deleteBlog = async (id) => {
  const blog = await Blog.findById(id);
  if (!blog) throw new Error('Bài viết không tồn tại');

  if (blog.thumbnail && blog.thumbnail.publicId) {
     await cloudinary.uploader.destroy(blog.thumbnail.publicId);
  }

  await blog.deleteOne();
  return { id };
};
