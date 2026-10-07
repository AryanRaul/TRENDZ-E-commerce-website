import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../config/api';

const price = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [productsError, setProductsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('default');
  const [slideIndex, setSlideIndex] = useState(0);

  const search = searchParams.get('search') || '';

  useEffect(() => {
    apiRequest('/api/products')
      .then((data) => setProducts(data.products))
      .catch((error) => setProductsError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.featured && product.status === 'active'),
    [products]
  );

  useEffect(() => {
    if (featuredProducts.length <= 1) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = window.setInterval(() => {
      setSlideIndex((index) => (index + 1) % featuredProducts.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [featuredProducts.length]);

  useEffect(() => {
    if (slideIndex >= featuredProducts.length && featuredProducts.length > 0) {
      setSlideIndex(0);
    }
  }, [featuredProducts.length, slideIndex]);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products]
  );

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = products.filter(
      (product) =>
        product.status === 'active' &&
        (category === 'all' || product.category === category) &&
        (!term ||
          `${product.name} ${product.gender} ${product.category} ${product.description}`
            .toLowerCase()
            .includes(term))
    );

    if (sort === 'low') return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'high') return [...filtered].sort((a, b) => b.price - a.price);

    return filtered;
  }, [products, search, category, sort]);

  const currentSlide = featuredProducts[slideIndex];

  function shopSlide() {
    if (!currentSlide) return;

    setCategory(currentSlide.category || 'all');
    setSearchParams({ search: currentSlide.gender || currentSlide.name || '' });

    document.getElementById('shop')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function selectCategory(item) {
    setCategory(item);
    setSearchParams({});

    document.getElementById('shop')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function previousSlide() {
    setSlideIndex(
      (index) => (index - 1 + featuredProducts.length) % featuredProducts.length
    );
  }

  function nextSlide() {
    setSlideIndex((index) => (index + 1) % featuredProducts.length);
  }

  return (
    <main className="storefront-page">
      {featuredProducts.length > 0 ? (
        <section
          className="fashion-carousel"
          aria-roledescription="carousel"
          aria-label="Trendz featured products"
        >
          <div className="carousel-copy">
            <p className="eyebrow">
              {currentSlide.gender?.toUpperCase()} COLLECTION
            </p>

            <h1>{currentSlide.name}</h1>

            <p>{currentSlide.description}</p>

            <button
              className="form-submit hero-action"
              type="button"
              onClick={shopSlide}
            >
              Shop now <span>→</span>
            </button>
          </div>

          <div className="carousel-image">
            <img
              src={currentSlide.images?.[0]}
              alt={currentSlide.name}
            />

            {featuredProducts.length > 1 && (
              <div className="carousel-controls">
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={previousSlide}
                >
                  ←
                </button>

                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={nextSlide}
                >
                  →
                </button>
              </div>
            )}
          </div>

          {featuredProducts.length > 1 && (
            <div
              className="carousel-dots"
              role="tablist"
              aria-label="Featured products"
            >
              {featuredProducts.map((product, index) => (
                <button
                  type="button"
                  key={product._id}
                  role="tab"
                  aria-selected={slideIndex === index}
                  aria-label={`Show ${product.name}`}
                  className={slideIndex === index ? 'active' : ''}
                  onClick={() => setSlideIndex(index)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="fashion-carousel">
          <div className="carousel-copy">
            <p className="eyebrow">TRENDZ COLLECTION</p>
            <h1>Discover your style.</h1>
            <p>
              Explore our latest collection of fashion made for every
              occasion.
            </p>

            <button
              className="form-submit hero-action"
              type="button"
              onClick={() =>
                document.getElementById('shop')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                })
              }
            >
              Shop collection <span>→</span>
            </button>
          </div>

          <div className="carousel-image">
            <div className="catalogue-state">
              Select featured products from the admin dashboard to display
              them here.
            </div>
          </div>
        </section>
      )}

      <section
        className="category-section"
        aria-labelledby="category-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">CURATED FOR YOU</p>
            <h2 id="category-heading">Shop by category</h2>
          </div>
        </div>

        <div className="category-cards">
          {categories.map((item) => {
            const product = products.find(
              (candidate) =>
                candidate.category === item &&
                candidate.status === 'active'
            );

            return (
              <button
                type="button"
                className="category-card"
                key={item}
                onClick={() => selectCategory(item)}
              >
                {product && <img src={product.images[0]} alt="" />}

                <span>
                  <strong>{item}</strong>
                  <small>Explore now →</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className="product-section"
        id="shop"
        aria-labelledby="products-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">SHOP THE EDIT</p>
            <h2 id="products-heading">The latest arrivals</h2>
          </div>

          <p>
            {visibleProducts.length}{' '}
            {visibleProducts.length === 1 ? 'style' : 'styles'}
          </p>
        </div>

        {search && (
          <div className="search-results-note">
            <span>Showing results for “{search}”</span>

            <button
              className="text-button"
              type="button"
              onClick={() => setSearchParams({})}
            >
              Clear search
            </button>
          </div>
        )}

        <div className="catalogue-controls">
          <label>
            <span>Category</span>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>

              {categories.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Sort by</span>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="default">Featured</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </label>
        </div>

        {productsError && (
          <p className="form-error" role="alert">
            {productsError}
          </p>
        )}

        {loading ? (
          <p className="catalogue-state">
            Loading the collection…
          </p>
        ) : !visibleProducts.length ? (
          <section className="empty-results">
            <h3>No styles found</h3>

            <p>Try another term or adjust your category.</p>

            <button
              className="text-button"
              type="button"
              onClick={() => {
                setSearchParams({});
                setCategory('all');
                setSort('default');
              }}
            >
              Reset filters
            </button>
          </section>
        ) : (
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article
                className="product-card"
                key={product._id}
              >
                <Link
                  className="product-image"
                  to={`/product/${product._id}`}
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                  />

                  <span>View piece</span>
                </Link>

                <div className="product-card-content">
                  <p>
                    {product.gender} · {product.category}
                  </p>

                  <h3>
                    <Link to={`/product/${product._id}`}>
                      {product.name}
                    </Link>
                  </h3>

                  <strong>{price(product.price)}</strong>

                  <Link
                    className="product-link"
                    to={`/product/${product._id}`}
                  >
                    Select size <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}