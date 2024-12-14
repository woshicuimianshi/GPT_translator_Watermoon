let translator;

document.addEventListener('DOMContentLoaded', async () => {
    // Load config if available
    try {
        const response = await fetch('key.cfg');
        if (response.ok) {
            const config = await response.text();
            const configLines = config.split('\n');
            const settings = {};
            
            configLines.forEach(line => {
                const [key, value] = line.split('=').map(s => s.trim());
                if (key && value) {
                    settings[key] = value;
                }
            });

            document.getElementById('apiKey').value = settings['api_key'] || '';
            document.getElementById('baseUrl').value = settings['base_url'] || '';
            document.getElementById('modelName').value = settings['model_name'] || '';
            document.getElementById('bilingualOutput').checked = settings['bilingual-output'] === 'True';
            document.getElementById('sourceText').value = settings['source-text'] || '';

            // 加载 Prompt.txt 文件内容
            try {
                const promptResponse = await fetch('Prompt.txt');
                if (promptResponse.ok) {
                    const promptText = await promptResponse.text();
                    document.getElementById('promptText').value = promptText;
                }
                else{
                    alert('Error: 无法加载 Prompt.txt');
                }
            } catch (error) {
                console.error('Error loading Prompt.txt:', error);
            }
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }

    // Setup file upload
    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('fileInput');

    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const text = await file.text();
            document.getElementById('sourceText').value = text;
            document.getElementById('downloadBtn').style.display = 'none';
            document.getElementById('status').textContent = 'File Uploaded';
            document.getElementById('progressBar').style.display = 'none';
        }
    });

    document.getElementById('fileInput').addEventListener('change', function(e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : ' ';
        document.getElementById('filePath').textContent = fileName;
    });
});

async function translateText() {
    const apiKey = document.getElementById('apiKey').value;
    const baseUrl = document.getElementById('baseUrl').value;
    const modelName = document.getElementById('modelName').value;
    const sourceText = document.getElementById('sourceText').value;
    const bilingual = document.getElementById('bilingualOutput').checked;
    const resultElement = document.getElementById('translationResult');

    if (!sourceText.trim()) {
        alert('Error: 请输入文字');
        return;
    }

    translator = new TextTranslator(apiKey, baseUrl, modelName);
    const statusElement = document.getElementById('status');
    
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.style.display = 'none';
    statusElement.textContent = '';
    resultElement.textContent = 'Translating...';
    
    try {
        const result = await translator.translate(sourceText, bilingual);
        resultElement.textContent = result;
        downloadBtn.style.display = 'block';
    } catch (error) {
        resultElement.textContent = `Error: ${error.message}`;
    }
}

function downloadTranslation() {
    const result = document.getElementById('translationResult').textContent;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation_result.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


