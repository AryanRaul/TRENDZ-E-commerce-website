const CATEGORY_BY_GENDER = {
  men: ['shirt', 'shirts', 'pants', 'trousers', 'clothes', 'shoes'],
  women: ['shirt', 'shirts', 'pants', 'trousers', 'clothes', 'dress', 'shoes', 'heels'],
  children: ['shirt', 'pants', 'trousers', 'clothes', 'shoes']
};
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const FOOTWEAR_SIZES = ['6', '7', '8', '9', '10', '11'];

function isFootwear(category) {
  return category === 'shoes' || category === 'heels';
}

function allowedSizes(category) {
  return isFootwear(category) ? FOOTWEAR_SIZES : CLOTHING_SIZES;
}

function validateProductShape(product) {
  const errors = [];
  if (!CATEGORY_BY_GENDER[product.gender]?.includes(product.category)) {
    errors.push(`Category '${product.category}' is not valid for gender '${product.gender}'.`);
  }
  const validSizes = allowedSizes(product.category);
  const sizes = product.sizes || [];
  const stock = product.sizeStock instanceof Map ? Object.fromEntries(product.sizeStock) : (product.sizeStock || {});
  if (!sizes.length) errors.push('At least one size is required.');
  if (sizes.some((size) => !validSizes.includes(String(size)))) {
    errors.push(`Invalid size. Allowed sizes are: ${validSizes.join(', ')}.`);
  }
  const stockKeys = Object.keys(stock);
  if (stockKeys.some((size) => !validSizes.includes(size))) {
    errors.push(`sizeStock contains an invalid size. Allowed sizes are: ${validSizes.join(', ')}.`);
  }
  if (sizes.some((size) => !Object.prototype.hasOwnProperty.call(stock, size)) || stockKeys.some((size) => !sizes.includes(size))) {
    errors.push('sizes and sizeStock keys must match exactly.');
  }
  if (stockKeys.some((size) => !Number.isInteger(stock[size]) || stock[size] < 0)) {
    errors.push('Each sizeStock value must be a non-negative integer.');
  }
  return errors;
}

module.exports = { CATEGORY_BY_GENDER, CLOTHING_SIZES, FOOTWEAR_SIZES, allowedSizes, validateProductShape };
