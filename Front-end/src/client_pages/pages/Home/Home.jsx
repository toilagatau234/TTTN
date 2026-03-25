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
    <div className="bg-[#fffafc]">

      {/* BANNER */}
      <Banner />

      {/* FEATURES */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <Features />
        </div>
      </section>

      {/* PRODUCT SECTION */}
      <section className="py-20 bg-[#fff0f5]">
        <div className="container mx-auto px-6">

          <div className="text-center mb-14">
            <p className="text-[#88a82a] font-medium tracking-widest uppercase">
              Flowershop
            </p>
            <h2 className="text-4xl font-bold text-[#fa2cab] mt-3">
              Danh Sách Sản Phẩm
            </h2>
            <div className="w-24 h-1 bg-[#88a82a] mx-auto mt-4 rounded-full"></div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500">Đang tải sản phẩm...</div>
          ) : featuredProducts.length > 0 ? (
            <div className="px-4">
              <Slider {...settings}>
                {featuredProducts.map(product => (
                  <div key={product._id} className="px-3 pb-8"> 
                    <ProductCard product={product} />
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <div className="text-center text-gray-500">Không có sản phẩm nào</div>
          )}

          <div className="text-center mt-14">
              <Link
                to="/shop"
                className="inline-block px-8 py-3 border border-pink-300 text-pink-400 rounded-full hover:bg-pink-400 hover:text-white transition"
              >
                Xem thêm sản phẩm
              </Link>
          </div>

        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-20 bg-[#edffc5] text-center">
        <h3 className="text-3xl font-bold text-[#576100] mb-6">
          Bạn muốn thiết kế hoa theo yêu cầu?
        </h3>
        <button className="px-8 py-3 bg-[#88a82a] text-white rounded-full hover:bg-[#88a82a] transition shadow-md">
          Liên Hệ Ngay
        </button>
      </section>

    </div>
  )
}

export default Home