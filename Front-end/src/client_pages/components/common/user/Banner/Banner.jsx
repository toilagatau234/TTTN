import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Slider from "react-slick";
import bannerService from "../../../../../services/bannerService";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Banner = () => {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
     const fetchActive = async () => {
        try {
           const res = await bannerService.getActive();
           if (res.success) setBanners(res.data);
        } catch (error) {
           console.log("Không tải được banner", error);
        }
     };
     fetchActive();
  }, []);

  const settings = {
      dots: true,
      infinite: true,
      speed: 800,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 4000,
      fade: true,
      arrows: false
  };

  if (banners.length > 0) {
      return (
          <div className="w-full relative overflow-hidden bg-neutral-50 mb-10">
              <Slider {...settings} className="w-full">
                  {banners.map((item) => (
                      <div key={item._id} className="w-full relative outline-none">
                          <Link to={item.link || '#'}>
                             <img src={item.image.url} alt={item.title} className="w-full object-cover max-h-[600px] object-center" />
                          </Link>
                      </div>
                  ))}
              </Slider>
          </div>
      );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#fff0f5] to-[#f0fff4]">

      {/* Hoa lơ lửng nhẹ */}
      <img
        src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271341/flowers_uccuf7.png"
        className="absolute w-16 top-20 left-10 animate-floatBanner opacity-60"
        alt=""
      />

      <img
        src="https://res.cloudinary.com/drwles2k0/image/upload/v1772274516/flower_1_lka9bg.png"
        className="absolute w-12 bottom-20 right-20 animate-floatBanner2 opacity-50"
        alt=""
      />

      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="grid md:grid-cols-2 items-center gap-12">

          {/* Text */}
          <div>
            <h1 className="text-5xl font-bold text-[#f472b6] leading-tight animate-fadeUp">
              Mang yêu thương <br /> qua từng đóa hoa 🌸
            </h1>

            <p className="mt-6 text-gray-600 text-lg animate-fadeUp delay-200">
              Hoa tươi mỗi ngày – thiết kế theo yêu cầu – giao nhanh trong 2h.
            </p>

            <div className="mt-8 animate-fadeUp delay-400">
              <Link
                to="/shop"
                className="px-8 py-3 bg-[#edffc5] text-[#2f5d3a] rounded-full hover:bg-[#edffc5] transition shadow-lg hover:shadow-xl"
              >
                Xem sản phẩm
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="flex justify-center relative">
            
            {/* Glow phía sau ảnh */}
            <div className="absolute w-96 h-96 bg-pink-300 blur-3xl opacity-30 rounded-full "></div>

            <img
              src="https://res.cloudinary.com/drwles2k0/image/upload/v1771687630/wallpaper-removebg-preview_msnlof.png"
              alt="flower"
              className="w-[250px] relative z-10 drop-shadow-2xl animate-floatImage"
            />
          </div>

        </div>
      </div>
    </section>
  )
}

export default Banner