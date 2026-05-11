/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import TripView from './pages/TripView';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-beige">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trip/:tripId" element={<TripView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" />
      </div>
    </BrowserRouter>
  );
}
