const Voucher = require('../models/Voucher');

// =============================================
// ADMIN: CRUD Voucher
// =============================================

// @desc    Lấy danh sách voucher
// @route   GET /api/vouchers
const getVouchers = async (req, res) => {
    try {
        const { isActive, code, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (isActive && isActive !== 'all') {
            filter.isActive = isActive === 'active';
        }
        if (code) {
            filter.code = { $regex: code, $options: 'i' };
        }

        const total = await Voucher.countDocuments(filter);
        const vouchers = await Voucher.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: vouchers,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get vouchers error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Lấy chi tiết voucher
// @route   GET /api/vouchers/:id
const getVoucherById = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
        }
        res.json({ success: true, data: voucher });
    } catch (error) {
        console.error('Get voucher error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Tạo voucher mới
// @route   POST /api/vouchers
const createVoucher = async (req, res) => {
    try {
        const { code, description, discountType, discountValue, maxDiscount, minOrderValue, usageLimit, startDate, endDate } = req.body;

        if (!code || !discountValue || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã, giá trị giảm và ngày hết hạn',
            });
        }

        // Check mã trùng
        const exists = await Voucher.findOne({ code: code.toUpperCase() });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Mã voucher đã tồn tại',
            });
        }

        const voucher = await Voucher.create({
            code: code.toUpperCase(),
            description,
            discountType: discountType || 'percent',
            discountValue,
            maxDiscount: maxDiscount || null,
            minOrderValue: minOrderValue || 0,
            usageLimit: usageLimit || null,
            startDate: startDate || Date.now(),
            endDate,
        });

        res.status(201).json({ success: true, data: voucher });
    } catch (error) {
        console.error('Create voucher error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Cập nhật voucher
// @route   PUT /api/vouchers/:id
const updateVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
        }

        const { code, description, discountType, discountValue, maxDiscount, minOrderValue, usageLimit, startDate, endDate, isActive } = req.body;

        // Nếu đổi mã → check trùng
        if (code && code.toUpperCase() !== voucher.code) {
            const exists = await Voucher.findOne({ code: code.toUpperCase() });
            if (exists) {
                return res.status(400).json({ success: false, message: 'Mã voucher đã tồn tại' });
            }
            voucher.code = code.toUpperCase();
        }

        if (description !== undefined) voucher.description = description;
        if (discountType) voucher.discountType = discountType;
        if (discountValue !== undefined) voucher.discountValue = discountValue;
        if (maxDiscount !== undefined) voucher.maxDiscount = maxDiscount;
        if (minOrderValue !== undefined) voucher.minOrderValue = minOrderValue;
        if (usageLimit !== undefined) voucher.usageLimit = usageLimit;
        if (startDate) voucher.startDate = startDate;
        if (endDate) voucher.endDate = endDate;
        if (isActive !== undefined) voucher.isActive = isActive;

        await voucher.save();

        res.json({ success: true, data: voucher });
    } catch (error) {
        console.error('Update voucher error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Xóa voucher
// @route   DELETE /api/vouchers/:id
const deleteVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findByIdAndDelete(req.params.id);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
        }
        res.json({ success: true, message: 'Đã xóa voucher' });
    } catch (error) {
        console.error('Delete voucher error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// =============================================
// USER: Áp dụng voucher
// =============================================

// @desc    Kiểm tra & áp dụng voucher vào đơn hàng
// @route   POST /api/vouchers/apply
const applyVoucher = async (req, res) => {
    try {
        const { code, orderTotal } = req.body;

        if (!code || !orderTotal) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã voucher và tổng đơn hàng',
            });
        }

        const voucher = await Voucher.findOne({ code: code.toUpperCase() });
        if (!voucher) {
            console.log(`[Voucher] Not found:`, code.toUpperCase());
            return res.status(404).json({ success: false, message: 'Mã voucher không tồn tại' });
        }

        console.log(`[Voucher Debug] code: ${code}, isValid: ${voucher.isValid}, isActive: ${voucher.isActive}, now>=start: ${new Date() >= voucher.startDate}, now<=end: ${new Date() <= voucher.endDate}, orderTotal: ${orderTotal}, minOrder: ${voucher.minOrderValue}`);

        // Kiểm tra hiệu lực
        if (!voucher.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Voucher đã hết hạn hoặc hết lượt sử dụng',
            });
        }

        // Kiểm tra đơn tối thiểu
        if (orderTotal < voucher.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng voucher này`,
            });
        }

        // Tính tiền giảm
        let discount = 0;
        if (voucher.discountType === 'percent') {
            discount = Math.round((orderTotal * voucher.discountValue) / 100);
            // Áp dụng giới hạn giảm tối đa
            if (voucher.maxDiscount && discount > voucher.maxDiscount) {
                discount = voucher.maxDiscount;
            }
        } else {
            // fixed
            discount = voucher.discountValue;
        }

        // Đảm bảo giảm không vượt quá tổng đơn
        if (discount > orderTotal) {
            discount = orderTotal;
        }

        res.json({
            success: true,
            message: `Áp dụng voucher thành công! Giảm ${discount.toLocaleString('vi-VN')}đ`,
            data: {
                voucherId: voucher._id,
                code: voucher.code,
                discountType: voucher.discountType,
                discountValue: voucher.discountValue,
                discount,
                newTotal: orderTotal - discount,
            },
        });
    } catch (error) {
        console.error('Apply voucher error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = {
    getVouchers,
    getVoucherById,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    applyVoucher,
};
