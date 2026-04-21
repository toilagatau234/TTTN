import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { message } from "antd";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import paymentService from "../../../services/paymentService";

const VnpayReturn = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await paymentService.verifyVnpayReturn(location.search);
        if (res?.success) {
          setResult(res.data);
          if (res.data?.paymentStatus === "success") {
            message.success("Thanh toán VNPAY thành công");
            window.dispatchEvent(new Event("cartUpdated"));
          } else {
            message.error("Thanh toán VNPAY thất bại");
          }
        } else {
          message.error("Không xác minh được kết quả thanh toán");
        }
      } catch (e) {
        message.error(e?.response?.data?.message || "Lỗi xác minh thanh toán VNPAY");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [location.search]);

  const orderCode = result?.order?.orderCode;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-emerald-500">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p>Đang xác minh thanh toán VNPAY...</p>
      </div>
    );
  }

  const isSuccess = result?.paymentStatus === "success";

  return (
    <div className="min-h-screen bg-[#fffafc] py-20 flex justify-center px-4">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl border border-emerald-100 p-10 text-center flex flex-col items-center">
        <div className={`w-20 h-20 ${isSuccess ? "bg-emerald-100 text-emerald-500" : "bg-red-100 text-red-500"} rounded-full flex items-center justify-center mb-6`}>
          {isSuccess ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
        </h1>
        {orderCode && (
          <p className="text-gray-500 mb-8">
            Mã đơn hàng: <span className="font-bold text-emerald-500">{orderCode}</span>
          </p>
        )}
        <div className="flex gap-4 w-full">
          <Link to="/shop" className="flex-1 bg-pink-50 text-pink-500 font-medium py-3 rounded-xl hover:bg-pink-100 transition">
            Tiếp tục mua sắm
          </Link>
          <Link to="/profile/orders" className="flex-1 bg-emerald-400 text-white font-medium py-3 rounded-xl hover:bg-emerald-500 transition shadow-md">
            Xem đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VnpayReturn;
