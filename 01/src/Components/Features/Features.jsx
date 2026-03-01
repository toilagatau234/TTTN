import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Features = () => {
  const slides = [
    {
      images: [
        "https://res.cloudinary.com/drwles2k0/image/upload/v1771685594/t%E1%BA%A3i_xu%E1%BB%91ng__18_-removebg-preview_fdtc7s.png",
        "https://res.cloudinary.com/drwles2k0/image/upload/v1771685448/t%E1%BA%A3i_xu%E1%BB%91ng__15_-removebg-preview_vbvuaz.png",
        "https://res.cloudinary.com/drwles2k0/image/upload/v1771685526/t%E1%BA%A3i_xu%E1%BB%91ng__16_-removebg-preview_jygo3z.png",
      ],
      title: "Hoa Cưới Cao Cấp",
      desc: "Thiết kế tinh tế, sang trọng và theo phong cách riêng của bạn.",
    },
    {
      images: [
        "https://res.cloudinary.com/drwles2k0/image/upload/v1771685594/t%E1%BA%A3i_xu%E1%BB%91ng__18_-removebg-preview_fdtc7s.png",
        "https://res.cloudinary.com/drwles2k0/image/upload/v1771685448/t%E1%BA%A3i_xu%E1%BB%91ng__15_-removebg-preview_vbvuaz.png",
        "https://res.cloudinary.com/drwles2k0/image/upload/v1771685526/t%E1%BA%A3i_xu%E1%BB%91ng__16_-removebg-preview_jygo3z.png",
      ],
      title: "Hoa Sinh Nhật",
      desc: "Mang đến niềm vui và yêu thương trong ngày đặc biệt.",
    },
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    autoplay: true,
    autoplaySpeed: 3500,
    arrows: false,
  };

  return (
    <div className="bg-gradient-to-r from-[#fff0f5] to-[#f0fff4] py-20">
      <div className="max-w-7xl mx-auto px-6">

        <Slider {...settings}>
          {slides.map((slide, index) => (
            <div key={index}>
              <div className="flex flex-row items-center gap-16">

                {/* ẢNH BÊN TRÁI */}
                <div className="flex gap-6 w-3/5">
                  {slide.images.map((img, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-[260px] object-cover hover:scale-105 transition duration-500"
                      />
                    </div>
                  ))}
                </div>

                {/* CHỮ BÊN PHẢI */}
                <div className="w-2/5">
                  <h3 className="text-4xl font-bold text-[#fa2cab] mb-5 leading-tight">
                    {slide.title}
                  </h3>

                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    {slide.desc}
                  </p>

                  <button className="px-8 py-3 bg-[#88a82a] text-white rounded-full hover:bg-[#88a82a] transition shadow-md">
                    Khám Phá Ngay
                  </button>
                </div>

              </div>
            </div>
          ))}
        </Slider>

      </div>
    </div>
  );
};

export default Features;