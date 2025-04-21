import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import OtherApp from './OtherApp';

export default function Router() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/other" element={<OtherApp />} />
      </Routes>
    </BrowserRouter>
  );
}
