import React, { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Switch, Button, message, Row, Col, Divider } from 'antd';
import { ReloadOutlined, PercentageOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import voucherService from '../../../../services/voucherService';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const CreateVoucherModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [discountType, setDiscountType] = useState('percent'); // 'percent' hoặc 'fixed'
  const [loading, setLoading] = useState(false);

  // Hàm tạo mã ngẫu nhiên
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setFieldsValue({ code: `FLW-${code}` });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        code: values.code.toUpperCase(),
        description: values.description,
        discountType: values.type,
        discountValue: Number(values.value), // Ensure number
        maxDiscount: values.type === 'percent' ? Number(values.maxDiscount) : null,
        minOrderValue: Number(values.minOrder) || 0,
        usageLimit: Number(values.limit) || null,
        startDate: values.time ? values.time[0].toISOString() : undefined,
        endDate: values.time ? values.time[1].toISOString() : undefined,
        isActive: values.isActive
      };

      console.log('Voucher Payload:', payload); // Debug log

      const response = await voucherService.create(payload);
      if (response && response.success) {
        message.success('Tạo mã giảm giá thành công!');
        form.resetFields();
        onCreate();
      } else {
         message.error(response?.message || 'Tạo mã thất bại');
      }
    } catch (error) {
      console.error('Create Failed:', error.response?.data || error.message || error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo mã');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Tạo Mã Giảm Giá Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={700}
      okText="Lưu Mã"
      cancelText="Hủy"
      centered
      confirmLoading={loading}
      className="custom-modal-metrix"
    >
      <Form 
        form={form} 
        layout="vertical" 
        className="mt-5"
        initialValues={{ 
          type: 'percent', 
          isActive: true, 
          limit: 100 
        }}
      >
        {/* --- MÃ CODE & TÊN --- */}
        <Row gutter={16}>
          <Col span={12}>
             <Form.Item label="Mã Voucher (Code)" name="code" rules={[{ required: true, message: 'Cần có mã code' }]}>
               <Input 
                 placeholder="VD: TET2026" 
                 className="rounded-xl h-[40px] font-bold uppercase text-brand-500" 
                 suffix={<ReloadOutlined onClick={generateCode} className="cursor-pointer hover:text-brand-500" />}
               />
             </Form.Item>
          </Col>
          <Col span={12}>
             <Form.Item label="Tên chương trình" name="name" rules={[{ required: true }]}>
               <Input placeholder="VD: Khuyến mãi Tết" className="rounded-xl h-[40px]" />
             </Form.Item>
          </Col>
        </Row>

        {/* --- CẤU HÌNH GIẢM GIÁ --- */}
        <div className="bg-gray-50 p-4 rounded-xl mb-4">
           <Row gutter={16}>
             <Col span={8}>
               <Form.Item label="Loại giảm giá" name="type">
                 <Select 
                    className="rounded-xl h-[40px] custom-select-metrix" 
                    onChange={setDiscountType}
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
                    className="w-full rounded-xl h-[40px] flex items-center pt-1"
                    formatter={value => (value || value === 0) ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                    parser={value => value.replace(/\./g, '')}
                    suffix={discountType === 'percent' ? '%' : ''}
                    min={0}
                  />
               </Form.Item>
             </Col>
             
             {/* Chỉ hiện 'Giảm tối đa' nếu chọn theo % */}
             {discountType === 'percent' && (
               <Col span={8}>
                 <Form.Item label="Giảm tối đa" name="maxDiscount">
                   <InputNumber 
                      className="w-full rounded-xl h-[40px] flex items-center pt-1" 
                      formatter={value => (value || value === 0) ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                      parser={value => value.replace(/\./g, '')}
                      suffix=""
                      placeholder="Không giới hạn"
                      min={0}
                   />
                 </Form.Item>
               </Col>
             )}
           </Row>

           <Row gutter={16}>
             <Col span={12}>
               <Form.Item label="Đơn hàng tối thiểu" name="minOrder">
                 <InputNumber 
                    className="w-full rounded-xl h-[40px] flex items-center pt-1" 
                    formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                    parser={value => value.replace(/\s?|,/g, '')}
                    suffix=""
                    placeholder="0"
                    min={0}
                 />
               </Form.Item>
             </Col>
             <Col span={12}>
               <Form.Item label="Tổng lượt dùng tối đa" name="limit">
                 <InputNumber className="w-full rounded-xl h-[40px] flex items-center pt-1" placeholder="Vô hạn" min={0} />
               </Form.Item>
             </Col>
           </Row>
        </div>

        {/* --- THỜI GIAN & TRẠNG THÁI --- */}
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item label="Thời gian áp dụng" name="time" rules={[{ required: true }]}>
               <RangePicker showTime className="w-full rounded-xl h-[40px] bg-[#F4F7FE] border-none" />
            </Form.Item>
          </Col>
          <Col span={8}>
             <Form.Item label="Kích hoạt ngay" name="isActive" valuePropName="checked">
               <Switch checkedChildren="Bật" unCheckedChildren="Tắt" defaultChecked />
             </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Mô tả / Ghi chú">
          <TextArea rows={2} placeholder="Điều kiện áp dụng..." className="rounded-xl" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateVoucherModal;