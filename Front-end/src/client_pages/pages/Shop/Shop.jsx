import { useState } from "react";
import ProductCard from "../../components/common/user/ProductCard/ProductCard";
import products from "../../../data/products/products";
import { Flower2, Sparkles, SlidersHorizontal } from "lucide-react"
const Shop = () => {

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [openCategory, setOpenCategory] = useState(false);
  const [openSpecial, setOpenSpecial] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  const productsPerPage = 16;
  const [special, setSpecial] = useState("all");

  // FILTER
  const filtered = products
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) =>
      category === "all" ? true : p.category === category
    )
    .filter((p) => {
      if (special === "sale") return p.discount > 0;
      if (special === "popular") return p.views > 50;
      return true;
    })
    .filter((p) => {
      if (priceRange === "low") return p.price < 500000;
      if (priceRange === "mid")
        return p.price >= 500000 && p.price <= 800000;
      if (priceRange === "high") return p.price > 800000;
      return true;
    })
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      return 0;
    });

  // PAGINATION
  const totalPages = Math.ceil(filtered.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filtered.slice(
    startIndex,
    startIndex + productsPerPage
  );
  const dropdownButton =
  "w-48 border border-pink-200 bg-pink-50 text-gray-600 text-sm px-5 py-2.5 rounded-full shadow-sm hover:bg-pink-100 transition text-left";

  const dropdownMenu =
    "absolute mt-2 w-48 bg-emerald-50 border border-pink-200 rounded-2xl shadow-lg overflow-hidden z-50";

  const dropdownItem =
    "px-4 py-2 hover:bg-emerald-100 cursor-pointer text-sm text-gray-600";

  return (
    <div className="bg-[#fffafc] min-h-screen shop-wrapper">
          {/* Hoa rơi */}
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweru f1" alt="" />
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweru f2" alt="" />
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweru f3" alt="" />
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweru f4" alt="" />
          <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweru f5" alt="" />

          <div className="relative z-10"/>
      {/* Banner */}
     <div className="text-center mb-8 relative">
        <h1 className="text-[#88a82a] font-medium tracking-widest uppercase px-6 pt-6">
          Vườn hoa nhỏ của chúng mình 🌷
        </h1>
        <p className="shop-sub">
          Mỗi bó hoa là một câu chuyện dịu dàng đang chờ được gửi đi 💌
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 pb-10">

        {/* FILTER BAR */}
          <div className="mb-10 bg-white p-5 rounded-2xl shadow-sm border border-pink-100">

  <div className="flex flex-wrap items-center gap-6 justify-between">

    {/* DANH MỤC */}
    <div className="flex items-center gap-3">

      <span className="text-sm font-medium text-pink-500">
        Danh mục
      </span>

            <div className="relative w-50">
          <button
            onClick={() => setOpenCategory(!openCategory)}
            className="w-full px-6 py-2 rounded-full
            border-2 border-pink-200
            bg-pink-50/60
            text-gray-700 text-left"
          >
            {category === "all" && "Tất cả"}
            {category === "birthday" && "Hoa sinh nhật"}
            {category === "wedding" && "Hoa cưới"}
          </button>

          {openPrice && (
            <div className="absolute mt-2 w-full
            bg-pink-50/60
            border border-pink-200
            rounded-2xl
            shadow-md z-50">

              <div  onClick={() => {setCategory("all"); setOpenCategory(false);}}
                className="px-6 py-3 hover:bg-white cursor-pointer text-gray-700">
                Tất cả
              </div>

              <div  onClick={() => {setCategory("birthday"); setOpenCategory(false);}}
                className="px-6 py-3 hover:bg-white cursor-pointer text-gray-700">
                Hoa sinh nhật
              </div>

              <div  onClick={() => {setCategory("wedding"); setOpenCategory(false);}}
                className="px-6 py-3 hover:bg-white cursor-pointer text-gray-700">
                Hoa cưới
              </div>

            </div>
          )}
        </div>
    </div>

    {/* KHOẢNG GIÁ */}
    <div className="flex items-center gap-3">

      <span className="text-sm font-medium text-pink-500">
        Khoảng giá
      </span>

      <div className="relative w-48">
          <button
            onClick={() => setOpenPrice(!openPrice)}
            className="w-full px-6 py-2 rounded-full
            border-2 border-pink-200
            bg-pink-50/60
            text-gray-700 text-left"
          >
            {priceRange === "all" && "Tất cả"}
            {priceRange === "low" && "Dưới 500.000đ"}
            {priceRange === "mid" && "Tren 500.000đ"}
          </button>

          {openPrice && (
            <div className="absolute mt-2 w-full
            bg-pink-50/60
            border border-pink-200
            rounded-2xl
            shadow-md z-50">

              <div onClick={() => {setPriceRange("all"); setOpenPrice(false);}}
                className="px-6 py-3 hover:bg-white cursor-pointer text-gray-700">
                Tất cả
              </div>

              <div onClick={() => {setPriceRange("low"); setOpenPrice(false);}}
                className="px-6 py-3 hover:bg-white cursor-pointer text-gray-700">
                Dưới 500.000đ
              </div>

              <div onClick={() => {setPriceRange("mid"); setOpenPrice(false);}}
                className="px-6 py-3 hover:bg-white cursor-pointer text-gray-700">
                Tren 500.000đ
              </div>

            </div>
          )}
        </div>

    </div>

    {/* SẮP XẾP */}
    <div className="flex items-center gap-3">

      <span className="text-sm font-medium text-pink-500">
        Sắp xếp
      </span>
      
      <div className="relative w-48">
          <button
            onClick={() => setOpenSort(!openSort)}
            className="w-full px-6 py-2 rounded-full
            border-2 border-pink-200
            bg-pink-50/60
            text-gray-700 text-left"
          >
            {sort === "" && "Mới nhất"}
            {sort === "low" && "Giá tăng dần"}
            {sort === "high" && "Giá giảm dần"}
          </button>

          {openPrice && (
            <div className="absolute mt-2 w-full
            bg-pink-50/60
            border border-pink-200
            rounded-2xl
            shadow-md z-50">

              <div onClick={() => {setSort(""); setOpenSort(false);}}
                className="px-6 py-3 hover:bg-white cursor-pointer text-gray-700">
                Mới nhất
              </div>

              <div oonClick={() => {setSort("low"); setOpenSort(false);}}
                className="px-6 py-3 hover:bg-white cursor-pointer text-gray-700">
                Giá tăng dần
              </div>

              <div onClick={() => {setSort("high"); setOpenSort(false);}}
                className="px-6 py-3 hover:bg-white cursor-pointer text-gray-700">
                Giá giảm dần
              </div>

            </div>
          )}
        </div>
    </div>

    {/* TÌM KIẾM */}
    <div className="relative w-64">

      <input
        type="text"
        placeholder="Tìm kiếm hoa..."
        className="w-full px-5 py-2 rounded-full
        border border-pink-200
        text-sm text-gray-600
        shadow-sm
        focus:ring-2 focus:ring-pink-200
        outline-none transition"
      />

    </div>

  </div>

</div>
        {/* GRID */}
        {currentProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl font-semibold text-gray-400 mb-4">
            Không tìm thấy sản phẩm 😢
          </p>

          <button
            onClick={() => {
              setSearch("");
              setCategory("all");
              setPriceRange("all");
              setSort("");
              setSpecial("all");
            }}
            className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition"
          >
            Reset bộ lọc
          </button>
        </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10 gap-4 text-pink-400 hover:text-pink-500">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-4 py-2 rounded-full transition ${
                  currentPage === index + 1
                    ? "bg-pink-500 text-white"
                    : "bg-white border hover:bg-pink-100"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;