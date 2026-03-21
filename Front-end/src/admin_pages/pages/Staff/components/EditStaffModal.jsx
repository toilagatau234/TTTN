import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import userService from '../../../../services/userService';

const { Option } = Select;

const EditStaffModal = ({ open, onCancel, onUpdate, staff }) => {
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (open && staff) {
      form.setFieldsValue({
        name: staff.name,
        phone: staff.phone,
        email: staff.email,
        role: staff.role,
        department: staff.department,
      });
    }
  }, [open, staff, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      
      const response = await userService.update(staff._id, {
        name: values.name,
        phone: values.phone,
        role: values.role,
        department: values.department,
      });

      if (response.success) {
        message.success('Cập nhật nhân viên thành công!');
        onUpdate(response.data);
      } else {
        message.error(response.message || 'Lỗi khi cập nhật');
      }
    } catch (error) {
      if (error.response && error.response.data) {
         message.error(error.response.data.message || 'Lỗi khi cập nhật');
      } else {
         console.log('Validate Failed:', error);
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Sửa Hồ Sơ Nhân Viên</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      width={700}
      okText="Cập nhật"
      cancelText="Hủy"
      centered
    >
      <Form form={form} layout="vertical" className="mt-5">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input prefix={<UserOutlined className="text-gray-400" />} className="rounded-xl h-[40px]" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}>
              <Input prefix={<PhoneOutlined className="text-gray-400" />} className="rounded-xl h-[40px]" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="email" label="Email đăng nhập">
              <Input prefix={<MailOutlined className="text-gray-400" />} disabled className="rounded-xl h-[40px] bg-gray-50" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="role" label="Chức vụ / Vai trò">
              <Select className="h-[40px] custom-select-metrix rounded-xl">
                <Option value="Admin">Admin</Option>
                <Option value="Manager">Manager</Option>
                <Option value="Sale">Sale</Option>
                <Option value="Warehouse">Warehouse</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="department" label="Bộ phận" rules={[{ required: true, message: 'Vui lòng chọn bộ phận' }]}>
               <Select className="h-[40px] custom-select-metrix rounded-xl" placeholder="Chọn bộ phận">
                 <Option value="Kinh doanh">Kinh doanh</Option>
                 <Option value="Kho vận">Kho vận</Option>
                 <Option value="Marketing">Marketing</Option>
                 <Option value="CSKH">CSKH</Option>
                 <Option value="Kế toán">Kế toán</Option>
                 <Option value="Hành chính">Hành chính Nhân sự</Option>
                 <Option value="Ban Giám Đốc">Ban Giám Đốc</Option>
               </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditStaffModal;
