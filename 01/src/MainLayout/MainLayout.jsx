import { Routes, Route } from "react-router-dom";


import Auth from "../Pages/Auth/Auth";
import Login from "../Pages/Auth/Login/Login";
import Register from "../Pages/Auth/Register/Register";
import Error from "../Pages/Error/Error";
import Navbar from "../Components/Navbar/Navbar";
import Home from "../Pages/Home/Home";
import Banner from "../Components/Banner/Banner";
import Footer from "../Components/Footer/Footer";
import Cart from "../Pages/Cart/Cart";
import Checkout from "../Pages/Checkout/Checkout";
import CustomDesign from "../Pages/CustomDesign/CustomDesign";
import MiniGame from "../Pages/MiniGame/MiniGame";
import ProductDetail from "../Pages/ProductDetail/ProductDetail";
import Profile from "../Pages/Profile/Profile";
import Shop from "../Pages/Shop/Shop";
import Wishlist from "../Pages/Wishlist/Wishlist";
import Mess from "../Pages/Mess/Mess";
const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Routes >
          <Route path="/"element={<><Banner /><Home /></>}/>
          <Route path ="/cart" element ={<Cart />}/>
          <Route path ="/checkout" element ={<Checkout />}/>
          <Route path ="/customDesign" element ={<CustomDesign />}/>
          <Route path ="/miniGame" element ={<MiniGame />}/>
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path ="/profile" element ={<Profile />}/>
          <Route path ="/shop" element ={<Shop />}/>
          <Route path ="/wishlist" element ={<Wishlist />}/>
          <Route path ="/mess" element ={<Mess />}/>
          <Route path="*" element={<Error />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        <Footer/>
    </>
  );
};

export default MainLayout;
