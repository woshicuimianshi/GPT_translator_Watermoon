class TextTranslator {
    constructor(apiKey, baseUrl, modelName) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.modelName = modelName;
        this.statusElement = document.getElementById('status');
    }

    updateStatus(message) {
        if (this.statusElement) {
            this.statusElement.textContent += message + '\n';
            this.statusElement.scrollTop = this.statusElement.scrollHeight;
        }
        console.log(message);
    }
    clean(text) {
        return text.replace(/<br>/g, "\n");
    }

    async askLLM(messages) {
        this.updateStatus(`Sending request to ${this.modelName}...`);
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [{
                        role: "user",
                        content: messages
                    }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get response: ${errorText}`);
            }

            const data = await response.json();
            const answer = data.choices[0].message.content;
            this.updateStatus(`Response received successfully for prompt: ...${messages.substring(0,25)}...`);
            return answer.trim();
        } catch (e) {
            this.updateStatus(`Error during API call: ${e}`);
            throw e;
        }
    }

    async translate(text, bilingual = false) {
        this.updateStatus('Starting translation...');
        
        const firstLanguage = document.getElementById('firstLanguage').value;
        const secondLanguage = document.getElementById('secondLanguage').value;
        const resultElement = document.getElementById('result');
        
        // 清空结果区域
        if (resultElement) {
            resultElement.textContent = '';
        }

        let prepromptText = document.getElementById('promptText').value;
        prepromptText = prepromptText.replaceAll('[first-language]', firstLanguage);
        prepromptText = prepromptText.replaceAll('[second-language]', secondLanguage);

        // 分段处理
        const CHUNK_SIZE = 1500; // 约 1500 字符一段
        const chunks = this.splitTextIntoChunks(text, CHUNK_SIZE);
        let translations = [];

        // 逐段翻译
        for (let i = 0; i < chunks.length; i++) {
            this.updateStatus(`Translating chunk ${i + 1}/${chunks.length}...`);
            
            let promptText = `${prepromptText}\n${chunks[i]}`;
            const response = await this.askLLM(promptText);
            const cleanResponse = this.clean(response);
            const translatedChunk = bilingual ? 
                `Original:\n${chunks[i]}\n\nTranslation:\n${cleanResponse}\n` : 
                `${cleanResponse}\n`;
            
            // 实时添加翻译结果到页面，自动滚动到底部
            resultElement.textContent += translatedChunk;
            resultElement.scrollTop = resultElement.scrollHeight;
            translations.push(translatedChunk);
        }
        const combinedTranslation = translations.join('');
        return combinedTranslation;
    }

    // 文本分段方法
    splitTextIntoChunks(text, chunkSize) {
        const chunks = [];
        
        // 优先按段落分
        const paragraphs = text.split(/\n\s*\n/);
        
        let currentChunk = '';
        
        for (const paragraph of paragraphs) {
            if ((currentChunk + paragraph).length <= chunkSize) {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            } else {
                // 如果当前段落太长，需要进一步分割
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }
                
                // 处理长段落
                if (paragraph.length > chunkSize) {
                    // 按句子分割
                    const sentences = paragraph.split(/(?<=[.!?])\s+/);
                    let tempChunk = '';
                    
                    for (const sentence of sentences) {
                        if ((tempChunk + sentence).length <= chunkSize) {
                            tempChunk += (tempChunk ? ' ' : '') + sentence;
                        } else {
                            if (tempChunk) {
                                chunks.push(tempChunk);
                            }
                            tempChunk = sentence;
                        }
                    }
                    
                    if (tempChunk) {
                        currentChunk = tempChunk;
                    }
                } else {
                    currentChunk = paragraph;
                }
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }
}