import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GroceryListPage from './pages/GroceryListPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/grocery" element={<GroceryListPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/grocery" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
