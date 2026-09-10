import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";
import { Brand } from "../src/models/Brand";
import { Product } from "../src/models/Product";
import { Order } from "../src/models/Order";
import { Review } from "../src/models/Review";
import { hashPassword } from "../src/utils/password";
import { slugify } from "../src/utils/slugify";
import { generateOrderNumber } from "../src/utils/generateCode";

/**
 * Demo/seed data only — clearly fictional accounts and content, never real secrets.
 * Safe to run repeatedly: it wipes and recreates the seeded collections each time.
 */
async function seed(): Promise<void> {
  await connectDatabase();
  console.log("Connected to database. Seeding demo data...");

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);

  const demoPassword = await hashPassword("Demo1234");

  const admin = await User.create({
    firstName: "Amara",
    lastName: "Admin",
    email: "admin@lumera.demo",
    phone: "+224600000001",
    password: demoPassword,
    role: "admin",
    status: "active",
    isVerified: true,
  });

  const seller = await User.create({
    firstName: "Sekou",
    lastName: "Seller",
    email: "seller@lumera.demo",
    phone: "+224600000002",
    password: demoPassword,
    role: "seller",
    status: "active",
    isVerified: true,
  });

  const customer = await User.create({
    firstName: "Fatou",
    lastName: "Client",
    email: "customer@lumera.demo",
    phone: "+224600000003",
    password: demoPassword,
    role: "customer",
    status: "active",
    isVerified: true,
    addresses: [
      {
        label: "Home",
        fullName: "Fatou Client",
        line1: "12 Avenue de la République",
        city: "Conakry",
        postalCode: "00224",
        country: "Guinea",
        phone: "+224600000003",
        isDefault: true,
      },
    ],
  });

  const categoryDefs = [
    {
      name: "Electronics",
      description: "Phones, laptops and accessories",
      imageUrl: "https://picsum.photos/seed/cat-electronics/600/400",
    },
    {
      name: "Fashion",
      description: "Clothing and accessories",
      imageUrl: "https://picsum.photos/seed/cat-fashion/600/400",
    },
    {
      name: "Home & Living",
      description: "Furniture and home decor",
      imageUrl: "https://picsum.photos/seed/cat-home/600/400",
    },
  ];
  const categories = await Category.insertMany(
    categoryDefs.map((c) => ({ ...c, slug: slugify(c.name), isActive: true })),
  );

  const brand = await Brand.create({ name: "Lumera Basics", slug: "lumera-basics" });

  const productDefs = [
    { name: "Wireless Earbuds Pro", price: 350000, stock: 40, categoryIndex: 0, featured: true },
    { name: "Smartphone X12", price: 2500000, stock: 15, categoryIndex: 0, featured: true },
    { name: "Cotton T-Shirt", price: 85000, stock: 100, categoryIndex: 1, featured: false },
    { name: "Leather Sandals", price: 150000, stock: 60, categoryIndex: 1, featured: false },
    { name: "Ceramic Vase Set", price: 220000, stock: 25, categoryIndex: 2, featured: true },
    { name: "Bamboo Cutting Board", price: 60000, stock: 80, categoryIndex: 2, featured: false },
  ];

  const products = await Product.insertMany(
    productDefs.map((p, index) => ({
      name: p.name,
      slug: slugify(p.name),
      description: `${p.name} — high quality product curated for the Luméra marketplace. Demo content for local development and testing.`,
      shortDescription: `${p.name} — demo product`,
      sku: `DEMO-SKU-${String(index + 1).padStart(4, "0")}`,
      price: p.price,
      compareAtPrice: p.featured ? Math.round(p.price * 1.2) : undefined,
      currency: "GNF",
      images: [`https://picsum.photos/seed/lumera-${index}/600/600`],
      category: categories[p.categoryIndex]!._id,
      brand: brand._id,
      seller: seller._id,
      availableStock: p.stock,
      lowStockThreshold: 5,
      specifications: { origin: "Guinea" },
      tags: [p.featured ? "featured" : "standard"],
      status: "published",
      isFeatured: p.featured,
    })),
  );

  const firstProduct = products[0]!;
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: customer._id,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerEmail: customer.email,
    items: [
      {
        product: firstProduct._id,
        seller: seller._id,
        productName: firstProduct.name,
        productImage: firstProduct.images[0],
        sku: firstProduct.sku,
        unitPrice: firstProduct.price,
        quantity: 2,
        subtotal: firstProduct.price * 2,
      },
    ],
    status: "delivered",
    shippingAddress: {
      label: "Home",
      fullName: "Fatou Client",
      line1: "12 Avenue de la République",
      city: "Conakry",
      postalCode: "00224",
      country: "Guinea",
      phone: "+224600000003",
    },
    billingAddress: {
      label: "Home",
      fullName: "Fatou Client",
      line1: "12 Avenue de la République",
      city: "Conakry",
      postalCode: "00224",
      country: "Guinea",
      phone: "+224600000003",
    },
    shippingMethod: "standard",
    shippingCost: 0,
    discount: 0,
    subtotal: firstProduct.price * 2,
    total: firstProduct.price * 2,
    currency: "GNF",
    payment: {
      method: "cash_on_delivery",
      status: "captured",
      amount: firstProduct.price * 2,
      currency: "GNF",
      processedAt: new Date(),
    },
  });

  await Review.create({
    product: firstProduct._id,
    author: customer._id,
    order: order._id,
    rating: 5,
    title: "Excellent!",
    comment: "Exactly as described, fast delivery. Demo review seeded for local development.",
    verifiedPurchase: true,
  });

  await Product.updateOne({ _id: firstProduct._id }, { rating: 5, reviewCount: 1, soldStock: 2 });

  console.log("Seed complete:");
  console.log(`  Admin:    ${admin.email} / Demo1234`);
  console.log(`  Seller:   ${seller.email} / Demo1234`);
  console.log(`  Customer: ${customer.email} / Demo1234`);
  console.log(
    `  Categories: ${categories.length}, Products: ${products.length}, Orders: 1, Reviews: 1`,
  );
}

seed()
  .then(() => disconnectDatabase())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
