import React from 'react';
import { Drawer, Tag, Divider, Avatar, List, Row, Col, Card, Statistic } from 'antd';
import { 
  UserOutlined, 
  EnvironmentOutlined, 
  PhoneOutlined, 
  CreditCardOutlined, 
  CalendarOutlined,
  ShoppingOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const ViewOrderDetailDrawer = ({ open, onClose, order }) => {
  if (!order) return null;

  const renderStatus = (status) => {
    let color = 'gold';
    let text = status;
    switch (status) {
      case 'pending': color = 'orange'; text = 'Chờ xử lý'; break;
      case 'confirmed': color = 'cyan'; text = 'Đã xác nhận'; break;
      case 'processing': color = 'blue'; text = 'Đang chuẩn bị'; break;
      case 'shipping': color = 'purple'; text = 'Đang giao'; break;
      case 'delivered': color = 'green'; text = 'Đã giao'; break;
      case 'cancelled': color = 'red'; text = 'Đã hủy'; break;
    }
    return <Tag color={color} className="font-bold">{text.toUpperCase()}</Tag>;
  };

  const renderPaymentMethod = (method) => {
    const map = { cod: 'Thanh toán COD', banking: 'Chuyển khoản', momo: 'Momo', zalopay: 'Zalopay' };
    return map[method] || method;
  };

  return (
    <Drawer
      title={<span className="font-bold text-navy-700">Chi tiết đơn hàng: {order.orderCode}</span>}
      placement="right"
      onClose={onClose}
      open={open}
      size="large"
      className="custom-drawer-metrix"
    >
      {/* --- QUICK OVERVIEW ROW --- */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl mb-6">
        <div>
          <span className="text-gray-400 text-xs">Ngày đặt</span>
          <p className="font-bold text-navy-700 m-0">
            {order.createdAt ? dayjs(order.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-gray-400 text-xs d-block mb-1">Trạng thái</span>
          {renderStatus(order.status)}
        </div>
      </div>

      <Row gutter={16} className="mb-6">
        {/* --- SHIPPING INFO --- */}
        <Col span={12}>
          <Card title={<><UserOutlined className="mr-2" /> Thông tin khách hàng</>} size="small" className="rounded-xl h-full shadow-sm">
            <p className="m-0 font-bold text-navy-700">{order.shippingInfo?.fullName}</p>
            <p className="text-gray-500 m-0 text-sm flex items-center gap-1 mt-1"><PhoneOutlined /> {order.shippingInfo?.phone}</p>
            <p className="text-gray-500 m-0 text-sm flex items-center gap-1 mt-1"><EnvironmentOutlined /> {order.shippingInfo?.address}</p>
            {order.shippingInfo?.ward && <p className="text-gray-400 text-xs m-0 mt-1">{order.shippingInfo.ward}, {order.shippingInfo.district}, {order.shippingInfo.city}</p>}
            {order.shippingInfo?.note && (
              <div className="mt-2 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700">
                <strong>Ghi chú:</strong> {order.shippingInfo.note}
              </div>
            )}
          </Card>
        </Col>

        {/* --- PAYMENT INFO --- */}
        <Col span={12}>
          <Card title={<><CreditCardOutlined className="mr-2" /> Thanh toán & Giá</>} size="small" className="rounded-xl h-full shadow-sm">
            <p className="m-0 text-sm"><strong>Phương thức:</strong> {renderPaymentMethod(order.paymentMethod)}</p>
            <p className="m-0 text-sm mt-1"><strong>Trạng thái:</strong> <Tag color={order.isPaid ? 'green' : 'red'}>{order.isPaid ? 'Đã trả' : 'Chưa trả'}</Tag></p>
            <Divider className="my-2" />
            <div className="flex justify-between text-sm"><span>Tiền hàng:</span> <span className="font-bold">{(order.itemsPrice || 0).toLocaleString()} ₫</span></div>
            <div className="flex justify-between text-sm"><span>Phí ship:</span> <span className="font-bold">+{(order.shippingPrice || 0).toLocaleString()} ₫</span></div>
            <div className="flex justify-between text-sm"><span>Giảm giá:</span> <span className="font-bold text-red-500">-{(order.discountPrice || 0).toLocaleString()} ₫</span></div>
            <Divider className="my-2" />
            <div className="flex justify-between items-center"><span className="font-bold text-navy-700">Tổng cộng:</span> <span className="text-xl font-bold text-brand-500">{(order.totalPrice || 0).toLocaleString()} ₫</span></div>
          </Card>
        </Col>
      </Row>

      {/* --- ITEMS LIST --- */}
      <h4 className="font-bold text-navy-700 flex items-center gap-2 mb-3"><ShoppingOutlined /> Danh sách sản phẩm ({order.items?.length || 0})</h4>
      <List
        dataSource={order.items || []}
        className="bg-white rounded-xl border p-2"
        renderItem={(item) => (
          <List.Item className="border-none hover:bg-gray-50 p-3 rounded-lg flex items-center justify-between mb-1">
            <List.Item.Meta
              avatar={<Avatar src={item.image} shape="square" size={48} icon={<FileTextOutlined />} className="rounded-lg" />}
              title={<span className="font-bold text-navy-700 text-sm">{item.name}</span>}
              description={
                <span className="text-gray-400 text-xs">
                  {item.isCustom ? <Tag color="pink" className="text-[10px]">Custom AI</Tag> : `Đơn giá: ${(item.price || 0).toLocaleString()} ₫`}
                </span>
              }
            />
            <div className="text-right">
              <span className="text-gray-500 text-xs">x{item.quantity}</span>
              <p className="font-bold text-navy-700 m-0 text-sm">
                {(item.price * item.quantity).toLocaleString()} ₫
              </p>
            </div>
          </List.Item>
        )}
      />

    </Drawer>
  );
};

export default ViewOrderDetailDrawer;
