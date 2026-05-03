import { Navigate, useLocation } from "react-router-dom";
import authService from "../../../../../services/authService";

const AuthCheck = ({children}) => {
   const isAuthenticate = authService.isLoggedIn();
   const location = useLocation();

   if(!isAuthenticate){
    return <Navigate to='/login' state={{ from: location }} />
   }
   return children;
}; 
export default AuthCheck;