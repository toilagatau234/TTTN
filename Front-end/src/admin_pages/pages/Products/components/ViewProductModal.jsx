import React from 'react';
import { Modal, Row, Col, Typography, Tag, Divider, Image, Badge, Descriptions } from 'antd';
import {
  DollarCircleOutlined,
  ShopOutlined,
  TagsOutlined,
  FileTextOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ViewProductModal = ({ open, onCancel, data }) => {
  if (!data) return null;

  const getStatusTag = (status) => {
    let color = 'green';
    let text = 'Đang bán';
    if (status === 'out_of_stock') { color = 'red'; text = 'Hết hàng'; }
    if (status === 'inactive') { color = 'default'; text = 'Ngừng bán'; }
    return <Tag color={color} className="rounded-md font-medium">{text}</Tag>;
  };

  const images = data.images && data.images.length > 0 ? data.images : [];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-brand-500 rounded-full"></div>
          <Title level={4} className="m-0 text-navy-700 font-bold">
            Chi tiết sản phẩm
          </Title>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
      className="view-product-modal"
    >
      <Row gutter={[24, 24]} className="mt-5">
        {/* Left: Images */}
        <Col xs={24} md={10}>
          <div className="flex flex-col gap-3">
            <Image
              src={images.length > 0 ? images[0].url : 'https://placehold.co/400x400?text=No+Image'}
              className="rounded-2xl border border-gray-100 object-cover w-full aspect-square shadow-sm"
              alt={data.name}
            />
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1, 5).map((img, index) => (
                  <Image
                    key={index}
                    src={img.url}
                    className="rounded-xl border border-gray-100 object-cover aspect-square cursor-pointer hover:opacity-80 transition"
                    alt={`${data.name}-${index}`}
                  />
                ))}
              </div>
            )}
          </div>
        </Col>

        {/* Right: Info */}
        <Col xs={24} md={14}>
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Title level={3} className="m-0 text-navy-700 font-bold leading-tight">
                  {data.name}
                </Title>
                <Text type="secondary" className="text-xs">
                  ID: #{data._id?.slice(-6).toUpperCase() || 'N/A'}
                </Text>
              </div>
              {getStatusTag(data.status)}
            </div>

            <div className="flex items-center gap-2 mb-4">
              {data.isHot && <Tag color="error" className="font-semibold flex items-center gap-1 border-none bg-red-50 text-red-500 rounded-md py-0.5 px-2">🔥 Hot</Tag>}
              {data.isNewProduct && <Tag color="processing" className="font-semibold flex items-center gap-1 border-none bg-blue-50 text-blue-500 rounded-md py-0.5 px-2">✨ New</Tag>}
            </div>

            {/* Price Section */}
            <div className="bg-light-primary/50 backdrop-blur-sm p-4 rounded-2xl mb-4 flex items-baseline gap-3 border border-brand-100/30">
              <span className="text-2xl font-bold text-brand-500">
                {data.price?.toLocaleString()} ₫
              </span>
              {data.originalPrice && data.originalPrice > data.price && (
                <Text delete type="secondary" className="text-sm">
                  {data.originalPrice.toLocaleString()} ₫
                </Text>
              )}
            </div>

            {/* Core Specs Card */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/80 mb-4">
              <Descriptions column={2} size="small" className="view-product-descriptions">
                <Descriptions.Item label={<span className="flex items-center gap-1 text-gray-500"><TagsOutlined className="text-xs" /> Danh mục</span>}>
                  <Tag color="cyan" className="border-none m-0 font-medium">{data.category?.name || 'N/A'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="flex items-center gap-1 text-gray-500"><ShopOutlined className="text-xs" /> Tồn kho</span>}>
                  <Text strong>{data.stock || 0}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-gray-500">Đã bán</span>}>
                  <Text strong>{data.sold || 0}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-gray-500">Đánh giá</span>}>
                  <Text strong className="text-amber-500">⭐ {data.averageRating || 0}/5</Text>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Description Card */}
            <div className="flex-1 bg-gray-50/50 p-4 rounded-xl border border-gray-100/80">
              <Title level={5} className="flex items-center gap-1 text-navy-700 m-0 mb-2 text-sm font-bold">
                <FileTextOutlined className="text-sm" /> Mô tả sản phẩm
              </Title>
              <Paragraph className="text-gray-600 text-sm max-h-[160px] overflow-y-auto pr-1 m-0 leading-relaxed">
                {data.description || 'Không có mô tả cho sản phẩm này.'}
              </Paragraph>
            </div>
            
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

export default ViewProductModal;
