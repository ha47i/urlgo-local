// ============================================
// AES 加密/解密工具
// ============================================

/**
 * AES-GCM 加密
 * @param {string} text - 要加密的文本
 * @param {string} password - 密码
 * @returns {Promise<string>} Base64 编码的加密结果
 */
async function aesEncrypt(text, password) {
    try {
        const keyBuffer = await getKeyBuffer(password);
        const key = await window.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );

        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv, tagLength: 128 },
            key,
            data
        );

        const result = new Uint8Array(iv.length + encrypted.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encrypted), iv.length);

        return arrayBufferToBase64(result);
    } catch (error) {
        throw new Error('加密失败：' + error.message);
    }
}

/**
 * AES-GCM 解密（内部实现）
 * @param {string} base64Data - Base64 编码的加密数据
 * @param {string} password - 密码
 * @returns {Promise<string>} 解密后的文本
 */
async function aesDecryptInternal(base64Data, password) {
    try {
        const data = base64ToArrayBuffer(base64Data);
        const iv = data.slice(0, 12);
        const encrypted = data.slice(12);

        const keyBuffer = await getKeyBuffer(password);
        const key = await window.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv, tagLength: 128 },
            key,
            encrypted
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        throw new Error('解密失败');
    }
}

/**
 * AES-GCM 解密（API 接口，带错误提示）
 * @param {string} base64Data - Base64 编码的加密数据
 * @param {string} password - 密码
 * @returns {Promise<string>} 解密后的文本
 */
async function aesDecryptAPI(base64Data, password) {
    try {
        return await aesDecryptInternal(base64Data, password);
    } catch (error) {
        alert('密钥错误');
        throw new Error('密钥错误');
    }
}

/**
 * 获取密钥缓冲区（固定 32 字节）
 * @param {string} password - 密码
 * @returns {Uint8Array} 密钥缓冲区
 */
function getKeyBuffer(password) {
    const encoder = new TextEncoder();
    let keyBuffer = encoder.encode(password);

    if (keyBuffer.length > 32) {
        keyBuffer = keyBuffer.slice(0, 32);
    } else if (keyBuffer.length < 32) {
        const padded = new Uint8Array(32);
        padded.set(keyBuffer);
        keyBuffer = padded;
    }

    return keyBuffer;
}

/**
 * ArrayBuffer 转 Base64
 * @param {ArrayBuffer} buffer - ArrayBuffer
 * @returns {string} Base64 字符串
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Base64 转 ArrayBuffer
 * @param {string} base64 - Base64 字符串
 * @returns {Uint8Array} Uint8Array
 */
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * 加密文本（UI 调用）
 */
async function encryptText() {
    const inputText = document.getElementById('inputText').value;
    const keyInput = document.getElementById('keyInput').value;
    const resultDiv = document.getElementById('result');

    if (!inputText) {
        showResult('请输入需要加密的文本！', 'error');
        return;
    }

    if (!keyInput) {
        showResult('请输入密钥！', 'error');
        return;
    }

    if (keyInput.length < 8) {
        showResult('密钥长度至少需要 8 位！', 'error');
        return;
    }

    try {
        showResult('加密中...', 'success');
        const encrypted = await aesEncrypt(inputText, keyInput);
        showResult(`
            <div style="margin-bottom: 10px;"><strong>加密成功！</strong></div>
            <div style="font-family: monospace; word-break: break-all; white-space: pre-wrap;">${encrypted}</div>
            <button class="copy-btn" onclick="copyToClipboard('${encrypted}')">复制加密结果</button>
        `, 'success');
    } catch (error) {
        showResult(error.message, 'error');
    }
}

/**
 * 解密文本（UI 调用）
 */
async function decryptText() {
    const inputText = document.getElementById('inputText').value;
    const keyInput = document.getElementById('keyInput').value;
    const resultDiv = document.getElementById('result');

    if (!inputText) {
        showResult('请输入需要解密的文本！', 'error');
        return;
    }

    if (!keyInput) {
        showResult('请输入密钥！', 'error');
        return;
    }

    if (keyInput.length < 8) {
        showResult('密钥长度至少需要 8 位！', 'error');
        return;
    }

    try {
        showResult('解密中...', 'success');
        const decrypted = await aesDecryptAPI(inputText, keyInput);
        showResult(`
            <div style="margin-bottom: 10px;"><strong>解密成功！</strong></div>
            <div style="font-family: monospace; word-break: break-all; white-space: pre-wrap;">${decrypted}</div>
            <button class="copy-btn" onclick="copyToClipboard('${decrypted}')">复制解密结果</button>
        `, 'success');
    } catch (error) {
        // 错误已在 aesDecryptAPI 中处理
    }
}

/**
 * 显示结果
 * @param {string} message - 消息内容
 * @param {string} type - 类型（success/error）
 */
function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="result ${type}">
            ${message}
        </div>
    `;
}

/**
 * 清空所有输入
 */
function clearAll() {
    document.getElementById('inputText').value = '';
    document.getElementById('keyInput').value = '';
    document.getElementById('result').innerHTML = '';
}

/**
 * 复制到剪贴板
 * @param {string} text - 要复制的文本
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('已复制到剪贴板！');
        })
        .catch(() => {
            // 降级方案
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('已复制到剪贴板！');
            } catch (error) {
                alert('复制失败，请手动复制！');
            }
        });
}

// 监听回车键
document.getElementById('keyInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const inputText = document.getElementById('inputText').value;
        if (inputText.includes('\n')) {
            decryptText();
        } else {
            encryptText();
        }
    }
});

// 导出 API 供外部使用
window.aesDecryptAPI = aesDecryptAPI;
