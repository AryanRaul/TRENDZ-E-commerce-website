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

async function testRetrieval() {
    try {
        console.log('Connecting to ChromaDB...');

        const collection = await chroma.getCollection({
            name: 'trendz_products'
        });

        console.log('ChromaDB collection found.');

        const userQuery = "I need a formal men's shirt for office";

        console.log('\nUser query:');
        console.log(userQuery);

        console.log('\nCreating query embedding...');

        const queryEmbedding = await createEmbedding(userQuery);

        console.log(
            `Query embedding created. Dimensions: ${queryEmbedding.length}`
        );

        console.log('\nSearching ChromaDB...');

        const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: 3
        });

        console.log('\n===== RETRIEVED PRODUCTS =====');

        for (let i = 0; i < results.documents[0].length; i++) {
            console.log(`\nResult ${i + 1}`);

            console.log('Distance:', results.distances[0][i]);

            console.log('Product:');
            console.log(results.documents[0][i]);

            console.log('Metadata:');
            console.log(results.metadatas[0][i]);
        }

    } catch (error) {
        console.error('\nRetrieval error:', error);
    }
}

testRetrieval();