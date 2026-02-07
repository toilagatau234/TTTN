const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

// Helper function to build query filters
const buildFilters = (query) => {
    const { keyword, category, status, minPrice, maxPrice } = query;
    const filter = {};

    if (keyword) {
        filter.$or = [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } }
        ];
    }

    if (category && category !== 'all') {
        filter.category = category;
    }

    if (status && status !== 'all') {
        filter.status = status;
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    return filter;
}

// GET: Lấy danh sách sản phẩm (Pagination + Filter + Sort)
const getProducts = async (req, res) => {
    try {
        const filter = buildFilters(req.query);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || '-createdAt'; // Mặc định mới nhất

        const products = await Product.find(filter)
            .populate('category', 'name') // Join với bảng Category lấy tên
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET: Lấy chi tiết 1 sản phẩm
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST: Thêm mới sản phẩm
const createProduct = async (req, res) => {
    try {
        const {
            name, description, price, originalPrice,
            stock, category, status, isHot, isNewProduct,
            images // Array of { url, publicId } from frontend
        } = req.body;

        // Validate images
        let productImages = [];

        // 1. Ưu tiên lấy từ req.body.images (Client-side upload)
        if (images && Array.isArray(images) && images.length > 0) {
            productImages = images;
        }
        // 2. Fallback: Nếu upload qua multer (req.files - multiple)
        else if (req.files && req.files.length > 0) {
            productImages = req.files.map(file => ({
                url: file.path,
                publicId: file.filename
            }));
        }

        const newProduct = new Product({
            name,
            description,
            price,
            originalPrice,
            stock,
            category,
            status: stock == 0 ? 'out_of_stock' : (status || 'active'),
            isHot,
            isNewProduct,
            images: productImages
        });

        await newProduct.save();
        res.status(201).json({ success: true, data: newProduct });

    } catch (error) {
        // Cleanup images if save fails (only for multer uploads, client-side verified separately)
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await cloudinary.uploader.destroy(file.filename);
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT: Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        if (req.body.images && Array.isArray(req.body.images)) {
            const newImages = req.body.images;

            // Tìm những ảnh cũ không còn trong danh sách mới -> Xóa trên Cloudinary
            const oldImages = product.images;
            const newImagePublicIds = newImages.map(img => img.publicId);

            for (const img of oldImages) {
                if (!newImagePublicIds.includes(img.publicId)) {
                    await cloudinary.uploader.destroy(img.publicId);
                }
            }

            updateData.images = newImages;
        }

        // Cập nhật các trường khác
        // Lưu ý: Mongoose findByIdAndUpdate không chạy middleware save (slug generation),
        // nên nếu đổi tên, phải tự xử lý slug hoặc dùng cách findById -> save()

        // Cách 1: Dùng assign và save để kích hoạt middleware
        Object.assign(product, updateData);

        // Nếu client gửi images rỗng (muốn xóa hết) thì phải gán lại
        if (req.body.images && req.body.images.length === 0) {
            product.images = [];
        }

        await product.save();

        res.json({ success: true, data: product });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE: Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        // Xóa toàn bộ ảnh của sản phẩm trên Cloudinary
        if (product.images && product.images.length > 0) {
            for (const img of product.images) {
                if (img.publicId) {
                    await cloudinary.uploader.destroy(img.publicId);
                }
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa sản phẩm và hình ảnh liên quan' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
