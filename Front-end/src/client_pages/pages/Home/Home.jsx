import React, { useState, useEffect } from 'react'
import Features from "../../components/common/user/Features/Features"
import ProductCard from "../../components/common/user/ProductCard/ProductCard"
import Banner from "../../components/common/user/Banner/Banner"
import productService from "../../../services/productService"
import { Link } from "react-router-dom"

import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const res = await productService.getAll({ limit: 8, status: 'active' });
        if (res.success) {
          setFeaturedProducts(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải sản phẩm nổi bật:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3, slidesToScroll: 1 }
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2, slidesToScroll: 1 }
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1, slidesToScroll: 1 }
      }
    ]
  };

  return (
    <div className="bg-white">
      {/* BANNER */}
      <Banner />

      {/* FEATURES */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Features />
        </div>
      </section>

      {/* PRODUCT SECTION */}
      <section className="py-24 bg-neutral-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-pink-100/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-nature-soft/50 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16 px-4">
            <span className="text-nature-primary font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
              Hydrangea Studio Collection
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mt-2">
              Sản Phẩm <span className="text-pink-500 italic">Nổi Bật</span>
            </h2>
            <div className="w-20 h-1.5 bg-nature-primary mx-auto mt-6 rounded-full opacity-30"></div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="px-2">
              <Slider {...settings}>
                {featuredProducts.map(product => (
                  <div key={product._id} className="px-4 pb-12"> 
                    <ProductCard product={product} />
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300">
              <p className="text-neutral-500">Hiện tại chưa có sản phẩm nào được hiển thị.</p>
            </div>
          )}

          <div className="text-center mt-8">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-10 py-4 bg-white text-pink-600 font-bold rounded-full border-2 border-pink-100 hover:border-pink-500 hover:bg-pink-500 hover:text-white transition-all shadow-sm hover:shadow-lg active:scale-95"
              >
                <span>Khám phá cửa hàng</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-24 bg-nature-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          {/* Subtle pattern or texture could go here */}
          <div className="grid grid-cols-6 gap-4">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="w-12 h-12 border border-white rounded-full"></div>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h3 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight max-w-3xl mx-auto">
            Gửi Gắm Tâm Tình Qua <br/> 
            <span className="text-lime-200 underline decoration-wavy underline-offset-8">Từng Đóa Hoa</span> Đặc Biệt
          </h3>
          <p className="text-nature-soft/80 text-lg mb-10 max-w-xl mx-auto">
            Chúng tôi nhận thiết kế hoa theo yêu cầu, mang phong cách riêng của bạn vào từng sản phẩm.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-10 py-4 bg-white text-nature-primary font-black rounded-full hover:bg-nature-soft transition-all shadow-[0_10px_0_rgb(230,230,230)] hover:shadow-[0_5px_0_rgb(230,230,230)] hover:translate-y-[5px] active:translate-y-[10px] active:shadow-none uppercase tracking-wider">
              Liên Hệ Ngay
            </button>
            <Link to="/custom-design" className="px-10 py-4 bg-transparent text-white border-2 border-white/30 font-bold rounded-full hover:bg-white/10 transition-all">
              Tự thiết kế hoa
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home