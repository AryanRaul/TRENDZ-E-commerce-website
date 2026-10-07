const { Ollama } = require('ollama');

const ollama = new Ollama({
    host: 'http://127.0.0.1:11434'
});

async function testEmbedding() {
    try {
        const response = await ollama.embed({
            model: 'nomic-embed-text',
            input: "formal men's cotton shirt for office"
        });

        console.log('Embedding generated successfully!');
        console.log('Number of dimensions:', response.embeddings[0].length);
        console.log('First 10 values:', response.embeddings[0].slice(0, 10));
    } catch (error) {
        console.error('Embedding error:', error);
    }
}

testEmbedding();