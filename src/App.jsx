import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AdminRoutes from './admin_pages/routes/routes';
// import ClientRoutes from './client_pages/routes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- ADMIN --- */}
        <Route path="/admin/*" element={<AdminRoutes />} />


        {/* --- USER (CLIENT) --- */}
        {/* <Route path="/*" element={<ClientRoutes />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;