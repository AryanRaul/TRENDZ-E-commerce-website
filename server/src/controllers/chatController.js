const Product = require('../models/Product');

const {
    retrieveProducts,
    generateRagAnswer
} = require('../services/ragService');

/*
|--------------------------------------------------------------------------
| TEXT HELPERS
|--------------------------------------------------------------------------
*/

function normalizeText(value = '') {
    return value
        .toLowerCase()
        .replace(/[’']/g, '')
        .replace(/[-_/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/*
|--------------------------------------------------------------------------
| GENDER DETECTION
|--------------------------------------------------------------------------
*/

function detectGender(message) {
    const text = normalizeText(message);

    if (
        /\bwomen\b|\bwomens\b|\bwoman\b|\bfemale\b|\bladies\b|\blady\b|\bgirl\b|\bgirls\b/.test(
            text
        )
    ) {
        return 'women';
    }

    if (
        /\bchildren\b|\bchild\b|\bkids\b|\bkid\b/.test(
            text
        )
    ) {
        return 'children';
    }

    if (
        /\bmen\b|\bmens\b|\bman\b|\bmale\b|\bboy\b|\bboys\b/.test(
            text
        )
    ) {
        return 'men';
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| BUDGET DETECTION
|--------------------------------------------------------------------------
*/

function detectBudget(message) {
    const text = normalizeText(message);

    const patterns = [
        /under\s*₹?\s*([\d,]+)/i,
        /below\s*₹?\s*([\d,]+)/i,
        /within\s*₹?\s*([\d,]+)/i,
        /budget\s*(?:of|is)?\s*₹?\s*([\d,]+)/i,
        /₹\s*([\d,]+)\s*(?:or\s*)?less/i,
        /less\s*than\s*₹?\s*([\d,]+)/i,
        /maximum\s*₹?\s*([\d,]+)/i,
        /max(?:imum)?\s*₹?\s*([\d,]+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);

        if (match) {
            const amount = Number(
                match[1].replace(/,/g, '')
            );

            if (
                Number.isFinite(amount) &&
                amount > 0
            ) {
                return amount;
            }
        }
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| SIZE DETECTION
|--------------------------------------------------------------------------
*/

function detectRequestedSize(message) {
    const text = normalizeText(message);

    const patterns = [
        // Clothing sizes: XS, S, M, L, XL, XXL
        /\bsize\s*(xxl|xl|xs|s|m|l)\b/i,

        // Shoe sizes: 6, 7, 8, 9, 10, 11
        /\bsize\s*(6|7|8|9|10|11)\b/i,

        // "in XL", "in size XL", "in 10"
        /\b(?:in|of|for)\s*(?:size\s*)?(xxl|xl|xs|s|m|l|6|7|8|9|10|11)\b/i,

        // "available in XL", "available in 10"
        /\bavailable\s+(?:in\s+)?(?:size\s*)?(xxl|xl|xs|s|m|l|6|7|8|9|10|11)\b/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);

        if (match) {
            return match[1].toUpperCase();
        }
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| COLOR DETECTION
|--------------------------------------------------------------------------
*/

function detectRequestedColor(message) {
    const text = normalizeText(message);

    const colors = [
        'black',
        'white',
        'grey',
        'gray',
        'cream',
        'brown',
        'blue',
        'navy',
        'red',
        'green',
        'olive',
        'violet',
        'purple',
        'pink',
        'rose',
        'azure',
        'ivory',
        'charcoal',
        'slate',
        'sand',
        'onyx',
        'mono',
        'orange',
        'yellow',
        'beige'
    ];

    for (const color of colors) {
        if (
            new RegExp(`\\b${color}\\b`, 'i')
                .test(text)
        ) {
            return color === 'gray'
                ? 'grey'
                : color;
        }
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| REQUESTED CATEGORY DETECTION
|--------------------------------------------------------------------------
*/

function detectRequestedCategory(message) {
    const text = normalizeText(message);

    /*
     * Shoes
     */

    if (
        text.includes('shoes') ||
        text.includes('shoe') ||
        text.includes('sneakers') ||
        text.includes('sneaker')
    ) {
        return 'shoes';
    }

    /*
     * Heels
     */

    if (
        text.includes('heels') ||
        text.includes('heel')
    ) {
        return 'heels';
    }

    /*
     * Shirts
     */

    if (
        text.includes('shirts') ||
        text.includes('shirt') ||
        text.includes('t shirts') ||
        text.includes('t shirt') ||
        text.includes('tshirts') ||
        text.includes('tshirt')
    ) {
        return 'shirts';
    }

    /*
     * Trousers
     */

    if (
        text.includes('trousers') ||
        text.includes('trouser')
    ) {
        return 'trousers';
    }

    /*
     * Pants / jeans
     */

    if (
        text.includes('pants') ||
        text.includes('pant') ||
        text.includes('jeans') ||
        text.includes('jean')
    ) {
        return 'pants';
    }

    /*
 * Jackets
 */

    if (
        text.includes('jackets') ||
        text.includes('jacket')
    ) {
    return 'jackets';
    }

    /*
     * Children clothes
     */

    if (
        text.includes('clothes') ||
        text.includes('clothing')
    ) {
        return 'clothes';
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| OCCASION / STYLE DETECTION
|--------------------------------------------------------------------------
*/

function detectOccasion(message) {
    const text = normalizeText(message);

    if (
        /\bwedding\b|\bmarriage\b|\bshaadi\b|\bbridal\b|\bbride\b|\bgroom\b/.test(
            text
        )
    ) {
        return 'wedding';
    }

    if (
        /\bparty\b|\bnight out\b|\bclub\b|\bclubbing\b|\bcelebration\b|\bevening\b/.test(
            text
        )
    ) {
        return 'party';
    }

    if (
        /\bdate\b|\bdate night\b|\bdinner date\b|\bromantic\b/.test(
            text
        )
    ) {
        return 'date';
    }

    if (
        /\boffice\b|\bwork\b|\bworkplace\b|\bbusiness\b|\bcorporate\b/.test(
            text
        )
    ) {
        return 'office';
    }

    if (
        /\bformal\b|\bformals\b|\bprofessional\b|\bprofessional wear\b/.test(
            text
        )
    ) {
        return 'formal';
    }

    if (
        /\bstreetwear\b|\bstreet wear\b|\burban\b|\bhip hop\b|\boversized\b|\bbaggy\b/.test(
            text
        )
    ) {
        return 'streetwear';
    }

    if (
        /\bcasual\b|\beveryday\b|\bdaily wear\b|\bdaily\b|\brelaxed\b/.test(
            text
        )
    ) {
        return 'casual';
    }

    return 'general';
}

/*
|--------------------------------------------------------------------------
| REQUEST DETECTION
|--------------------------------------------------------------------------
*/

function isOutfitRequest(message) {
    const text = normalizeText(message);

    /*
     * ---------------------------------------------------
     * EXPLICIT OUTFIT REQUESTS
     * ---------------------------------------------------
     */

    if (
        /\boutfit\b/.test(text) ||
        /\boutfits\b/.test(text) ||
        /\blook\b/.test(text) ||
        /\blooks\b/.test(text) ||
        /\bensemble\b/.test(text) ||
        /\bhead to toe\b/.test(text) ||
        /\bfull look\b/.test(text) ||
        /\bcomplete look\b/.test(text) ||
        /\bdress me\b/.test(text) ||
        /\bstyle me\b/.test(text)
    ) {
        return true;
    }

    /*
     * ---------------------------------------------------
     * SPECIFIC PRODUCT REQUESTS
     * ---------------------------------------------------
     *
     * If the user asks for a specific product category,
     * this is NOT an outfit request.
     *
     * Examples:
     *
     * "casual mens shirts"   -> shirts only
     * "formal mens shirts"   -> shirts only
     * "casual mens shoes"    -> shoes only
     * "formal mens trousers" -> trousers only
     */

    const productRequest =
        /\bshirts?\b/.test(text) ||
        /\bpants?\b/.test(text) ||
        /\btrousers?\b/.test(text) ||
        /\bjeans?\b/.test(text) ||
        /\bshoes?\b/.test(text) ||
        /\bsneakers?\b/.test(text) ||
        /\bheels?\b/.test(text);

    if (productRequest) {
        return false;
    }

    /*
     * ---------------------------------------------------
     * OCCASION / STYLE ONLY
     * ---------------------------------------------------
     *
     * "casual", "formal", "party", "wedding", etc.
     * do not automatically mean outfit.
     */

    return false;
}


/*
|--------------------------------------------------------------------------
| PRODUCT DATA HELPERS
|--------------------------------------------------------------------------
*/

function getStock(product) {
    const stock = {};

    if (
        product.sizeStock &&
        typeof product.sizeStock === 'object'
    ) {
        for (const [size, quantity] of Object.entries(
            product.sizeStock
        )) {
            stock[size] = Number(quantity) || 0;
        }
    }

    return stock;
}

function isInStock(product) {
    const stock = getStock(product);

    return Object.values(stock).some(
        (quantity) => quantity > 0
    );
}

function getProductText(product) {
    return normalizeText(
        `${product.name || ''} ${product.description || ''} ${
            product.category || ''
        }`
    );
}

function productHasRequestedSize(
    product,
    requestedSize
) {
    if (!requestedSize) {
        return true;
    }

    const targetSize =
        normalizeText(requestedSize).toUpperCase();

    const sizes =
        (product.sizes || []).map(
            (size) =>
                String(size)
                    .trim()
                    .toUpperCase()
        );

    const stock =
        getStock(product);

    if (sizes.includes(targetSize)) {
        return Number(
            stock[targetSize] || 0
        ) > 0;
    }

    const stockKey =
        Object.keys(stock).find(
            (key) =>
                String(key)
                    .trim()
                    .toUpperCase() ===
                targetSize
        );

    if (stockKey) {
        return Number(
            stock[stockKey] || 0
        ) > 0;
    }

    return false;
}


function productHasRequestedColor(
    product,
    requestedColor
) {
    if (!requestedColor) {
        return true;
    }

    const text =
        getProductText(product);

    const aliases = {
        grey: ['grey', 'gray'],
        gray: ['grey', 'gray'],

        cream: ['cream', 'beige'],
        beige: ['beige', 'cream'],

        brown: ['brown'],

        blue: ['blue', 'azure', 'navy'],
        azure: ['azure', 'blue'],
        navy: ['navy', 'blue'],

        purple: ['purple', 'violet'],
        violet: ['violet', 'purple'],

        pink: ['pink', 'rose'],
        rose: ['rose', 'pink'],

        black: ['black', 'onyx'],
        onyx: ['onyx', 'black'],

        white: ['white', 'ivory'],
        ivory: ['ivory', 'white'],

        green: ['green', 'olive'],
        olive: ['olive', 'green'],

        charcoal: [
            'charcoal',
            'grey',
            'gray'
        ],

        slate: [
            'slate',
            'grey',
            'gray'
        ],

        mono: [
            'mono',
            'black',
            'white'
        ],

        sand: [
            'sand',
            'beige',
            'cream'
        ]
    };

    const terms =
        aliases[requestedColor] ||
        [requestedColor];

    return terms.some(
        (term) =>
            new RegExp(
                `\\b${term}\\b`,
                'i'
            ).test(text)
    );
}


function productMatchesRequestedOccasion(
    product,
    occasion
) {
    if (
        !occasion ||
        occasion === 'general'
    ) {
        return true;
    }

    const score =
        getProductOccasionScore(
            product,
            occasion
        );

    if (
        occasion === 'formal' ||
        occasion === 'office'
    ) {
        return (
            isClearlyFormal(product) &&
            !isFormalConflict(product)
        );
    }

    if (occasion === 'wedding') {
        return (
            isClearlyWedding(product) ||
            isClearlyFormal(product) ||
            isClearlyParty(product)
        );
    }

    if (occasion === 'party') {
        return (
            isClearlyParty(product) ||
            (
                isClearlyFormal(product) &&
                !isFormalConflict(product)
            )
        );
    }

    if (occasion === 'date') {
        return (
            isClearlyDate(product) ||
            isClearlyCasual(product) ||
            isClearlyFormal(product)
        );
    }

    if (occasion === 'streetwear') {
        return (
            isClearlyStreetwear(product) ||
            isClearlyCasual(product)
        );
    }

    if (occasion === 'casual') {
        return (
            isClearlyCasual(product) ||
            isClearlyStreetwear(product) ||
            (
                !isClearlyFormal(product) &&
                !isClearlyWedding(product)
            )
        );
    }

    return score >= 0;
}

function formatProduct(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        gender: product.gender,
        category: product.category,
        price: Number(product.price),
        originalPrice: Number(
            product.originalPrice || product.price
        ),
        discount: Number(
            product.discount || 0
        ),
        sizes: product.sizes || [],
        stock: getStock(product),
        image: product.images?.[0] || ''
    };
}

/*
|--------------------------------------------------------------------------
| PRODUCT CATEGORY DETECTION
|--------------------------------------------------------------------------
*/

function isShirt(product) {
    const text = getProductText(product);

    const category = normalizeText(
        product.category
    );

    return (
        category === 'shirt' ||
        category === 'shirts' ||
        text.includes('shirt') ||
        text.includes('t shirt') ||
        text.includes('tshirt')
    );
}

function isBottom(product) {
    const name = normalizeText(
        product.name || ''
    );

    const description = normalizeText(
        product.description || ''
    );

    const category = normalizeText(
        product.category || ''
    );

    /*
     * Never allow shoes to be a bottom.
     */

    if (
        category === 'shoe' ||
        category === 'shoes' ||
        category === 'heels' ||
        name.includes('shoe') ||
        name.includes('sneaker') ||
        name.includes('heel') ||
        description.includes('shoe') ||
        description.includes('sneaker') ||
        description.includes('heel')
    ) {
        return false;
    }

    /*
     * Actual bottom categories.
     */

    if (
        category === 'pant' ||
        category === 'pants' ||
        category === 'trouser' ||
        category === 'trousers' ||
        category === 'jeans'
    ) {
        return true;
    }

    return (
        name.includes('jeans') ||
        name.includes('pants') ||
        name.includes('trouser') ||
        description.includes('jeans') ||
        description.includes('pants') ||
        description.includes('trouser') ||
        description.includes('denim')
    );
}

function isShoes(product) {
    const name = normalizeText(
        product.name || ''
    );

    const description = normalizeText(
        product.description || ''
    );

    const category = normalizeText(
        product.category || ''
    );

    return (
        category === 'shoe' ||
        category === 'shoes' ||
        category === 'heels' ||
        name.includes('shoe') ||
        name.includes('sneaker') ||
        name.includes('heel') ||
        description.includes('shoe') ||
        description.includes('sneaker') ||
        description.includes('heel')
    );
}

/*
|--------------------------------------------------------------------------
| PRE-COMBINED OUTFIT DETECTION
|--------------------------------------------------------------------------
*/

function isCompleteOutfit(product) {
    const text = getProductText(product);

    return (
        text.includes('outfit') ||
        text.includes('combo') ||
        text.includes('shirt &') ||
        text.includes('shirt and') ||
        text.includes('t shirt &') ||
        text.includes('t shirt and') ||
        text.includes('tshirt &') ||
        text.includes('tshirt and') ||
        text.includes('jeans &') ||
        text.includes('jeans and') ||
        text.includes('pants &') ||
        text.includes('pants and')
    );
}

/*
|--------------------------------------------------------------------------
| PRODUCT STYLE CLASSIFICATION
|--------------------------------------------------------------------------
*/

function productHasAny(product, keywords) {
    const text = getProductText(product);

    return keywords.some(
        (keyword) =>
            text.includes(
                normalizeText(keyword)
            )
    );
}

function isClearlyCasual(product) {
    return productHasAny(product, [
        'casual',
        'relaxed',
        'oversized',
        'baggy',
        'streetwear',
        'street wear',
        'urban',
        'daily wear',
        'relaxed fit',
        'relaxed-fit',
        'jogger',
        'joggers',
        'cargo',
        'graphic tee',
        'graphic t shirt',
        'graphic tshirt'
    ]);
}

function isClearlyStreetwear(product) {
    return productHasAny(product, [
        'streetwear',
        'street wear',
        'oversized',
        'baggy',
        'urban',
        'wide leg',
        'wide-leg'
    ]);
}

function isClearlyFormal(product) {
    const text = getProductText(product);

    const category = normalizeText(
        product.category
    );

    if (
        productHasAny(product, [
            'formal',
            'professional',
            'business',
            'corporate',
            'tailored',
            'dress shirt',
            'dress trousers',
            'formal shirt',
            'formal trousers',
            'suit',
            'blazer',
            'office wear',
            'workwear',
            'smart formal'
        ])
    ) {
        return true;
    }

    /*
     * Normal shirts can be formal unless
     * they contain strong casual signals.
     */

    if (
        category === 'shirt' ||
        category === 'shirts'
    ) {
        if (
            !text.includes('oversized') &&
            !text.includes('baggy') &&
            !text.includes('streetwear') &&
            !text.includes('street wear') &&
            !text.includes('graphic') &&
            !text.includes('jogger') &&
            !text.includes('joggers') &&
            !text.includes('cargo')
        ) {
            return true;
        }
    }

    /*
     * Normal trousers can be formal unless
     * they contain strong casual signals.
     */

    if (
        category === 'trouser' ||
        category === 'trousers'
    ) {
        if (
            !text.includes('oversized') &&
            !text.includes('baggy') &&
            !text.includes('cargo') &&
            !text.includes('jogger') &&
            !text.includes('joggers') &&
            !text.includes('streetwear') &&
            !text.includes('street wear')
        ) {
            return true;
        }
    }

    return false;
}

function isClearlyParty(product) {
    return productHasAny(product, [
        'party',
        'evening',
        'night out',
        'club',
        'clubbing',
        'celebration',
        'sequin',
        'sparkle',
        'glam',
        'elegant',
        'festive',
        'occasion'
    ]);
}

function isClearlyWedding(product) {
    return productHasAny(product, [
        'wedding',
        'marriage',
        'bridal',
        'bride',
        'groom',
        'ethnic',
        'festive',
        'ceremony',
        'occasion',
        'elegant'
    ]);
}

function isClearlyDate(product) {
    return productHasAny(product, [
        'date',
        'romantic',
        'elegant',
        'smart casual',
        'smart'
    ]);
}

/*
|--------------------------------------------------------------------------
| FORMAL CONFLICT DETECTION
|--------------------------------------------------------------------------
*/

function isFormalConflict(product) {
    const text = getProductText(product);

    return (
        text.includes('oversized') ||
        text.includes('baggy') ||
        text.includes('streetwear') ||
        text.includes('street wear') ||
        text.includes('urban') ||
        text.includes('relaxed fit') ||
        text.includes('relaxed-fit') ||
        text.includes('casual t shirt') ||
        text.includes('casual tshirt') ||
        text.includes('oversized t shirt') ||
        text.includes('oversized tshirt') ||
        text.includes('graphic tee') ||
        text.includes('graphic t shirt') ||
        text.includes('graphic tshirt')
    );
}

/*
|--------------------------------------------------------------------------
| OCCASION SCORE
|--------------------------------------------------------------------------
*/

function getProductOccasionScore(
    product,
    occasion
) {
    const text = getProductText(product);

    let score = 0;

    switch (occasion) {
        case 'party':

            if (isClearlyParty(product)) {
                score += 60;
            }

            if (isClearlyCasual(product)) {
                score -= 30;
            }

            if (isClearlyStreetwear(product)) {
                score -= 20;
            }

            if (
                text.includes('elegant') ||
                text.includes('classy') ||
                text.includes('occasion')
            ) {
                score += 15;
            }

            break;

        case 'formal':

            if (isClearlyFormal(product)) {
                score += 70;
            }

            if (isFormalConflict(product)) {
                score -= 150;
            }

            if (isClearlyCasual(product)) {
                score -= 80;
            }

            if (isClearlyStreetwear(product)) {
                score -= 80;
            }

            if (
                (
                    text.includes('t shirt') ||
                    text.includes('tshirt') ||
                    text.includes('tee')
                ) &&
                !isClearlyFormal(product)
            ) {
                score -= 100;
            }

            break;

        case 'office':

            if (isClearlyFormal(product)) {
                score += 70;
            }

            if (
                text.includes('smart casual') ||
                text.includes('office')
            ) {
                score += 25;
            }

            if (isClearlyStreetwear(product)) {
                score -= 100;
            }

            if (
                text.includes('oversized') ||
                text.includes('baggy')
            ) {
                score -= 100;
            }

            if (isClearlyCasual(product)) {
                score -= 70;
            }

            break;

        case 'streetwear':

            if (isClearlyStreetwear(product)) {
                score += 70;
            }

            if (isClearlyCasual(product)) {
                score += 25;
            }

            if (isClearlyFormal(product)) {
                score -= 40;
            }

            break;

        case 'casual':

            if (isClearlyCasual(product)) {
                score += 60;
            }

            if (isClearlyStreetwear(product)) {
                score += 20;
            }

            if (isClearlyFormal(product)) {
                score -= 35;
            }

            break;

        case 'wedding':

            if (isClearlyWedding(product)) {
                score += 70;
            }

            if (isClearlyParty(product)) {
                score += 15;
            }

            if (isClearlyStreetwear(product)) {
                score -= 80;
            }

            if (isClearlyCasual(product)) {
                score -= 60;
            }

            break;

        case 'date':

            if (isClearlyDate(product)) {
                score += 45;
            }

            if (isClearlyCasual(product)) {
                score += 15;
            }

            if (isClearlyStreetwear(product)) {
                score -= 10;
            }

            if (isClearlyFormal(product)) {
                score += 10;
            }

            break;

        default:
            break;
    }

    return score;
}

/*
|--------------------------------------------------------------------------
| GENERAL PRODUCT SCORE
|--------------------------------------------------------------------------
*/

function getProductScore(
    product,
    message
) {
    const occasion =
        detectOccasion(message);

    const text =
        normalizeText(message);

    let score =
        getProductOccasionScore(
            product,
            occasion
        );

    if (isCompleteOutfit(product)) {
        score += 25;
    }

    if (
        /\bstylish\b|\btrendy\b|\bfashionable\b|\bclassy\b/.test(
            text
        )
    ) {
        score += 10;
    }

    score += Math.min(
        Number(product.discount || 0) / 10,
        5
    );

    return score;
}

/*
|--------------------------------------------------------------------------
| SORT PRODUCTS
|--------------------------------------------------------------------------
*/

function sortProductsForRequest(
    products,
    message
) {
    return [...products].sort(
        (a, b) => {
            const scoreA =
                getProductScore(
                    a,
                    message
                );

            const scoreB =
                getProductScore(
                    b,
                    message
                );

            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            return (
                Number(a.price) -
                Number(b.price)
            );
        }
    );
}

/*
|--------------------------------------------------------------------------
| OPTION SCORING
|--------------------------------------------------------------------------
*/

function getOptionScore(
    option,
    message,
    budget
) {
    const occasion =
        detectOccasion(message);

    let score = 0;

    for (const product of option.products) {
        score +=
            getProductOccasionScore(
                product,
                occasion
            );
    }

    if (
        option.type ===
        'complete-outfit'
    ) {
        score += 45;
    }

    if (
        option.type ===
        'three-piece'
    ) {
        score += 15;
    }

    if (
        option.type ===
        'two-piece'
    ) {
        score += 5;
    }

    if (budget) {
        const difference =
            budget - option.total;

        if (difference >= 0) {
            score += Math.max(
                0,
                10 - difference / 500
            );
        }
    }

    return score;
}

/*
|--------------------------------------------------------------------------
| BUILD OUTFIT OPTIONS
|--------------------------------------------------------------------------
*/

function findOutfitOptions(
    products,
    budget,
    message,
    gender,
    requestedSize
) {
    

    /*
     * Filter by gender.
     */

    if (gender) {
        products =
            products.filter(
                (product) =>
                    normalizeText(
                        product.gender
                    ) ===
                    normalizeText(
                        gender
                    )
            );
    }

    /*
    * Filter by requested size.
    */
    

    const occasion =
    detectOccasion(message);

    /*
     * Separate product types.
     */

    const completeOutfits =
        products.filter(
            (product) =>
                isCompleteOutfit(product)
        );

    const shirts =
        products.filter(
            (product) =>
                isShirt(product) &&
                !isCompleteOutfit(product)
        );

    const bottoms =
        products.filter(
            (product) =>
                isBottom(product) &&
                !isCompleteOutfit(product)
        );
    

    const shoes =
        products.filter(
            (product) =>
                isShoes(product) &&
                !isCompleteOutfit(product)
        );

    const isShoeSizeRequest =
    requestedSize &&
    ['6', '7', '8', '9', '10', '11'].includes(
        String(requestedSize).trim().toUpperCase()
    );

    const isClothingSizeRequest =
    requestedSize &&
    !isShoeSizeRequest;    

    const sizeFilteredShirts =
    shirts.filter(
        (product) =>
            !isClothingSizeRequest ||
            productHasRequestedSize(
                product,
                requestedSize
            )
    );

    const sizeFilteredBottoms =
    bottoms.filter(
        (product) =>
            !isClothingSizeRequest ||
            productHasRequestedSize(
                product,
                requestedSize
            )
    );

    const sizeFilteredShoes =
    shoes.filter(
        (product) =>
            !isShoeSizeRequest ||
            productHasRequestedSize(
                product,
                requestedSize
            )
    );


    /*
     * Occasion compatibility.
     */

    function isCompatibleWithOccasion(product) {
        
        const score =
            getProductOccasionScore(
                product,
                occasion
            );

        if (occasion === 'general') {
            return true;
        }

        /*
         * FORMAL
         */

        if (occasion === 'formal') {
            if (
                isClearlyCasual(product) ||
                isClearlyStreetwear(product)
            ) {
                return false;
            }

            return isClearlyFormal(product);
        }

        /*
         * OFFICE
         */

        if (occasion === 'office') {
            if (
                isClearlyCasual(product) ||
                isClearlyStreetwear(product)
            ) {
                return false;
            }

            return (
                isClearlyFormal(product) ||
                productHasAny(product, [
                    'office',
                    'smart casual',
                    'business casual',
                    'professional'
                ])
            );
        }

        /*
         * WEDDING
         */

        if (occasion === 'wedding') {
            if (
                isClearlyStreetwear(product)
            ) {
                return false;
            }

            if (
                isClearlyCasual(product) &&
                !isClearlyWedding(product)
            ) {
                return false;
            }

            return (
                isClearlyWedding(product) ||
                isClearlyFormal(product) ||
                isClearlyParty(product)
            );
        }

        /*
         * PARTY
         */

        if (occasion === 'party') {
            if (
                isClearlyStreetwear(product) &&
                !isClearlyParty(product)
            ) {
                return false;
            }

            if (
                isClearlyCasual(product) &&
                !isClearlyParty(product) &&
                !isClearlyStreetwear(product)
            ) {
                return false;
            }

            return (
                isClearlyParty(product) ||
                isClearlyFormal(product) ||
                score >= 0
            );
        }

        /*
         * DATE
         */

        if (occasion === 'date') {
            if (
                isClearlyStreetwear(product) &&
                !isClearlyDate(product)
            ) {
                return false;
            }

            return (
                isClearlyDate(product) ||
                isClearlyCasual(product) ||
                isClearlyFormal(product)
            );
        }

        /*
         * STREETWEAR
         */

        if (occasion === 'streetwear') {
            if (
                isClearlyFormal(product) &&
                !isClearlyStreetwear(product)
            ) {
                return false;
            }

            return (
                isClearlyStreetwear(product) ||
                isClearlyCasual(product)
            );
        }

        /*
         * CASUAL
         */

        if (occasion === 'casual') {
            if (
                isClearlyFormal(product) &&
                !isClearlyCasual(product)
            ) {
                return false;
            }
            
            if (
                isClearlyWedding(product) &&
                !isClearlyCasual(product)
            ) {
                 return false;
            }
            return true;
    }
    return true;

    }

    /*
     * Filter by occasion.
     */

    const compatibleCompleteOutfits =
        completeOutfits.filter(
            isCompatibleWithOccasion
        );

    const compatibleShirts =
    sizeFilteredShirts.filter(
        isCompatibleWithOccasion
    );

    const compatibleBottoms =
    sizeFilteredBottoms.filter(
        isCompatibleWithOccasion
    );

    const compatibleShoes =
    sizeFilteredShoes.filter(
        isCompatibleWithOccasion
    ); 

    /*
     * Sort product groups.
     */

    const sortedCompleteOutfits =
        sortProductsForRequest(
            compatibleCompleteOutfits,
            message
        );

    const sortedShirts =
        sortProductsForRequest(
            compatibleShirts,
            message
        );

    const sortedBottoms =
        sortProductsForRequest(
            compatibleBottoms,
            message
        );

    const sortedShoes =
        sortProductsForRequest(
            compatibleShoes,
            message
        );

    const options = [];

    /*
     * COMPLETE OUTFITS
     */

    if (!isShoeSizeRequest) {
    for (
        const outfit of
        sortedCompleteOutfits
    ) {
        if (
            requestedSize &&
        !isShoeSizeRequest &&
        !productHasRequestedSize(
        outfit,
        requestedSize
    )
) {
    continue;
}
        if (
            gender &&
            normalizeText(
                outfit.gender
            ) !==
                normalizeText(
                    gender
                )
        ) {
            continue;
        }

        const total =
            Number(outfit.price);

        if (
            Number.isFinite(total) &&
            (
                !budget ||
                total <= budget
            )
        ) {
            options.push({
                type: 'complete-outfit',
                products: [outfit],
                total
            });
        }
    }
}

    /*
     * SHIRT + BOTTOM
     */

    for (
        const shirt of sortedShirts
    ) {
        if (
            gender &&
            normalizeText(
                shirt.gender
            ) !==
                normalizeText(
                    gender
                )
        ) {
            continue;
        }

        if (isShoes(shirt)) {
            continue;
        }

        for (
            const bottom of
            sortedBottoms
        ) {
            if (
                gender &&
                normalizeText(
                    bottom.gender
                ) !==
                    normalizeText(
                        gender
                    )
            ) {
                continue;
            }

            if (isShoes(bottom)) {
                continue;
            }

            if (
                (
                    occasion === 'formal' ||
                    occasion === 'office'
                ) &&
                (
                    isFormalConflict(shirt) ||
                    isFormalConflict(bottom)
                )
            ) {
                continue;
            }

            const shirtPrice =
                Number(shirt.price);

            const bottomPrice =
                Number(bottom.price);

            const total =
                shirtPrice +
                bottomPrice;

            if (
                Number.isFinite(total) &&
                (
                    !budget ||
                    total <= budget
                )
            ) {
                options.push({
                    type: 'two-piece',
                    products: [
                        shirt,
                        bottom
                    ],
                    total
                });
            }
        }
    }

    /*
     * SHIRT + BOTTOM + SHOES
     */

    for (
        const shirt of sortedShirts
    ) {
            
        if (
            gender &&
            normalizeText(
                shirt.gender
            ) !==
                normalizeText(
                    gender
                )
        ) {
            continue;
        }

        if (isShoes(shirt)) {
            continue;
        }

        for (
            const bottom of
            sortedBottoms
        ) {
            if (
                gender &&
                normalizeText(
                    bottom.gender
                ) !==
                    normalizeText(
                        gender
                    )
            ) {
                continue;
            }

            if (isShoes(bottom)) {
                continue;
            }

            if (
                (
                    occasion === 'formal' ||
                    occasion === 'office'
                ) &&
                (
                    isFormalConflict(shirt) ||
                    isFormalConflict(bottom)
                )
            ) {
                continue;
            }

            for (
                const shoe of
                sortedShoes
            ) {
                if (
                    gender &&
                    normalizeText(
                        shoe.gender
                    ) !==
                        normalizeText(
                            gender
                        )
                ) {
                    continue;
                }

                if (!isShoes(shoe)) {
                    continue;
                }

                const shirtPrice =
                    Number(shirt.price);

                const bottomPrice =
                    Number(bottom.price);

                const shoePrice =
                    Number(shoe.price);

                const total =
                    shirtPrice +
                    bottomPrice +
                    shoePrice;

                if (
                    Number.isFinite(total) &&
                    (
                        !budget ||
                        total <= budget
                    )
                ) {
                    options.push({
                        type: 'three-piece',
                        products: [
                            shirt,
                            bottom,
                            shoe
                        ],
                        total
                    });
                }
            }
        }
    }

    /*
     * Remove duplicate combinations.
     */

    const uniqueOptions = [];
    const seen = new Set();

    for (
        const option of options
    ) {
        const key =
            option.products
                .map(
                    (product) =>
                        product._id.toString()
                )
                .sort()
                .join('|');

        if (!seen.has(key)) {
            seen.add(key);

            uniqueOptions.push(
                option
            );
        }
    }

    /*
     * Final option ranking.
     */

    uniqueOptions.sort(
        (a, b) => {
            const scoreA =
                getOptionScore(
                    a,
                    message,
                    budget
                );

            const scoreB =
                getOptionScore(
                    b,
                    message,
                    budget
                );

            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            const typeWeight = {
                'complete-outfit': 100,
                'three-piece': 50,
                'two-piece': 25
            };

            const weightA =
                typeWeight[a.type] || 0;

            const weightB =
                typeWeight[b.type] || 0;

            if (
                weightA !== weightB
            ) {
                return weightB - weightA;
            }

            return (
                a.total -
                b.total
            );
        }
    );

    /*
     * Final gender safety filter.
     */

    const genderSafeOptions =
        uniqueOptions.filter(
            (option) => {
                if (!gender) {
                    return true;
                }

                return option.products.every(
                    (product) =>
                        normalizeText(
                            product.gender
                        ) ===
                        normalizeText(
                            gender
                        )
                );
            }
        );

    /*
     * Final formal/office safety filter.
     */

    const finalOptions =
        genderSafeOptions.filter(
            (option) => {
                if (
                    occasion !== 'formal' &&
                    occasion !== 'office'
                ) {
                    return true;
                }

                return option.products.every(
                    (product) =>
                        !isFormalConflict(
                            product
                        ) &&
                        !isClearlyStreetwear(
                            product
                        ) &&
                        !isClearlyCasual(
                            product
                        )
                );
            }
        );

    return finalOptions.slice(0, 5);
}

/*
|--------------------------------------------------------------------------
| OUTFIT RESPONSE
|--------------------------------------------------------------------------
*/

function createOutfitMessage(
    options,
    budget,
    message
) {
    if (!options.length) {
        if (budget) {
            return (
                `Sorry, TRENDZ currently does not have ` +
                `a suitable outfit combination within ₹${budget}.`
            );
        }

        return (
            'Sorry, TRENDZ currently does not have ' +
            'a suitable outfit combination from the available catalog.'
        );
    }

    const bestOption =
        options[0];

    const occasion =
        detectOccasion(message);
     
       

    let intro =
        'Here is a TRENDZ outfit recommendation';

    switch (occasion) {
        case 'party':
            intro += ' for your party';
            break;

        case 'formal':
            intro += ' for a formal look';
            break;

        case 'office':
            intro += ' for the office';
            break;

        case 'casual':
            intro += ' for a casual look';
            break;

        case 'streetwear':
            intro += ' for a streetwear look';
            break;

        case 'wedding':
            intro += ' for a wedding';
            break;

        case 'date':
            intro += ' for your date';
            break;

        default:
            break;
    }

    if (budget) {
        intro += ` under ₹${budget}`;
    }

    intro += ':';

    const productLines =
        bestOption.products
            .map(
                (product) =>
                    `• ${product.name} — ₹${Number(
                        product.price
                    )}`
            )
            .join('\n');

    let response =
        `${intro}\n\n` +
        `${productLines}\n\n` +
        `Total: ₹${bestOption.total}`;

    if (
        bestOption.type ===
        'complete-outfit'
    ) {
        response +=
            '\n\nThis complete outfit is available directly from TRENDZ.';
    } else if (
        bestOption.type ===
        'three-piece'
    ) {
        response +=
            '\n\nThese TRENDZ pieces work together to create a complete look.';
    } else {
        response +=
            '\n\nThese TRENDZ pieces work well together for a complete look.';
    }

    return response;
}

/*
|--------------------------------------------------------------------------
| NORMAL PRODUCT RESPONSE
|--------------------------------------------------------------------------
*/

function createProductMessage(
    products,
    budget,
    message
) {
    let available =
        sortProductsForRequest(
            products,
            message
        );

    if (budget) {
        available =
            available.filter(
                (product) =>
                    Number(product.price) <=
                    budget
            );
    }

    available =
        available.slice(0, 5);

    if (!available.length) {
        if (budget) {
            return (
                `Sorry, TRENDZ currently does not have ` +
                `a suitable product within ₹${budget}.`
            );
        }

        return (
            'Sorry, TRENDZ currently does not have ' +
            'a suitable product available right now.'
        );
    }

    const lines =
        available.map(
            (product) =>
                `• ${product.name} — ₹${Number(
                    product.price
                )}`
        );

    return (
        'Here are some TRENDZ products that match your request:\n\n' +
        lines.join('\n')
    );
}

/*
|--------------------------------------------------------------------------
| FALLBACK MONGODB RETRIEVAL
|--------------------------------------------------------------------------
|
| Used only if ChromaDB/Ollama is temporarily unavailable.
|
|--------------------------------------------------------------------------
*/

async function getFallbackProducts(
    gender
) {
    const query = {
        status: 'active'
    };

    if (gender) {
        query.gender = gender;
    }

    let products =
        await Product.find(query)
            .select(
                [
                    'name',
                    'description',
                    'gender',
                    'category',
                    'price',
                    'originalPrice',
                    'discount',
                    'sizes',
                    'sizeStock',
                    'images'
                ].join(' ')
            )
            .lean();

    products =
        products.filter(
            isInStock
        );

    return products;
}

/*
|--------------------------------------------------------------------------
| MAIN CHAT CONTROLLER
|--------------------------------------------------------------------------
*/

const chat = async (
    req,
    res
) => {
    try {
        const {
            message
        } = req.body;

        /*
         * Validate message.
         */

        if (
            !message ||
            typeof message !== 'string' ||
            !message.trim()
        ) {
            return res.status(400).json({
                message:
                    'Message is required.',
                products: []
            });
        }

        const userMessage =
            message.trim();

        /*
         * ---------------------------------------------------
         * DETECT USER REQUIREMENTS
         * ---------------------------------------------------
         */

        const gender =
            detectGender(
                userMessage
            );

        const budget =
            detectBudget(
                userMessage
            );

        const requestedCategory =
            detectRequestedCategory(
                userMessage
            );
        console.log(
            '[DEBUG] requestedCategory:',
            requestedCategory,
            '| message:',
            userMessage
        );    

        const requestedSize =
        detectRequestedSize(
            userMessage
             );
         
        console.log(
            '[DEBUG] requestedSize:',
            requestedSize,
            '| message:',
            userMessage
            );     

        const requestedColor =
        detectRequestedColor(
            userMessage
             );

        const requestedOccasion =
        detectOccasion(
            userMessage
             );    

        const outfitRequest =
        isOutfitRequest(userMessage) &&
        !requestedCategory;

        /*
         * ---------------------------------------------------
         * RAG RETRIEVAL
         * ---------------------------------------------------
         *
         * Outfit requests get a larger candidate pool
         * because we may need shirts + bottoms + shoes.
         *
         * Normal requests use fewer products.
         * ---------------------------------------------------
         */

        const retrievalLimit =
            outfitRequest
                ? 15
                : 10;

        let products = [];

        try {
            console.log(
                '\n[RAG] Retrieving products...'
            );

            products =
                await retrieveProducts(
                    userMessage,
                    retrievalLimit
                );

            console.log(
                `[RAG] Retrieved ${products.length} products.`
            );
        } catch (ragError) {
            /*
             * RAG failure should not completely
             * break the chatbot.
             */

            console.error(
                '[RAG] Retrieval failed:',
                ragError.message
            );

            console.log(
                '[RAG] Falling back to MongoDB retrieval.'
            );

            products =
                await getFallbackProducts(
                    gender
                );
        }

        /*
         * ---------------------------------------------------
         * HARD BUSINESS FILTERS
         * ---------------------------------------------------
         *
         * Semantic retrieval finds products based on
         * meaning.
         *
         * These filters enforce actual store rules.
         * ---------------------------------------------------
         */

        /*
         * Gender.
         */

        if (gender) {
            products =
                products.filter(
                    (product) =>
                        normalizeText(
                            product.gender
                        ) ===
                        normalizeText(
                            gender
                        )
                );
        }

        /*
         * Stock.
         */

        products =
            products.filter(
                isInStock
            );

        /*
         * Budget.
         */

        if (budget) {
            products =
                products.filter(
                    (product) =>
                        Number(
                            product.price
                        ) <=
                        budget
                );
        }

        /*
         * ---------------------------------------------------
         * OUTFIT REQUEST
         * ---------------------------------------------------
         *
         * IMPORTANT:
         *
         * We do NOT apply requestedCategory here.
         *
         * An outfit may legitimately need multiple
         * categories such as shirt + pants + shoes.
         * ---------------------------------------------------
         */

        if (outfitRequest) {
            const outfitOptions =
            findOutfitOptions(
                products,
                budget,
                userMessage,
                gender,
                requestedSize
            );

            const recommendationData =
                outfitOptions.map(
                    (
                        option,
                        index
                    ) => ({
                        option:
                            index + 1,
                        type:
                            option.type,
                        products:
                            option.products.map(
                                formatProduct
                            ),
                        total:
                            option.total
                    })
                );

            const finalMessage =
                createOutfitMessage(
                    outfitOptions,
                    budget,
                    userMessage
                );

            return res.json({
                message:
                    finalMessage,
                products:
                    recommendationData
            });
        }

        /*
         * ---------------------------------------------------
         * NORMAL PRODUCT REQUEST
         * ---------------------------------------------------
         *
         * RAG retrieves semantically relevant products.
         *
         * Then we apply hard category filtering.
         *
         * Example:
         *
         * User:
         * "Show me womens shoes"
         *
         * requestedCategory:
         * "shoes"
         *
         * Only products with category "shoes"
         * are allowed to continue.
         * ---------------------------------------------------
         */

        let verifiedProducts =
            products;

        /*
         * CATEGORY FILTER
         */

        /*
 * CATEGORY FILTER
 *
 * This is a HARD filter.
 *
 * If the user asks for a specific category,
 * only products from that category are allowed.
 */

if (requestedCategory) {
    verifiedProducts =
        verifiedProducts.filter(
            (product) => {
                const category =
                    normalizeText(
                        product.category
                    );

                switch (
                    requestedCategory
                ) {
                    case 'shoes':
                        return (
                            category === 'shoe' ||
                            category === 'shoes'
                        );

                    case 'heels':
                        return (
                            category === 'heel' ||
                            category === 'heels'
                        );

                    case 'shirts':
                        return (
                            category === 'shirt' ||
                            category === 'shirts'
                        );

                    case 'trousers':
                        return (
                            category === 'trouser' ||
                            category === 'trousers'
                        );

                    case 'pants':
                        return (
                            category === 'pant' ||
                            category === 'pants' ||
                            category === 'jeans'
                        );

                    case 'clothes':
                        return (
                            category === 'clothes'
                        );

                    case 'jackets':
                        return (
                            category === 'jacket' ||
                            category === 'jackets'
                        );

                    default:
                        return false;
                }
            }
        );

    /*
     * Do not return complete outfits
     * when the user asks for one specific
     * product category.
     */
    verifiedProducts =
        verifiedProducts.filter(
            (product) =>
                !isCompleteOutfit(product)
        );
}
        /*
 * SIZE FILTER
 */




/*
 * COLOR FILTER
 */

if (requestedColor) {
    verifiedProducts =
        verifiedProducts.filter(
            (product) =>
                productHasRequestedColor(
                    product,
                    requestedColor
                )
        );
}


/*
 * OCCASION / STYLE FILTER
 */

if (
    requestedOccasion &&
    requestedOccasion !== 'general' &&
    !requestedCategory
) {
    verifiedProducts =
        verifiedProducts.filter(
            (product) =>
                productMatchesRequestedOccasion(
                    product,
                    requestedOccasion
                )
        );
}

        /*
         * Sort the remaining verified products.
         */

        verifiedProducts =
            sortProductsForRequest(
                verifiedProducts,
                userMessage
            );

        /*
         * Keep only the best 5 products.
         */

        verifiedProducts =
            verifiedProducts.slice(
                0,
                5
            );

        /*
         * ---------------------------------------------------
         * GENERATE RAG ANSWER
         * ---------------------------------------------------
         */

        let finalMessage;

        try {
            /*
             * If no products survived the hard filters,
             * don't send an empty context to the LLM.
             */

            if (!verifiedProducts.length) {
                finalMessage =
                    createProductMessage(
                        verifiedProducts,
                        budget,
                        userMessage
                    );
            } else {
                console.log(
                    '[RAG] Generating answer with llama3.2...'
                );

                finalMessage =
                    await generateRagAnswer(
                        userMessage,
                        verifiedProducts
                    );

                console.log(
                    '[RAG] Answer generated successfully.'
                );
            }
        } catch (generationError) {
            /*
             * If Llama is unavailable, use the old
             * deterministic response instead.
             */

            console.error(
                '[RAG] Generation failed:',
                generationError.message
            );

            console.log(
                '[RAG] Falling back to deterministic response.'
            );

            finalMessage =
                createProductMessage(
                    verifiedProducts,
                    budget,
                    userMessage
                );
        }

        /*
         * ---------------------------------------------------
         * RETURN RESPONSE
         * ---------------------------------------------------
         *
         * Response structure remains compatible
         * with the existing React chatbot.
         * ---------------------------------------------------
         */

        return res.json({
            message:
                finalMessage,

            products:
                verifiedProducts.map(
                    (
                        product,
                        index
                    ) => ({
                        option:
                            index + 1,

                        type:
                            'product',

                        products: [
                            formatProduct(
                                product
                            )
                        ],

                        total:
                            Number(
                                product.price
                            )
                    })
                )
        });
    } catch (error) {
        console.error(
            'Chatbot error:',
            error
        );

        return res.status(500).json({
            message:
                'Something went wrong while processing your request.',
            products: []
        });
    }
};

module.exports = {
    chat
};

