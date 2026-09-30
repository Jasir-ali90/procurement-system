import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import PurchaseRequests from './pages/PurchaseRequests';
import RFQList from './pages/RFQList';
import PurchaseOrders from './pages/PurchaseOrders';
import GoodsReceipt from './pages/GoodsReceipt';
import VendorRatings from './pages/VendorRatings';
import Reports from './pages/Reports';
import AdminUsers from './pages/AdminUsers';
import AdminDepartments from './pages/AdminDepartments';

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/purchase-requests" element={<ProtectedRoute><PurchaseRequests /></ProtectedRoute>} />
              <Route path="/vendors" element={<ProtectedRoute allowedRoles={['Admin', 'Procurement Manager']}><Vendors /></ProtectedRoute>} />
              <Route path="/rfqs" element={<ProtectedRoute allowedRoles={['Admin', 'Procurement Manager']}><RFQList /></ProtectedRoute>} />
              <Route path="/purchase-orders" element={<ProtectedRoute allowedRoles={['Admin', 'Procurement Manager']}><PurchaseOrders /></ProtectedRoute>} />
              <Route path="/goods-receipt" element={<ProtectedRoute allowedRoles={['Admin', 'Procurement Manager']}><GoodsReceipt /></ProtectedRoute>} />
              <Route path="/ratings" element={<ProtectedRoute allowedRoles={['Admin', 'Procurement Manager']}><VendorRatings /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDepartments /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  );
}