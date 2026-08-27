import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { LoadingState } from "@/components/common/LoadingState";
import { ROUTES } from "@/constants/routes.constants";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { SellerLayout } from "@/layouts/SellerLayout";
import { GuestRoute } from "./GuestRoute";
import { ProtectedRoute } from "./ProtectedRoute";

const HomePage = lazy(() => import("@/pages/public/HomePage"));
const ShopPage = lazy(() => import("@/pages/public/ShopPage"));
const ProductDetailsPage = lazy(() => import("@/pages/public/ProductDetailsPage"));
const CartPage = lazy(() => import("@/pages/public/CartPage"));
const CheckoutPage = lazy(() => import("@/pages/public/CheckoutPage"));
const OrderConfirmationPage = lazy(() => import("@/pages/public/OrderConfirmationPage"));

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));

const ProfilePage = lazy(() => import("@/pages/account/ProfilePage"));
const OrdersPage = lazy(() => import("@/pages/account/OrdersPage"));
const OrderDetailsPage = lazy(() => import("@/pages/account/OrderDetailsPage"));
const WishlistPage = lazy(() => import("@/pages/account/WishlistPage"));
const AddressesPage = lazy(() => import("@/pages/account/AddressesPage"));

const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminProductsPage = lazy(() => import("@/pages/admin/AdminProductsPage"));
const AdminProductFormPage = lazy(() => import("@/pages/admin/AdminProductFormPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminOrderDetailsPage = lazy(() => import("@/pages/admin/AdminOrderDetailsPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminCategoriesPage = lazy(() => import("@/pages/admin/AdminCategoriesPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));

const SellerDashboardPage = lazy(() => import("@/pages/seller/SellerDashboardPage"));
const SellerProductsPage = lazy(() => import("@/pages/seller/SellerProductsPage"));
const SellerOrdersPage = lazy(() => import("@/pages/seller/SellerOrdersPage"));
const SellerCustomersPage = lazy(() => import("@/pages/seller/SellerCustomersPage"));
const SellerAnalyticsPage = lazy(() => import("@/pages/seller/SellerAnalyticsPage"));

const NotFoundPage = lazy(() => import("@/pages/errors/NotFoundPage"));
const ForbiddenPage = lazy(() => import("@/pages/errors/ForbiddenPage"));

function PageFallback() {
  return <LoadingState className="min-h-[60vh]" />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.shop} element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailsPage />} />
          <Route path={ROUTES.cart} element={<CartPage />} />
          <Route path={ROUTES.checkout} element={<CheckoutPage />} />
          <Route path="/checkout/confirmation/:orderNumber" element={<OrderConfirmationPage />} />

          <Route
            path={ROUTES.profile}
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />
          <Route
            path={ROUTES.orders}
            element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
          />
          <Route
            path="/orders/:id"
            element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>}
          />
          <Route
            path={ROUTES.wishlist}
            element={<ProtectedRoute><WishlistPage /></ProtectedRoute>}
          />
          <Route
            path={ROUTES.addresses}
            element={<ProtectedRoute><AddressesPage /></ProtectedRoute>}
          />

          <Route path={ROUTES.forbidden} element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path={ROUTES.register} element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path={ROUTES.forgotPassword} element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path={ROUTES.resetPassword} element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        </Route>

        <Route
          path={ROUTES.admin.root}
          element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id/edit" element={<AdminProductFormPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route
          path={ROUTES.seller.root}
          element={<ProtectedRoute allowedRoles={["admin", "seller"]}><SellerLayout /></ProtectedRoute>}
        >
          <Route index element={<SellerDashboardPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
          <Route path="customers" element={<SellerCustomersPage />} />
          <Route path="analytics" element={<SellerAnalyticsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
