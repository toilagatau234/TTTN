import Features from "../../components/common/user/Features/Features"
import ProductCard from "../../components/common/user/ProductCard/ProductCard"
import Banner from "../../components/common/user/Banner/Banner"
import products from "../../../data/products/products"
import { Link } from "react-router-dom"

const Home = () => {

  const randomProducts = [...products]
  .sort(() => 0.5 - Math.random())
  .slice(0, 4)

  return (
    <div className="bg-[#fffafc]">

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {randomProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

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