const mongoose = require('mongoose');
const { Ollama } = require('ollama');
const { ChromaClient } = require('chromadb');

const { connectDatabase } = require('../config/database');
const Product = require('../models/Product');

const ollama = new Ollama({
    host: 'http://127.0.0.1:11434'
});

const chroma = new ChromaClient({
    host: '127.0.0.1',
    port: 8000,
    ssl: false
});

function createProductText(product) {
    return `
Product name: ${product.name}
Description: ${product.description}
Gender: ${product.gender}
Category: ${product.category}
Price: ₹${product.price}
Discount: ${product.discount}%
Available sizes: ${(product.sizes || []).join(', ')}
    `.trim();
}

async function createEmbedding(text) {
    const response = await ollama.embed({
        model: 'nomic-embed-text',
        input: text
    });

    return response.embeddings[0];
}

async function indexProducts() {
    try {
        console.log('Connecting to MongoDB...');

        await connectDatabase();

        console.log('MongoDB connected.');

        console.log('Connecting to ChromaDB...');

        const collection = await chroma.getOrCreateCollection({
            name: 'trendz_products'
        });

        console.log('ChromaDB collection ready.');

        const products = await Product.find({
            status: 'active'
        })
            .select(
                'name description gender category price discount sizes images'
            )
            .lean();

        console.log(`Found ${products.length} active products.`);

        if (products.length === 0) {
            console.log('No active products found.');
            return;
        }

        const ids = [];
        const embeddings = [];
        const documents = [];
        const metadatas = [];

        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            console.log(
                `\nEmbedding ${i + 1}/${products.length}: ${product.name}`
            );

            const productText = createProductText(product);

            const embedding = await createEmbedding(productText);

            ids.push(product._id.toString());

            embeddings.push(embedding);

            documents.push(productText);

            metadatas.push({
                name: product.name,
                gender: product.gender,
                category: product.category,
                price: product.price,
                discount: product.discount,
                sizes: (product.sizes || []).join(', '),
                image: product.images?.[0] || ''
            });

            console.log(
                `Embedding created. Dimensions: ${embedding.length}`
            );
        }

        console.log('\nStoring embeddings in ChromaDB...');

        await collection.upsert({
            ids,
            embeddings,
            documents,
            metadatas
        });

        console.log(
            `Successfully stored ${products.length} products in ChromaDB.`
        );

        const count = await collection.count();

        console.log(
            `ChromaDB collection now contains ${count} products.`
        );

    } catch (error) {
        console.error('\nProduct indexing error:', error);
    } finally {
        await mongoose.disconnect();

        console.log('MongoDB disconnected.');
    }
}

indexProducts();