/**
 * Chemins de routage centralisés. Toute navigation (Link, navigate, redirections)
 * doit référencer ces constantes plutôt que des chaînes en dur, afin d'éviter
 * les routes mortes lors d'un renommage.
 */
export const ROUTES = {
  home: "/",
  shop: "/shop",
  product: (slug: string) => `/product/${slug}`,
  cart: "/cart",
  checkout: "/checkout",
  orderConfirmation: (orderNumber: string) => `/checkout/confirmation/${orderNumber}`,

  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",

  profile: "/profile",
  orders: "/orders",
  orderDetails: (id: string) => `/orders/${id}`,
  wishlist: "/wishlist",
  addresses: "/addresses",

  about: "/about",
  careers: "/careers",
  sellWithUs: "/sell-with-us",
  help: {
    shipping: "/help/shipping",
    contact: "/help/contact",
    faq: "/help/faq",
  },
  legal: {
    terms: "/legal/terms",
    privacy: "/legal/privacy",
    notice: "/legal/notice",
  },

  admin: {
    root: "/admin",
    products: "/admin/products",
    productNew: "/admin/products/new",
    productEdit: (id: string) => `/admin/products/${id}/edit`,
    orders: "/admin/orders",
    orderDetails: (id: string) => `/admin/orders/${id}`,
    users: "/admin/users",
    categories: "/admin/categories",
    coupons: "/admin/coupons",
    settings: "/admin/settings",
  },

  seller: {
    root: "/seller",
    products: "/seller/products",
    productNew: "/seller/products/new",
    productEdit: (id: string) => `/seller/products/${id}/edit`,
    orders: "/seller/orders",
    customers: "/seller/customers",
    analytics: "/seller/analytics",
  },

  notFound: "/404",
  forbidden: "/403",
} as const;
