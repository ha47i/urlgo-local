// ============================================
// URL Go - 主程序
// ============================================

// DOM 元素引用
const elements = {
    form: null,
    input: null,
    logText: null,
    note: null,
    detail: null,
    detailContext: null
};

// 状态管理
const state = {
    keywordMap: {},
    matchedUrl: null,
    goAfterNote: false
};

/**
 * 初始化 DOM 元素引用
 */
function initElements() {
    elements.form = document.getElementById('jumpForm');
    elements.input = document.getElementById('keywordInput');
    elements.logText = document.getElementById('logtext');
    elements.note = document.getElementById('note');
    elements.detail = document.getElementById('detail');
    elements.detailContext = document.getElementById('detailcontext');
}

/**
 * 日志输出
 * @param {string} message - 日志消息
 */
function log(message) {
    elements.logText.textContent = message;
}

/**
 * 显示备注信息
 * @param {string} message - 备注消息
 */
function showNote(message) {
    elements.note.innerText = message;
}

/**
 * 在新标签页打开链接
 * @param {string} url - 要打开的 URL
 */
function openInNewTab(url) {
    const link = Object.assign(document.createElement('a'), {
        target: '_blank',
        rel: 'noopener noreferrer',
        href: url
    });
    link.click();
}

/**
 * 执行跳转
 */
function doRedirect() {
    log('已尝试打开链接!');
    if (config.open_newtab) {
        openInNewTab(state.matchedUrl);
    } else {
        window.location.assign(state.matchedUrl);
    }
}

/**
 * 解析数据文件
 * @param {string} content - 文件内容
 * @returns {Object} 关键词映射对象
 */
function parseDataFile(content) {
    const lines = content.split('\n').map(line => line.trim());
    const separatorIndex = lines.indexOf('---');
    
    if (separatorIndex === -1) {
        throw new Error('数据文件格式有误：未找到分隔符 "---"');
    }

    const dataLines = lines.slice(separatorIndex + 1);
    const keywordMap = {};
    let i = 0;

    while (i < dataLines.length) {
        const keyword = dataLines[i];
        
        // 跳过空行
        if (!keyword) {
            i++;
            continue;
        }

        const url = dataLines[i + 1];
        
        // 确保有关键词和 URL
        if (keyword && url) {
            let tip = null;
            
            // 检查是否有备注信息（第三行以 : 或：开头）
            if (i + 2 < dataLines.length) {
                const thirdLine = dataLines[i + 2];
                if (thirdLine.startsWith(':') || thirdLine.startsWith(':')) {
                    tip = thirdLine.substring(1).trim() || null;
                }
            }

            keywordMap[keyword] = { url, tip };
            i += tip !== null ? 3 : 2;
        } else {
            i++;
        }
    }

    return keywordMap;
}

/**
 * 加载数据文件
 */
async function loadData() {
    log('正在加载数据...');
    
    try {
        const response = await fetch(config.data_file);
        
        if (!response.ok) {
            throw new Error(`HTTP 错误：${response.status} ${response.statusText}`);
        }

        const content = await response.text();
        state.keywordMap = parseDataFile(content);
        log('数据加载完成');
        
    } catch (error) {
        log(`读取数据失败：${error.message || '未知错误'}`);
        console.error('数据加载错误:', error);
    }
}

/**
 * 处理输入并匹配关键词
 * @param {string} input - 用户输入
 */
function processInput(input) {
    let matchedEntry = null;

    if (config.case_sensitive) {
        // 区分大小写：直接查找
        matchedEntry = state.keywordMap[input];
    } else {
        // 不区分大小写
        if (config.enable_exceptional_case) {
            // 检查特殊情况（如 BV 号）
            const hasExceptionalPattern = config.exceptionalPatterns.some(
                pattern => pattern.test(input)
            );
            
            if (hasExceptionalPattern) {
                matchedEntry = state.keywordMap[input];
            } else {
                // 忽略大小写查找
                const lowerInput = input.toLowerCase();
                for (const [key, value] of Object.entries(state.keywordMap)) {
                    if (key.toLowerCase() === lowerInput) {
                        matchedEntry = value;
                        break;
                    }
                }
            }
        } else {
            // 简单的不区分大小写查找
            const lowerInput = input.toLowerCase();
            for (const [key, value] of Object.entries(state.keywordMap)) {
                if (key.toLowerCase() === lowerInput) {
                    matchedEntry = value;
                    break;
                }
            }
        }
    }

    // 未找到匹配项
    if (!matchedEntry || !matchedEntry.url) {
        log(`未找到"${input}"的项`);
        showNote('无匹配');
        return;
    }

    state.matchedUrl = matchedEntry.url;
    const tip = matchedEntry.tip;

    if (tip) {
        showNote(tip);
        log('请读后再次提交');
        state.goAfterNote = true;
    } else {
        showNote('无备注');
        doRedirect();
    }
}

/**
 * 处理表单提交
 */
function handleSubmit() {
    if (!state.goAfterNote) {
        const inputValue = elements.input.value.trim();
        
        if (!inputValue) {
            log('请输入关键词');
            return;
        }
        
        processInput(inputValue);
    } else {
        doRedirect();
        state.goAfterNote = false;
    }
}

/**
 * 显示详情
 */
function showDetail() {
    const context = elements.detailContext.innerHTML;
    const textContent = context.replace(/<br\s*\/?>/gi, '\n');
    alert(textContent);
}

/**
 * 从 URL 参数自动填充
 */
function autoFillFromURL() {
    const params = new URLSearchParams(window.location.search);
    const goParam = params.get('go');
    
    if (goParam) {
        elements.input.value = goParam;
    }
}

/**
 * 初始化事件监听
 */
function initEventListeners() {
    // 表单提交
    elements.form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleSubmit();
    });

    // 详情页按钮
    elements.detail.addEventListener('click', showDetail);

    // 页面加载时初始化
    document.addEventListener('DOMContentLoaded', () => {
        initElements();
        autoFillFromURL();
        loadData();
    });
}

// 启动应用
initEventListeners();
