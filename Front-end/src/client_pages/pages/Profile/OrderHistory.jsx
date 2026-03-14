import { useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Tabs, Pagination, Modal, Steps } from "antd";

const OrderHistory = ({ orders, handleReorder }) => {
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getStepCurrent = (status) => {
    if (status === 'Cancelled') return -1;
    switch (status) {
      case 'Processing': return 1;
      case 'Shipped': return 2;
      case 'Delivered': return 3;
      default: return 0;
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  const filteredOrders = activeTab === "All" 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full text-xs font-semibold">Chờ xác nhận</span>;
      case 'Processing': return <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded-full text-xs font-semibold">Đang chuẩn bị</span>;
      case 'Shipped': return <span className="text-purple-500 bg-purple-50 px-2 py-1 rounded-full text-xs font-semibold">Đang giao</span>;
      case 'Delivered': return <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full text-xs font-semibold">Đã giao</span>;
      case 'Cancelled': return <span className="text-red-500 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold">Đã hủy</span>;
      default: return <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-10">
      <h3 className="text-2xl font-bold mb-6 text-emerald-500 flex justify-between items-center">
        Lịch sử đơn hàng
      </h3>

      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        items={[
          { key: 'All', label: 'Tất cả' },
          { key: 'Pending', label: 'Chờ xác nhận' },
          { key: 'Processing', label: 'Đang chuẩn bị' },
          { key: 'Shipped', label: 'Đang giao' },
          { key: 'Delivered', label: 'Đã giao' },
          { key: 'Cancelled', label: 'Đã hủy' },
        ]}
        className="mb-6 font-medium"
        tabBarStyle={{ marginBottom: 24 }}
      />

      {filteredOrders.length === 0 ? (
        <div className="text-center py-10">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500">Bạn chưa có đơn hàng nào cả.</p>
          <Link to="/shop" className="text-pink-500 hover:text-pink-600 font-medium mt-2 inline-block">Bắt đầu mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <div key={order._id} className="border border-gray-100 hover:border-emerald-200 bg-white p-5 rounded-2xl transition shadow-sm group">
              <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Mã ĐH: <span className="font-mono text-gray-800 font-medium">{order.orderCode}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="mb-1">{getStatusBadge(order.status)}</div>
                  <p className="text-pink-500 font-bold">{order.totalPrice.toLocaleString()} đ</p>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                {order.orderItems?.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <img
                      src={item.product?.images?.[0]?.url || "https://placehold.co/40"}
                      alt={item.product?.name || "Sản phẩm"}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 line-clamp-1">{item.product?.name || "Hoa Thiết Kế"}</p>
                      <p className="text-xs font-medium text-gray-500 bg-gray-100 w-fit px-2 py-0.5 rounded-md mt-1">x{item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-700">{(item.price * item.quantity).toLocaleString()} đ</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-between items-center border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  Thanh toán: <span className="font-semibold text-gray-800">{order.paymentMethod}</span>
                </p>
                
                <div className="flex gap-3">
                  {order.status === 'Delivered' && (
                    <>
                      <Link
                        to="/shop"
                        className="text-yellow-500 hover:text-white hover:bg-yellow-500 px-4 py-2 rounded-lg text-sm font-semibold border border-yellow-500 transition-all duration-300 shadow-sm hover:shadow"
                      >
                        Đánh giá
                      </Link>
                      <button
                        onClick={() => handleReorder(order)}
                        className="text-pink-500 hover:text-white hover:bg-pink-500 px-4 py-2 rounded-lg text-sm font-semibold border border-pink-500 transition-all duration-300 shadow-sm hover:shadow"
                      >
                        Mua lại
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleOpenOrderDetail(order)}
                    className="text-emerald-500 hover:text-white hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-500 transition-all duration-300 shadow-sm hover:shadow"
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredOrders.length > pageSize && (
            <div className="flex justify-center mt-8 pt-4 border-t border-gray-100">
              <Pagination 
                current={currentPage} 
                pageSize={pageSize} 
                total={filteredOrders.length} 
                onChange={(page) => setCurrentPage(page)} 
                showSizeChanger={false}
                className="CustomPagination"
              />
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      <Modal
        title={<span className="text-emerald-600 font-bold text-lg">Chi tiết đơn hàng {selectedOrder?.orderCode}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <div className="space-y-6 mt-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="font-semibold text-gray-800 mb-2 border-b pb-2">Thông tin nhận hàng</h4>
              <p className="text-sm text-gray-600"><span className="font-medium">Người nhận:</span> {selectedOrder.shippingInfo?.fullName} - {selectedOrder.shippingInfo?.phone}</p>
              <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Địa chỉ:</span> {selectedOrder.shippingInfo?.address}</p>
              {selectedOrder.shippingInfo?.note && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Ghi chú:</span> {selectedOrder.shippingInfo?.note}</p>}
            </div>

            <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
              <h4 className="font-semibold text-emerald-600 mb-6">Trạng thái vận chuyển</h4>
              {selectedOrder.status === 'Cancelled' ? (
                <div className="text-center text-red-500 font-bold py-4 bg-red-50 rounded-lg">Đơn hàng đã bị hủy</div>
              ) : (
                <Steps
                  current={getStepCurrent(selectedOrder.status)}
                  items={[
                    { title: 'ChỜ xác nhận', description: 'Đơn hàng mới' },
                    { title: 'Đang chuẩn bị', description: 'Gói hoa' },
                    { title: 'Đang giao', description: 'Shipper đang đi' },
                    { title: 'Đã giao', description: 'Thành công' },
                  ]}
                />
              )}
            </div>

            {selectedOrder.voucher && (
              <div className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg flex justify-between">
                <span>Voucher áp dụng: <b>{selectedOrder.voucher}</b></span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderHistory;
