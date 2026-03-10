import { useState, useEffect } from "react";
import ProductCard from "../../components/common/user/ProductCard/ProductCard";
import productService from "../../../services/productService";
import categoryService from "../../../services/categoryService";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Khởi tạo state từ URL params (để hỗ trợ share link)
  const [search, setSearch] = useState(searchParams.get("keyword") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "-createdAt");
  const [priceRange, setPriceRange] = useState(searchParams.get("price") || "all");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);

  // Dropdown UI state
  const [openCategory, setOpenCategory] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  // Data state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const productsPerPage = 12;

  // Lấy Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll();
        if (res.success) setCategories(res.data);
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // Lấy Products mỗi khi filter thay đổi
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let minPrice = "";
        let maxPrice = "";
        if (priceRange === "low") maxPrice = 500000;
        if (priceRange === "mid") { minPrice = 500000; maxPrice = 800000; }
        if (priceRange === "high") minPrice = 800000;

        const params = {
          keyword: search,
          category: category !== "all" ? category : "",
          sort,
          page: currentPage,
          limit: productsPerPage,
          status: 'active'
        };

        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        // Cập nhật URL
        setSearchParams(params);

        const res = await productService.getAll(params);
        if (res.success) {
          setProducts(res.data);
          setTotalPages(res.pagination.totalPages);
        }
      } catch (error) {
        console.error("Lỗi lấy sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce tìm kiếm
    const delay = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delay);
  }, [search, category, sort, priceRange, currentPage, setSearchParams]);

  // Handle thay đổi bộ lọc -> reset về trang 1
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#fffafc] min-h-screen shop-wrapper relative pb-20">
      {/* Background Hoa rơi */}
      <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="w-10 absolute opacity-20 top-20 left-10 animate-pulse" alt="" />
      <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="w-16 absolute opacity-10 top-40 right-20 animate-pulse" alt="" />

      {/* Banner */}
      <div className="text-center mb-8 relative pt-10">
        <h1 className="text-[#88a82a] font-medium tracking-widest text-xl uppercase px-6 pt-6 mb-2">
          Vườn hoa nhỏ của chúng mình 🌷
        </h1>
        <p className="text-gray-500 italic">
          Mỗi bó hoa là một câu chuyện dịu dàng đang chờ được gửi đi 💌
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 pb-10">
        {/* FILTER BAR */}
        <div className="mb-10 bg-white p-5 rounded-2xl shadow-sm border border-pink-100 flex flex-wrap items-center gap-6 justify-between relative z-20">

          {/* DANH MỤC */}
          <div className="flex items-center gap-3 relative">
            <span className="text-sm font-medium text-pink-500">Danh mục</span>
            <div className="relative w-48">
              <button
                onClick={() => { setOpenCategory(!openCategory); setOpenPrice(false); setOpenSort(false); }}
                className="w-full px-6 py-2 rounded-full border-2 border-pink-200 bg-pink-50/60 text-gray-700 text-left line-clamp-1"
              >
                {category === "all" ? "Tất cả" : categories.find(c => c._id === category)?.name || "Danh mục"}
              </button>

              {openCategory && (
                <div className="absolute mt-2 w-full bg-white border border-pink-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  <div
                    onClick={() => { handleFilterChange(setCategory, "all"); setOpenCategory(false); }}
                    className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700 transition"
                  >
                    Tất cả
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat._id}
                      onClick={() => { handleFilterChange(setCategory, cat._id); setOpenCategory(false); }}
                      className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700 transition"
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* KHOẢNG GIÁ */}
          <div className="flex items-center gap-3 relative">
            <span className="text-sm font-medium text-pink-500">Giá</span>
            <div className="relative w-48">
              <button
                onClick={() => { setOpenPrice(!openPrice); setOpenCategory(false); setOpenSort(false); }}
                className="w-full px-6 py-2 rounded-full border-2 border-pink-200 bg-pink-50/60 text-gray-700 text-left"
              >
                {priceRange === "all" && "Tất cả"}
                {priceRange === "low" && "Dưới 500k"}
                {priceRange === "mid" && "500k - 800k"}
                {priceRange === "high" && "Trên 800k"}
              </button>

              {openPrice && (
                <div className="absolute mt-2 w-full bg-white border border-pink-200 rounded-2xl shadow-xl z-50">
                  <div onClick={() => { handleFilterChange(setPriceRange, "all"); setOpenPrice(false); }} className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700">Tất cả</div>
                  <div onClick={() => { handleFilterChange(setPriceRange, "low"); setOpenPrice(false); }} className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700">Dưới 500k</div>
                  <div onClick={() => { handleFilterChange(setPriceRange, "mid"); setOpenPrice(false); }} className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700">500k - 800k</div>
                  <div onClick={() => { handleFilterChange(setPriceRange, "high"); setOpenPrice(false); }} className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700">Trên 800k</div>
                </div>
              )}
            </div>
          </div>

          {/* SẮP XẾP */}
          <div className="flex items-center gap-3 relative">
            <span className="text-sm font-medium text-pink-500">Sắp xếp</span>
            <div className="relative w-48">
              <button
                onClick={() => { setOpenSort(!openSort); setOpenCategory(false); setOpenPrice(false); }}
                className="w-full px-6 py-2 rounded-full border-2 border-pink-200 bg-pink-50/60 text-gray-700 text-left"
              >
                {sort === "-createdAt" && "Mới nhất"}
                {sort === "price" && "Giá tăng dần"}
                {sort === "-price" && "Giá giảm dần"}
                {sort === "-sold" && "Bán chạy nhất"}
              </button>

              {openSort && (
                <div className="absolute mt-2 w-full bg-white border border-pink-200 rounded-2xl shadow-xl z-50">
                  <div onClick={() => { handleFilterChange(setSort, "-createdAt"); setOpenSort(false); }} className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700">Mới nhất</div>
                  <div onClick={() => { handleFilterChange(setSort, "-sold"); setOpenSort(false); }} className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700">Bán chạy nhất</div>
                  <div onClick={() => { handleFilterChange(setSort, "price"); setOpenSort(false); }} className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700">Giá tăng dần</div>
                  <div onClick={() => { handleFilterChange(setSort, "-price"); setOpenSort(false); }} className="px-6 py-3 hover:bg-pink-50 cursor-pointer text-gray-700">Giá giảm dần</div>
                </div>
              )}
            </div>
          </div>

          {/* TÌM KIẾM */}
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              placeholder="Tìm kiếm hoa..."
              className="w-full px-5 py-2.5 rounded-full border-2 border-pink-200 text-sm text-gray-600 focus:border-pink-300 focus:outline-none transition"
            />
          </div>
        </div>

        {/* GRID SẢN PHẨM */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-pink-400">
              <Loader2 className="animate-spin w-12 h-12 mb-4" />
              <p>Đang tải hoa xinh...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-pink-100 shadow-sm">
              <span className="text-6xl mb-4 block">🌸</span>
              <p className="text-xl font-medium text-gray-500 mb-6">Xin lỗi, không có sản phẩm nào phù hợp!</p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setPriceRange("all");
                  setSort("-createdAt");
                  setCurrentPage(1);
                }}
                className="bg-pink-400 text-white px-8 py-3 rounded-full hover:bg-pink-500 transition shadow-md hover:shadow-lg font-medium"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentPage(index + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-10 h-10 rounded-full font-medium transition-all ${currentPage === index + 1
                  ? "bg-pink-400 text-white shadow-md"
                  : "bg-white text-gray-500 hover:bg-pink-50 border border-gray-200"
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