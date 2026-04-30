// ============================================
// GitHub 文件编辑器
// ============================================

// 配置信息
const config = {
    owner: 'your-username',
    repo: 'your-repo',
    filePath: '_data.txt',
    branch: 'main'
};

// 加密的令牌（需要解密后才能使用）
const encryptedToken = 'jXWxeeOCrjo99qKrpg5s3eMkb0HyiL55oAaYvXEzFsb/jwSHgn7tGq1aBZbFiXWB+QOUnahtWWBEu6fMvEmaS96dwnZ/vASpuLU9rTttDTC3ol8wLXh1wYIOnFMPQ/6jxDc5Oa/j094+9+p8+0fY5DGBkDoJa9Kd+A==';

let githubToken = '';

/**
 * Base64 编码（支持中文）
 */
function encodeBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Base64 解码（支持中文）
 */
function decodeBase64(str) {
    return decodeURIComponent(escape(atob(str)));
}

/**
 * 解密 API 调用
 */
async function decryptAPI(encryptedText, key) {
    return await aesDecryptAPI(encryptedText, key);
}

/**
 * 解密 GitHub 令牌
 */
async function decryptToken() {
    const keyInput = document.getElementById('decrypt-key').value;
    const statusDiv = document.getElementById('status');

    if (!keyInput) {
        statusDiv.innerHTML = '错误：请输入解密密钥';
        return;
    }

    statusDiv.innerHTML = '正在解密...';

    try {
        if (typeof decryptAPI === 'undefined') {
            throw new Error('解密 API 未加载，请确保 aes.js 已正确引入');
        }

        const decryptedToken = await decryptAPI(encryptedToken, keyInput);

        if (!decryptedToken) {
            throw new Error('解密失败：返回结果为空');
        }

        githubToken = decryptedToken;
        statusDiv.innerHTML = '解密成功！现在可以加载文件了。';
    } catch (error) {
        statusDiv.innerHTML = '解密失败：' + error.message;
        console.error('解密错误:', error);
    }
}

/**
 * 加载文件
 */
async function loadFile() {
    const statusDiv = document.getElementById('status');

    if (!githubToken) {
        statusDiv.innerHTML = '错误：请先解密令牌';
        return;
    }

    statusDiv.innerHTML = '正在加载文件...';

    try {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(config.filePath)}?ref=${config.branch}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': 'token ' + githubToken,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '加载失败：' + response.status);
        }

        const data = await response.json();
        const content = decodeBase64(data.content.replace(/\s/g, ''));

        document.getElementById('file-content').value = content;
        document.getElementById('file-content').dataset.sha = data.sha;
        statusDiv.innerHTML = '文件加载成功！SHA: ' + data.sha.substring(0, 8) + ' (分支：' + config.branch + ')';
    } catch (error) {
        statusDiv.innerHTML = '加载失败：' + error.message;
        console.error('加载错误:', error);
    }
}

/**
 * 保存文件
 */
async function saveFile() {
    const contentArea = document.getElementById('file-content');
    const content = contentArea.value;
    const sha = contentArea.dataset.sha;
    const statusDiv = document.getElementById('status');

    if (!githubToken) {
        statusDiv.innerHTML = '错误：请先解密令牌';
        return;
    }

    if (!sha) {
        statusDiv.innerHTML = '错误：请先加载文件内容';
        return;
    }

    statusDiv.innerHTML = '正在保存文件...';

    try {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(config.filePath)}`;
        const encodedContent = encodeBase64(content);

        const payload = {
            message: '更新 ' + config.filePath + ' 通过网页编辑器',
            content: encodedContent,
            sha: sha,
            branch: config.branch
        };

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': 'token ' + githubToken,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '保存失败：' + response.status);
        }

        const result = await response.json();
        contentArea.dataset.sha = result.content.sha;
        statusDiv.innerHTML = '文件保存成功！新 SHA: ' + result.content.sha.substring(0, 8) + ' (分支：' + config.branch + ')';
    } catch (error) {
        let errorMessage = '保存失败：' + error.message;

        if (error.message.includes('409')) {
            errorMessage = '错误：文件已被其他人修改。请重新加载文件后再试。';
        } else if (error.message.includes('404')) {
            errorMessage = '错误：文件未找到。请检查文件路径和分支设置。';
        }

        statusDiv.innerHTML = errorMessage;
        console.error('保存错误:', error);
    }
}

/**
 * 清除缓存
 */
function clearCache() {
    githubToken = '';
    document.getElementById('decrypt-key').value = '';
    document.getElementById('file-content').value = '';
    delete document.getElementById('file-content').dataset.sha;
    document.getElementById('status').innerHTML = '已清除所有敏感数据';

    // 如果浏览器支持，清理内存
    if (window.gc) {
        window.gc();
    }
}

// 初始化显示仓库信息
window.onload = function() {
    document.getElementById('repo-info').textContent = 
        config.owner + '/' + config.repo + '/' + config.filePath + ' (分支：' + config.branch + ')';
};
