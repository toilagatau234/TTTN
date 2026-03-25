import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Switch, Button, message, Row, Col } from 'antd';
import { PercentageOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const UpdateVoucherModal = ({ open, onCancel, onUpdate, voucher }) => {
  const [form] = Form.useForm();
  const [discountType, setDiscountType] = useState('percent');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && voucher) {
      setDiscountType(voucher.discountType || 'percent');
      form.setFieldsValue({
        code: voucher.code,
        description: voucher.description,
        type: voucher.discountType,
        value: voucher.discountValue,
        maxDiscount: voucher.maxDiscount,
        minOrder: voucher.minOrderValue,
        limit: voucher.usageLimit,
        time: [
          voucher.startDate ? dayjs(voucher.startDate) : null,
          voucher.endDate ? dayjs(voucher.endDate) : null
        ],
        isActive: voucher.isActive
      });
    }
  }, [open, voucher, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        code: values.code.toUpperCase(),
        description: values.description,
        discountType: values.type,
        discountValue: Number(values.value),
        maxDiscount: values.type === 'percent' ? Number(values.maxDiscount) : null,
        minOrderValue: Number(values.minOrder) || 0,
        usageLimit: Number(values.limit) || null,
        startDate: values.time ? values.time[0].toISOString() : undefined,
        endDate: values.time ? values.time[1].toISOString() : undefined,
        isActive: values.isActive
      };

      console.log('Update Voucher Payload:', payload);

      await onUpdate(voucher._id, payload);
      message.success('Cập nhật mã giảm giá thành công!');
    } catch (error) {
      console.error('Update Failed:', error.response?.data || error.message || error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Chỉnh Sửa Mã Giảm Giá</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={700}
      okText="Cập nhật"
      cancelText="Hủy"
      centered
      confirmLoading={loading}
      className="custom-modal-metrix"
    >
      <Form 
        form={form} 
        layout="vertical" 
        className="mt-5"
      >
        <Row gutter={16}>
          <Col span={12}>
             <Form.Item label="Mã Voucher (Code)" name="code" rules={[{ required: true, message: 'Cần có mã code' }]}>
               <Input 
                 placeholder="VD: TET2026" 
                 className="rounded-xl h-[40px] font-bold uppercase text-brand-500" 
                 disabled // Thường không nên đổi mã code voucher nếu đã phát hành? Hoặc có thể mở khóa nếu user muốn
               />
             </Form.Item>
          </Col>
          <Col span={12}>
             <Form.Item label="Mô tả / Tên" name="description">
               <Input placeholder="VD: Khuyến mãi Tết" className="rounded-xl h-[40px]" />
             </Form.Item>
          </Col>
        </Row>

        <div className="bg-gray-50 p-4 rounded-xl mb-4">
           <Row gutter={16}>
             <Col span={8}>
               <Form.Item label="Loại giảm giá" name="type">
                 <Select 
                    className="rounded-xl h-[40px] custom-select-metrix" 
                    onChange={setDiscountType}
                    disabled // Không nên đổi loại giảm giá sau khi tạo
                 >
                   <Option value="percent"><PercentageOutlined /> Theo phần trăm</Option>
                   <Option value="fixed"><DollarOutlined /> Số tiền cố định</Option>
                 </Select>
               </Form.Item>
             </Col>
             <Col span={8}>
               <Form.Item 
                  label="Giá trị giảm" 
                  name="value" 
                  rules={[{ required: true }]}
                >
                 <InputNumber 
                    className="w-full rounded-xl h-[40px] flex items-center pt-1 font-bold"
                    formatter={value => discountType === 'percent' ? `${value}%` : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/%|\s?|,/g, '')}
                 />
               </Form.Item>
             </Col>
             
             {discountType === 'percent' && (
               <Col span={8}>
                 <Form.Item label="Giảm tối đa (VNĐ)" name="maxDiscount">
                   <InputNumber 
                      className="w-full rounded-xl h-[40px] flex items-center pt-1" 
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      placeholder="Không giới hạn"
                   />
                 </Form.Item>
               </Col>
             )}
           </Row>

           <Row gutter={16}>
             <Col span={12}>
               <Form.Item label="Đơn hàng tối thiểu (VNĐ)" name="minOrder">
                 <InputNumber 
                    className="w-full rounded-xl h-[40px] flex items-center pt-1" 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="0"
                 />
               </Form.Item>
             </Col>
             <Col span={12}>
               <Form.Item label="Tổng lượt dùng tối đa" name="limit">
                 <InputNumber className="w-full rounded-xl h-[40px] flex items-center pt-1" placeholder="Vô hạn" />
               </Form.Item>
             </Col>
           </Row>
        </div>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item label="Thời gian áp dụng" name="time" rules={[{ required: true }]}>
               <RangePicker showTime className="w-full rounded-xl h-[40px] bg-[#F4F7FE] border-none" />
            </Form.Item>
          </Col>
          <Col span={8}>
             <Form.Item label="Kích hoạt" name="isActive" valuePropName="checked">
               <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
             </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default UpdateVoucherModal;
