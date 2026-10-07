const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');
const Product = require('../models/Product');

const clothing = (sizes = ['S', 'M', 'L', 'XL']) => Object.fromEntries(sizes.map((size, index) => [size, 8 + index * 4]));
const footwear = (sizes = ['7', '8', '9', '10']) => Object.fromEntries(sizes.map((size, index) => [size, 4 + index * 3]));

const products = [
  ['Men’s Slate Tapered Pants', 'A clean, everyday tapered pant in a soft structured fabric.', 'men', 'pants', 1499, 1899, '/assets/srt5.webp', clothing(), true],
  ['Men’s Sand Weekend Pants', 'Relaxed-fit trousers designed for comfortable off-duty styling.', 'men', 'pants', 1599, 1999, '/assets/srt7.webp', clothing(['M', 'L', 'XL', 'XXL'])],
  ['Men’s Mono Stripe Shirt', 'A lightweight black-and-white striped shirt with a sharp casual silhouette.', 'men', 'shirts', 999, 1299, '/assets/srt1.webp', clothing(), true],
  ['Men’s Azure Cotton Shirt', 'A breathable cotton shirt finished for smart everyday wear.', 'men', 'shirts', 1099, 1399, '/assets/srt2.webp', clothing(['S', 'M', 'L', 'XL', 'XXL'])],
  ['Men’s Charcoal Tailored Trousers', 'Refined trousers with a comfortable straight cut and polished finish.', 'men', 'trousers', 1799, 2299, '/assets/srt3.webp', clothing(['S', 'M', 'L', 'XL'])],
  ['Men’s Graphite Travel Trousers', 'Versatile trousers made for workdays and weekend plans.', 'men', 'trousers', 1899, 2499, '/assets/srt4.webp', clothing(['M', 'L', 'XL', 'XXL'])],
  ['Men’s Urban Runner Shoes', 'Cushioned casual sneakers with an understated street-ready profile.', 'men', 'shoes', 2499, 3199, '/assets/download.jpg', footwear(), true],
  ['Men’s Horizon Canvas Shoes', 'Lightweight lace-up shoes for daily city walks.', 'men', 'shoes', 2199, 2799, '/assets/0c4e8c1d-21c5-4da3-90a1-7169256d6333.jpg', footwear(['6', '7', '8', '9', '10'])],
  ['Women’s Olive Easy Pants', 'High-rise pants with an easy silhouette and all-day comfort.', 'women', 'pants', 1399, 1799, '/assets/wn4.webp', clothing(['XS', 'S', 'M', 'L', 'XL']), true],
  ['Women’s Rose Relaxed Pants', 'Soft relaxed pants that pair naturally with casual essentials.', 'women', 'pants', 1499, 1899, '/assets/wn5.webp', clothing(['S', 'M', 'L', 'XL', 'XXL'])],
  ['Women’s Ivory Studio Shirt', 'A versatile crisp shirt with a light drape and elevated finish.', 'women', 'shirts', 1199, 1499, '/assets/wn4.webp', clothing(['XS', 'S', 'M', 'L', 'XL'])],
  ['Women’s Violet Everyday Shirt', 'An expressive everyday shirt in a rich violet tone.', 'women', 'shirts', 1299, 1699, '/assets/srt10.webp', clothing(['S', 'M', 'L', 'XL'])],
  ['Women’s Onyx Wide-Leg Trousers', 'Wide-leg trousers with a streamlined, contemporary look.', 'women', 'trousers', 1899, 2399, '/assets/wn6.webp', clothing(['XS', 'S', 'M', 'L', 'XL'])],
  ['Women’s Grey Pleat Trousers', 'Easy pleated trousers designed to transition across your day.', 'women', 'trousers', 1799, 2199, '/assets/srt9.webp', clothing(['S', 'M', 'L', 'XL', 'XXL'])],
  ['Women’s Daily Motion Shoes', 'Comfort-led sneakers with a clean and versatile profile.', 'women', 'shoes', 2399, 2999, '/assets/dd4869d1-df8e-483e-a688-94c93085bf26.jpg', footwear(['6', '7', '8', '9'])],
  ['Women’s City Pace Shoes', 'A lightweight casual shoe for everyday movement.', 'women', 'shoes', 2299, 2899, '/assets/1169b0eb-58a8-484a-bce0-90f10d9b9f47.jpg', footwear(['6', '7', '8', '9', '10'])],
  ['Women’s Evening Line Heels', 'Elegant heels with a refined silhouette for occasion dressing.', 'women', 'heels', 2699, 3399, '/assets/m3.png', footwear(['6', '7', '8', '9']), true],
  ['Women’s Modern Muse Heels', 'Comfortable statement heels with a subtle contemporary finish.', 'women', 'heels', 2799, 3499, '/assets/mian2.png', footwear(['7', '8', '9', '10'])],
  ['Children’s Playday Set', 'Comfortable clothing made for movement, play, and easy care.', 'children', 'clothes', 899, 1099, '/assets/tr1.webp', clothing(['XS', 'S', 'M', 'L'])],
  ['Children’s Bright Day Outfit', 'A cheerful everyday outfit with a soft, flexible feel.', 'children', 'clothes', 999, 1249, '/assets/tr3.webp', clothing(['S', 'M', 'L', 'XL'])]
].map(([name, description, gender, category, price, originalPrice, image, sizeStock, featured = false]) => ({
  name,
  description,
  gender,
  category,
  price,
  originalPrice,
  discount: Math.round(((originalPrice - price) / originalPrice) * 100),
  images: [image],
  sizes: Object.keys(sizeStock),
  sizeStock,
  featured,
  status: 'active'
}));

async function seed() {
  await connectDatabase();
  for (const product of products) {
    await Product.findOneAndUpdate(
      { name: product.name },
      { $set: product },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Seed completed: ${products.length} sample products inserted or updated.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(`Seed failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
