const { Ollama } = require('ollama');

const ollama = new Ollama({
    host: 'http://127.0.0.1:11434'
});

async function testOllama() {
    try {
        const response = await ollama.chat({
            model: 'llama3.2',
            messages: [
                {
                    role: 'user',
                    content: 'Say hello to TRENDZ in one sentence.'
                }
            ]
        });

        console.log('Ollama response:');
        console.log(response.message.content);
    } catch (error) {
        console.error('Ollama error:', error);
    }
}

testOllama();