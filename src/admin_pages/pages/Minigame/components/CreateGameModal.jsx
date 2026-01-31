import React from 'react';
import { Modal, Form, Input, Select, DatePicker, Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const CreateGameModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Format dữ liệu để gửi ra ngoài
      const newGame = {
        key: Date.now(),
        id: `GAME-${Math.floor(Math.random() * 1000)}`,
        name: values.name,
        type: values.type,
        status: values.status,
        participants: 0,
        startDate: values.time ? values.time[0].format('DD/MM/YYYY') : '',
        endDate: values.time ? values.time[1].format('DD/MM/YYYY') : '',
        image: 'https://img.freepik.com/free-vector/fortune-wheel-vector-illustration_1284-11915.jpg' // Ảnh giả lập
      };
      
      onCreate(newGame);
      form.resetFields();
      message.success('Tạo chiến dịch game mới thành công!');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Tạo Chiến Dịch Minigame Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Tạo Game"
      cancelText="Hủy"
      centered
      className="custom-modal-metrix"
    >
      <Form form={form} layout="vertical" className="mt-4" initialValues={{ type: 'Wheel', status: 'Pending' }}>
        <Form.Item name="name" label="Tên chiến dịch" rules={[{ required: true, message: 'Nhập tên game!' }]}>
          <Input placeholder="VD: Vòng quay may mắn Tết 2026" className="rounded-xl h-[40px]" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="type" label="Loại Game">
            <Select className="rounded-xl h-[40px] custom-select-metrix">
              <Option value="Wheel">Vòng Quay (Lucky Wheel)</Option>
              <Option value="Flip">Lật Thẻ (Flip Card)</Option>
              <Option value="Shake">Lắc Xì (Shake)</Option>
              <Option value="Gacha">Hộp Quà (Gacha)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Trạng thái khởi tạo">
            <Select className="rounded-xl h-[40px] custom-select-metrix">
              <Option value="Pending">Sắp diễn ra</Option>
              <Option value="Active">Hoạt động ngay</Option>
              <Option value="Closed">Đóng tạm thời</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="time" label="Thời gian diễn ra" rules={[{ required: true }]}>
          <RangePicker showTime className="w-full rounded-xl h-[40px] border-none bg-[#F4F7FE]" />
        </Form.Item>

        <Form.Item label="Banner / Ảnh đại diện">
           <Upload listType="picture-card" showUploadList={false}>
              <div>
                 <PlusOutlined />
                 <div className="mt-2 text-xs">Upload</div>
              </div>
           </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateGameModal;