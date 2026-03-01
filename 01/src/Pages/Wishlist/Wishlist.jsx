import { useEffect, useState } from "react";
import { Trash2, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
  const loadWishlist = () => {
    const data = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlist(data);
  };

  loadWishlist();

  window.addEventListener("wishlistUpdated", loadWishlist);

  return () => {
    window.removeEventListener("wishlistUpdated", loadWishlist);
  };
}, []);

  const removeItem = (id) => {
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  };

  const clearWishlist = () => {
    localStorage.removeItem("wishlist");
    setWishlist([]);
  };

  return (
    <div className="bg-[#fffafc] min-h-screen shop-wrapper">

      {/* Hoa rơi */}
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f1" alt="" />
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f2" alt="" />
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f3" alt="" />
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f4" alt="" />
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f5" alt="" />

          <div className="relative z-10"/>
      
      {/* Banner */}
      <div className="text-center mb-8 relative">
        <h1 className="text-[#88a82a] font-medium tracking-widest uppercase px-6 pt-6">
          Sản Phẩm Yêu Thích 💗
        </h1>
        <p className="shop-sub">
          Khám phá thêm hoa 🌷
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {wishlist.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 mb-6">
              Bạn chưa có sản phẩm yêu thích 😢
            </p>

            <Link
              to="/shop"
              className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <>
            {/* Nút xoá tất cả */}
            <div className="flex justify-end mb-6">
              <button
                onClick={clearWishlist}
                className="px-6 py-2 bg-rose-300 text-white rounded-full hover:bg-rose-400 transition duration-300 text-sm font-semibold shadow-sm"
              >
                Xoá tất cả
              </button>
            </div>

            {/* LIST sản phẩm */}
            <div className="space-y-6">
              {wishlist.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] transition"
                >
                  
                  {/* Bên trái */}
                  <div className="flex items-center gap-6">
                   <Link to={`/product/${product.id}`} state={{ product }}>
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        className="w-28 h-28 object-cover rounded-xl hover:scale-105 transition"
                      />
                    </Link>

                    <div>
                     <Link to={`/product/${product.id}`} state={{ product }}>
                        <h3 className="text-lg font-semibold text-gray-800 hover:text-pink-500 transition">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-pink-500 font-bold mt-2">
                        {product.price.toLocaleString()} đ
                      </p>
                    </div>
                  </div>
                  {/* Bên phải */}
                  <div className="flex items-center gap-4">
                    
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-200 text-emerald-700 rounded-full hover:bg-emerald-300 transition duration-300 text-sm font-medium"                    >
                      <ShoppingCart size={18} />
                      Thêm vào giỏ
                    </button>

                    <button
                      onClick={() => removeItem(product.id)}
                      className="px-4 py-2 bg-pink-200 text-pink-700 rounded-full hover:bg-pink-300 transition duration-300 text-sm font-medium"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Wishlist;