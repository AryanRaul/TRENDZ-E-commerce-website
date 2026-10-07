const { Ollama } = require('ollama');
const { ChromaClient } = require('chromadb');

const ollama = new Ollama({
    host: 'http://127.0.0.1:11434'
});

const chroma = new ChromaClient({
    host: '127.0.0.1',
    port: 8000,
    ssl: false
});

async function createEmbedding(text) {
    const response = await ollama.embed({
        model: 'nomic-embed-text',
        input: text
    });

    return response.embeddings[0];
}

async function generateAnswer(userQuery, products) {
    const productContext = products
        .map((product, index) => {
            return `
Product ${index + 1}:
Name: ${product.name}
Description: ${product.description}
Gender: ${product.gender}
Category: ${product.category}
Price: ₹${product.price}
Discount: ${product.discount}%
Available sizes: ${product.sizes}
`;
        })
        .join('\n');

    const prompt = `
You are the TRENDZ fashion assistant.

Answer the user's question using ONLY the products provided in the context.

Important rules:
- Do not invent products.
- Do not invent prices.
- Do not invent sizes.
- Do not recommend products that are not in the context.
- If the products do not satisfy the user's request, clearly say so.
- Keep the answer helpful and concise.
- Mention product names and prices when recommending products.

PRODUCT CONTEXT:
${productContext}

USER QUESTION:
${userQuery}

Answer:
`;

    const response = await ollama.chat({
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

async function testRag() {
    try {
        console.log('Connecting to ChromaDB...');

        const collection = await chroma.getCollection({
            name: 'trendz_products'
        });

        console.log('ChromaDB collection found.');

        const userQuery = "I need a formal men's shirt for office";

        console.log('\n==============================');
        console.log('USER QUERY');
        console.log('==============================');
        console.log(userQuery);

        console.log('\nCreating query embedding...');

        const queryEmbedding = await createEmbedding(userQuery);

        console.log(
            `Query embedding created. Dimensions: ${queryEmbedding.length}`
        );

        console.log('\nRetrieving products from ChromaDB...');

        const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: 3
        });

        const products = results.metadatas[0];

        console.log(`Retrieved ${products.length} products.`);

        console.log('\n==============================');
        console.log('RETRIEVED PRODUCTS');
        console.log('==============================');

        products.forEach((product, index) => {
            console.log(
                `${index + 1}. ${product.name} - ₹${product.price}`
            );
        });

        console.log('\nGenerating answer with llama3.2...');

        const answer = await generateAnswer(userQuery, products);

        console.log('\n==============================');
        console.log('RAG ANSWER');
        console.log('==============================');

        console.log(answer);

        console.log('\n==============================');
        console.log('RAG TEST COMPLETED');
        console.log('==============================');

    } catch (error) {
        console.error('\nRAG test error:', error);
    }
}

testRag();