import { useState, useEffect, useRef } from "react";
import ProductCard from "../../components/common/user/ProductCard/ProductCard";
import productService from "../../../services/productService";
import categoryService from "../../../services/categoryService";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Lấy giá trị từ URL params
  const search = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "all";
  const sort = searchParams.get("sort") || "-createdAt";
  const priceRange = searchParams.get("price") || "all";
  const rating = searchParams.get("rating") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;

  // Dropdown UI state
  const [openCategory, setOpenCategory] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const [openSort, setOpenSort] = useState(false);
  const [openRating, setOpenRating] = useState(false);

  // Refs for click outside
  const categoryRef = useRef(null);
  const priceRef = useRef(null);
  const sortRef = useRef(null);
  const ratingRef = useRef(null);

  // Data state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Local search state for smooth Vietnamese typing
  const [localSearch, setLocalSearch] = useState(search);

  const productsPerPage = 12;

  // Sync local search with URL param (when navigating from other pages)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        handleFilterChange("keyword", localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

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

  // Lấy Products mỗi khi URL params thay đổi
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
        if (rating !== "all") params.rating = rating;

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

    // Debounce tìm kiếm nếu keyword thay đổi
    const delay = setTimeout(() => {
      fetchProducts();
    }, search ? 500 : 0); // No delay for categories/sort/page

    return () => clearTimeout(delay);
  }, [search, category, sort, priceRange, rating, currentPage]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setOpenCategory(false);
      if (priceRef.current && !priceRef.current.contains(event.target)) setOpenPrice(false);
      if (sortRef.current && !sortRef.current.contains(event.target)) setOpenSort(false);
      if (ratingRef.current && !ratingRef.current.contains(event.target)) setOpenRating(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle thay đổi bộ lọc -> cập nhật URL trực tiếp
  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set(key, value);
    if (key !== 'page') newParams.set('page', '1'); // Reset pagination on filter change
    setSearchParams(newParams);
  };

  return (
    <div className="bg-white min-h-screen shop-wrapper relative pb-32">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-[500px] bg-pink-50/30 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-nature-soft/20 rounded-full -translate-x-1/2 blur-3xl pointer-events-none"></div>

      {/* Banner/Header */}
      <div className="text-center pt-24 pb-12 relative z-10">
        <span className="text-nature-primary font-black tracking-[0.3em] uppercase text-[10px] mb-4 block">
          Khám phá bộ sưu tập của chúng tôi
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter">
          Vườn Hoa <span className="text-pink-500 italic">Dịu Dàng</span>🌷
        </h1>
        <p className="text-gray-400 font-medium max-w-lg mx-auto px-6">
          Mỗi đóa hoa mang một sứ mệnh thầm lặng, trao gửi yêu thương và lan tỏa niềm hạnh phúc đến mọi tâm hồn 💌
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* FILTER BAR - Premium Glassmorphism Look */}
        <div className="mb-12 bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] shadow-premium border border-neutral-100 flex flex-wrap items-center gap-2 justify-between sticky top-4 z-40">
          
          <div className="flex flex-wrap items-center gap-2 p-1 flex-1">
            {/* DANH MỤC */}
            <div className="relative" ref={categoryRef}>
                <button
                    onClick={() => { setOpenCategory(!openCategory); setOpenPrice(false); setOpenSort(false); setOpenRating(false); }}
                    className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${category !== 'all' ? 'bg-pink-500 text-white shadow-lg shadow-pink-100' : 'bg-transparent text-gray-500 hover:bg-neutral-50'}`}
                >
                    <span>{category === "all" ? "Tất cả danh mục" : categories.find(c => c._id === category)?.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${openCategory ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {openCategory && (
                    <div className="absolute mt-3 w-64 bg-white border border-neutral-100 rounded-3xl shadow-premium z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div
                            onClick={() => { handleFilterChange("category", "all"); setOpenCategory(false); }}
                            className={`px-5 py-3 rounded-xl hover:bg-neutral-50 cursor-pointer text-sm font-bold transition ${category === 'all' ? 'text-pink-500 bg-pink-50' : 'text-gray-600'}`}
                        >
                            Tất cả sản phẩm
                        </div>
                        {categories.map((cat) => (
                            <div
                                key={cat._id}
                                onClick={() => { handleFilterChange("category", cat._id); setOpenCategory(false); }}
                                className={`px-5 py-3 rounded-xl hover:bg-neutral-50 cursor-pointer text-sm font-bold transition ${category === cat._id ? 'text-pink-500 bg-pink-50' : 'text-gray-600'}`}
                            >
                                {cat.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* KHOẢNG GIÁ */}
            <div className="relative" ref={priceRef}>
                <button
                    onClick={() => { setOpenPrice(!openPrice); setOpenCategory(false); setOpenSort(false); setOpenRating(false); }}
                    className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${priceRange !== 'all' ? 'bg-nature-primary text-white shadow-lg shadow-lime-100' : 'bg-transparent text-gray-500 hover:bg-neutral-50'}`}
                >
                    <span>
                        {priceRange === "all" ? "Mọi mức giá" : 
                         priceRange === "low" ? "Dưới 500k" : 
                         priceRange === "mid" ? "500k - 800k" : "Trên 800k"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${openPrice ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {openPrice && (
                    <div className="absolute mt-3 w-56 bg-white border border-neutral-100 rounded-3xl shadow-premium z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {['all', 'low', 'mid', 'high'].map((range) => (
                            <div 
                                key={range}
                                onClick={() => { handleFilterChange("price", range); setOpenPrice(false); }} 
                                className={`px-5 py-3 rounded-xl hover:bg-neutral-50 cursor-pointer text-sm font-bold transition ${priceRange === range ? 'text-nature-primary bg-nature-soft' : 'text-gray-600'}`}
                            >
                                {range === "all" ? "Tất cả mức giá" : 
                                 range === "low" ? "Dưới 500.000đ" : 
                                 range === "mid" ? "500k - 800k" : "Trên 800.000đ"}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ĐÁNH GIÁ */}
            <div className="relative" ref={ratingRef}>
                <button
                    onClick={() => { setOpenRating(!openRating); setOpenCategory(false); setOpenPrice(false); setOpenSort(false); }}
                    className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${rating !== 'all' ? 'bg-amber-400 text-white shadow-lg shadow-amber-100' : 'bg-transparent text-gray-500 hover:bg-neutral-50'}`}
                >
                    <span className="flex items-center gap-1">
                        {rating === "all" ? "Mọi đánh giá" : `Từ ${rating} sao`}
                        {rating !== "all" && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 fill-white" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${openRating ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {openRating && (
                    <div className="absolute mt-3 w-48 bg-white border border-neutral-100 rounded-3xl shadow-premium z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div
                            onClick={() => { handleFilterChange("rating", "all"); setOpenRating(false); }}
                            className={`px-5 py-3 rounded-xl hover:bg-neutral-50 cursor-pointer text-sm font-bold transition ${rating === 'all' ? 'text-amber-500 bg-amber-50' : 'text-gray-600'}`}
                        >
                            Tất cả đánh giá
                        </div>
                        {[5, 4, 3, 2, 1].map((star) => (
                            <div
                                key={star}
                                onClick={() => { handleFilterChange("rating", star.toString()); setOpenRating(false); }}
                                className={`px-5 py-3 rounded-xl hover:bg-neutral-50 cursor-pointer text-sm font-bold transition flex items-center justify-between ${rating === star.toString() ? 'text-amber-500 bg-amber-50' : 'text-gray-600'}`}
                            >
                                <span>Từ {star} sao</span>
                                <div className="flex gap-0.5">
                                    {[...Array(star)].map((_, i) => (
                                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 fill-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SẮP XẾP */}
            <div className="relative" ref={sortRef}>
                <button
                    onClick={() => { setOpenSort(!openSort); setOpenCategory(false); setOpenPrice(false); setOpenRating(false); }}
                    className="px-6 py-3 rounded-2xl bg-transparent text-gray-500 font-bold hover:bg-neutral-50 transition-all flex items-center gap-2"
                >
                    <span className="text-gray-300 mr-1 font-normal uppercase text-[10px]">Xếp theo:</span>
                    <span>
                        {sort === "-createdAt" && "Mới nhất"}
                        {sort === "price" && "Giá tăng dần"}
                        {sort === "-price" && "Giá giảm dần"}
                        {sort === "-sold" && "Bán chạy nhất"}
                    </span>
                </button>

                {openSort && (
                    <div className="absolute mt-3 w-56 right-0 bg-white border border-neutral-100 rounded-3xl shadow-premium z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {[
                            { val: "-createdAt", label: "Mới nhất" },
                            { val: "-sold", label: "Bán chạy nhất" },
                            { val: "price", label: "Giá tăng dần" },
                            { val: "-price", label: "Giá giảm dần" }
                        ].map((item) => (
                            <div 
                                key={item.val}
                                onClick={() => { handleFilterChange("sort", item.val); setOpenSort(false); }} 
                                className={`px-5 py-3 rounded-xl hover:bg-neutral-50 cursor-pointer text-sm font-bold transition ${sort === item.val ? 'text-gray-900 bg-neutral-50' : 'text-gray-500'}`}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>

          {/* TÌM KIẾM */}
          <div className="p-1">
            <div className="relative group">
                <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Tìm đóa hoa bạn thích..."
                    className="w-72 px-6 py-3.5 rounded-2xl bg-neutral-50 border border-transparent text-sm font-medium text-gray-700 focus:bg-white focus:border-pink-200 focus:ring-4 focus:ring-pink-50 outline-none transition-all placeholder:text-gray-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-pink-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
          </div>
        </div>

        {/* GRID SẢN PHẨM */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-pink-400">
              <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-pink-50 border-t-pink-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-tighter">Hydrangea</span>
                  </div>
              </div>
              <p className="mt-8 font-black uppercase tracking-[0.2em] text-[10px] text-gray-400 animate-pulse">Đang mang tới những bông hoa tươi nhất...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-200 overflow-hidden relative group">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-40 transition-opacity"></div>
              <span className="text-7xl mb-6 block transform group-hover:scale-110 transition-transform duration-500">🥀</span>
              <p className="text-2xl font-black text-gray-800 mb-3">Ồ, không tìm thấy đóa hoa nào!</p>
              <p className="text-gray-400 font-medium mb-10 max-w-sm mx-auto">Chúng mình không có sản phẩm nào phù hợp với bộ lọc này. Hãy thử thay đổi tìm kiếm nhé!</p>
              <button
                onClick={() => {
                   setSearchParams({});
                }}
                className="relative bg-neutral-900 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-neutral-800 transition active:scale-95 shadow-xl"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product._id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center mt-24 gap-3">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  handleFilterChange("page", index + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`min-w-[50px] h-[50px] rounded-2xl font-black text-sm transition-all duration-300 relative group ${currentPage === index + 1
                  ? "bg-neutral-900 text-white shadow-xl scale-110"
                  : "bg-white text-gray-400 hover:text-gray-900 border border-neutral-100 hover:border-neutral-900"
                  }`}
              >
                {index + 1}
                {currentPage === index + 1 && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;