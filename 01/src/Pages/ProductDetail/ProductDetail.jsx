import { useState } from "react";
import { Star } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import products from "../../data/products/products";
import { useNavigate } from "react-router-dom";
const ProductDetail = () => {

 const navigate = useNavigate();
 const { id } = useParams();

  const product = products.find(
    (item) => item.id === Number(id)
  );

  if (!product) {
    return (
      <div className="p-10 text-center text-gray-500">
        Không tìm thấy sản phẩm 😢
      </div>
    );
  }
  const avatars = products.slice(0, 4).map(p => p.images[0]);
  const [mainImage, setMainImage] = useState(product?.images?.[0] || ""); 
  const [quantity, setQuantity] = useState(1);

  const reviews = [
  {
    name: "Nguyễn Minh Anh",
    rating: 5,
    date: "20/02/2026",
    content:
      "Hoa rất tươi và giao hàng nhanh. Đóng gói cực kỳ đẹp, mình rất hài lòng!",
  },
  {
    name: "Trần Hoàng My",
    rating: 4,
    date: "18/02/2026",
    content:
      "Hoa đẹp, giống hình. Chỉ hơi trễ 30 phút nhưng vẫn chấp nhận được.",
  },
  {
    name: "Lê Thanh Huyền",
    rating: 5,
    date: "15/02/2026",
    content:
      "Shop tư vấn rất nhiệt tình, hoa nhận được còn đẹp hơn trong ảnh.",
  },
  {
    name: "Phạm Gia Bảo",
    rating: 4,
    date: "12/02/2026",
    content:
      "Giao nhanh, hoa tươi. Sẽ ủng hộ shop lần sau.",
  },
  ];

  const [reviewPage, setReviewPage] = useState(1);
    const reviewsPerPage = 3;

    const totalReviewPages = Math.ceil(
      reviews.length / reviewsPerPage
    );

    const startIndex = (reviewPage - 1) * reviewsPerPage;
    const currentReviews = reviews.slice(
      startIndex,
      startIndex + reviewsPerPage
    );

  return (
    <div className="bg-[#fffafc] min-h-screen py-16 px-6">

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">

        {/* IMAGE SECTION */}
        <div>
          <div className="rounded-3xl overflow-hidden shadow-lg mb-6">
            <img
              src={mainImage}
              alt="main"
              className="w-full h-[500px] object-cover"
            />
          </div>

          <div className="flex gap-4">
            {product.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt=""
                onClick={() => setMainImage(img)}
                className={`w-24 h-24 object-cover rounded-xl cursor-pointer border-2 ${
                  mainImage === img
                    ? "border-pink-500"
                    : "border-transparent"
                }`}
              />
            ))}
          </div>
        </div>

        {/* INFO SECTION */}
        <div>

          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            {product.name}
          </h1>

          <p className="text-pink-500 text-3xl font-bold mb-4">
            {product.price.toLocaleString()} đ
          </p>

          <p className="text-gray-600 mb-6">
            {product.description}
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Danh mục: {product.category}
          </p>

          <div className="flex items-center gap-4 mt-3 text-sm">

            <div className="flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full">
              <span className="text-yellow-400">★</span>
              <span className="text-gray-700 font-medium">
                {product.rating}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full">
              <span className="text-emerald-400">✔</span>
              <span className="text-gray-600">
                {product.sold} đã bán
              </span>
            </div>

          </div>

        <div className="mt-8">
            <h3 className="text-lg font-semibold text-emerald-500 mb-4">
              Chính sách của shop
            </h3>

            <div className="space-y-3">
              
              <div className="flex items-center gap-3 bg-white shadow-sm rounded-xl p-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 text-pink-400 hover:bg-pink-100 hover:scale-105 transition duration-300">
                  ✓
                </div>
                <p className="text-gray-600 text-sm">
                  Cam kết hoa tươi 100%
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white shadow-sm rounded-xl p-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 text-pink-400 hover:bg-pink-100 hover:scale-105 transition duration-300">
                  ✓
                </div>
                <p className="text-gray-600 text-sm">
                  Hoàn tiền nếu sản phẩm lỗi
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white shadow-sm rounded-xl p-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 text-pink-400 hover:bg-pink-100 hover:scale-105 transition duration-300">
                  ✓
                </div>
                <p className="text-gray-600 text-sm">
                  Giao nhanh trong 2-4 giờ
                </p>
              </div>

            </div>
        </div>

          <div className="mt-6">
              <h3 className="text-base font-semibold text-emerald-500 mb-3">
                Thông tin bổ sung
              </h3>

              <div className="grid grid-cols-2 gap-3 text-sm">

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border border-pink-300 
                                  text-pink-400 flex items-center justify-center text-xs">
                    🌸
                  </div>
                  <span className="text-gray-600">
                    Hoa nhập khẩu
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border border-pink-300 
                                  text-pink-400 flex items-center justify-center text-xs">
                    🎀
                  </div>
                  <span className="text-gray-600">
                    Gói quà miễn phí
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border border-pink-300 
                                  text-pink-400 flex items-center justify-center text-xs">
                    🚚
                  </div>
                  <span className="text-gray-600">
                    Giao nhanh 2–4h
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border border-pink-300 
                                  text-pink-400 flex items-center justify-center text-xs">
                    💐
                  </div>
                  <span className="text-gray-600">
                    Bảo quản 3–5 ngày
                  </span>
                </div>

              </div>
            </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full 
                          border border-pink-300 
                          text-pink-400 
                          hover:bg-pink-100 
                          transition"
              >
                -
              </button>

              <span className="text-base font-medium text-gray-700 w-6 text-center">
                {quantity}
              </span>

              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-9 h-9 rounded-full 
                          border border-pink-300 
                          text-pink-400 
                          hover:bg-pink-100 
                          transition"
              >
                +
              </button>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 mt-6">
            <button className="flex-1 bg-emerald-400 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium transition">
              Thêm vào giỏ
            </button>

            <button className="w-11 h-11 flex items-center justify-center rounded-full border border-pink-300 text-pink-400 hover:bg-pink-100 hover:scale-105 transition duration-300">
              ♥ 
            </button>
          </div>

        </div>
      </div>

      {/* DESCRIPTION EXTRA */}
      <div className="max-w-7xl mx-auto mt-20 bg-white rounded-3xl shadow-lg p-10">
        <h2 className="text-emerald-400 text-2xl font-bold mb-6">
          Mô tả chi tiết
        </h2>
       <p className="text-gray-600 leading-relaxed">
          {product.description}
        </p>

        {/* Rating */}
      {/* RATING SECTION */}
  <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

    <div className="flex items-center gap-6">

        {/* Average */}
        <div className="text-center">
          <p className="text-4xl font-bold text-pink-500">4.5</p>
          <div className="flex justify-center mt-2">
            {[1,2,3,4,5].map((i) => (
              <Star
                key={i}
                size={20}
                className={`${
                  i <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            14 đánh giá
          </p>
        </div>

        {/* Rating Breakdown */}
          <div className="flex-1 space-y-3">

            {[5,4,3,2,1].map((star, index) => {
              const percent = [70, 20, 7, 2, 1][index];

              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-8 text-sm">{star}★</span>

                  <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                  <span className="w-10 text-sm text-gray-500">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>

            {/* REVIEW LIST */}
              <div className="bg-white rounded-2xl shadow-md p-8 mt-10">

                <h3 className="text-emerald-400 text-2xl font-bold mb-8">
                  Đánh giá từ khách hàng
                </h3>

                {currentReviews.map((review, index) => (
                <div
                  key={index}
                  className="border-b pb-8 mb-8 last:border-none last:mb-0"
                >
                  <div className="flex gap-4">
                   <img
                    src={avatars[index % avatars.length]}
                    alt="avatar"
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200"
                  />

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-emerald-400   font-semibold">{review.name}</p>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                          Đã mua hàng
                        </span>
                      </div>

                      <div className="flex mt-1 mb-2">
                        {[1,2,3,4,5].map((i) => (
                          <Star
                            key={i}
                            size={16}
                            className={`${
                              i <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>

                      <p className="text-xs text-gray-400 mb-3">
                        {review.date}
                      </p>

                      <p className="text-gray-600 mb-4">
                        {review.content}
                      </p>

              
                    </div>
                  </div>
                </div>
              ))}
                {/* REVIEW PAGINATION */}
                  {totalReviewPages > 1 && (
                    <div className="flex justify-center mt-8 gap-3">

                      {/* Prev */}
                      <button
                        disabled={reviewPage === 1}
                        onClick={() => setReviewPage(reviewPage - 1)}
                        className="px-4 py-2 border rounded-full disabled:opacity-40"
                      >
                        ←
                      </button>

                      {/* Numbers */}
                      {[...Array(totalReviewPages)].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setReviewPage(index + 1)}
                          className={`px-4 py-2 rounded-full transition ${
                            reviewPage === index + 1
                              ? "bg-pink-500 text-white"
                              : "border hover:bg-pink-100"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}

                      {/* Next */}
                      <button
                        disabled={reviewPage === totalReviewPages}
                        onClick={() => setReviewPage(reviewPage + 1)}
                        className="px-4 py-2 border rounded-full disabled:opacity-40"
                      >
                        →
                      </button>

                    </div>
                  )}
</div>

      </div>
  </div>

        {/* RELATED PRODUCTS */}
          <div className="max-w-7xl mx-auto mt-20">
            <h2 className="text-emerald-400 text-2xl font-bold mb-10">
              Sản phẩm tương tự 🌸
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">

              {products
                  .filter(p => p.category === product.category && p.id !== product.id)
                  .slice(0, 4)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden group cursor-pointer"
                    >
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-60 object-cover group-hover:scale-110 transition duration-500"
                      />

                      <div className="p-5 text-center">
                        <h3 className="font-medium text-gray-700 mb-2">
                          {item.name}
                        </h3>
                        <p className="text-pink-500 font-bold">
                          {item.price.toLocaleString()} đ
                        </p>
                      </div>
                    </div>
                ))}

          </div>
        </div>
      </div>
    

    </div>
  );
};

export default ProductDetail;