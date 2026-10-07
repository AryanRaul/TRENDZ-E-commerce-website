const { Ollama } = require('ollama');
const { ChromaClient } = require('chromadb');
const Product = require('../models/Product');

const ollama = new Ollama({
    host: 'http://127.0.0.1:11434'
});

const chroma = new ChromaClient({
    host: '127.0.0.1',
    port: 8000,
    ssl: false
});

/*
|--------------------------------------------------------------------------
| CREATE QUERY EMBEDDING
|--------------------------------------------------------------------------
*/

async function createQueryEmbedding(query) {
    const response = await ollama.embed({
        model: 'nomic-embed-text',
        input: query
    });

    return response.embeddings[0];
}

/*
|--------------------------------------------------------------------------
| RETRIEVE PRODUCTS FROM CHROMADB
|--------------------------------------------------------------------------
*/

async function retrieveProducts(query, limit = 10) {
    const collection = await chroma.getCollection({
        name: 'trendz_products'
    });

    const queryEmbedding =
        await createQueryEmbedding(query);

    const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit
    });

    const ids =
        results.ids?.[0] || [];

    const distances =
        results.distances?.[0] || [];

    if (!ids.length) {
        return [];
    }

    /*
     * Fetch the latest product information
     * from MongoDB.
     *
     * Chroma tells us WHICH products are relevant.
     * MongoDB gives us the latest product data.
     */

    const mongoProducts =
        await Product.find({
            _id: {
                $in: ids
            },
            status: 'active'
        })
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

    /*
     * Create a lookup table so that we can
     * preserve Chroma's semantic ranking.
     */

    const productMap =
        new Map(
            mongoProducts.map(
                (product) => [
                    product._id.toString(),
                    product
                ]
            )
        );

    const products = [];

    for (
        let i = 0;
        i < ids.length;
        i++
    ) {
        const product =
            productMap.get(ids[i]);

        if (!product) {
            continue;
        }

        products.push({
            ...product,

            /*
             * Distance is useful for debugging
             * and understanding retrieval quality.
             */
            ragDistance:
                distances[i]
        });
    }

    return products;
}

/*
|--------------------------------------------------------------------------
| GENERATE RAG ANSWER
|--------------------------------------------------------------------------
*/

async function generateRagAnswer(
    userQuery,
    products
) {
    if (!products.length) {
        return (
            "Sorry, I couldn't find any suitable " +
            "TRENDZ products for your request."
        );
    }

    const productContext =
        products
            .map(
                (product, index) => `
Product ${index + 1}
Name: ${product.name}
Description: ${product.description}
Gender: ${product.gender}
Category: ${product.category}
Price: ₹${product.price}
Original Price: ₹${product.originalPrice}
Discount: ${product.discount}%
Available Sizes: ${(product.sizes || []).join(', ')}
`
            )
            .join('\n');

    const prompt = `
You are the TRENDZ fashion assistant.

Your job is to answer the user's question using ONLY
the TRENDZ products provided in the context.

IMPORTANT RULES:

1. Never invent a product.
2. Never invent a price.
3. Never invent a size.
4. Never recommend a product that is not in the context.
5. Do not claim a product is available if it is not in the context.
6. If the retrieved products do not satisfy the request,
   clearly tell the user.
7. Keep the answer concise and helpful.
8. Mention the product name and price when recommending it.
9. Do not mention ChromaDB, embeddings, RAG, Ollama,
   or internal system details.
10. TRENDZ is an online fashion store.
11. You MUST only mention products whose exact names appear
    in the PRODUCT CONTEXT.

12. Never create, invent, or assume additional product names,
    prices, sizes, discounts, or products.

13. If only one product is provided in the PRODUCT CONTEXT,
    mention only that product.

14. The PRODUCT CONTEXT is the complete and authoritative
    product list. Do not use your general knowledge of TRENDZ
    products.

15. Before answering, verify every product name mentioned in
    your answer against the PRODUCT CONTEXT. If it is not there,
    remove it from the answer.

PRODUCT CONTEXT:
${productContext}

USER QUESTION:
${userQuery}

Give the best answer using only the product context.
`;

    const response =
        await ollama.chat({
            model: 'llama3.2',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

    return response.message.content;
}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
    createQueryEmbedding,
    retrieveProducts,
    generateRagAnswer
};