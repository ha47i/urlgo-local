// ============================================
// URL Go - 旧版主程序 (版本 1.5)
// ============================================

// DOM 元素引用
const elements = {
    input: null,
    submitBtn: null,
    logOutput: null,
    statusInfo: null,
    loading: null
};

// 状态管理
const state = {
    logQueue: [],
    isProcessing: false,
    processTimer: null,
    caseSensitive: false
};

/**
 * 初始化 DOM 元素
 */
function initElements() {
    elements.input = document.getElementById('vInput');
    elements.submitBtn = document.getElementById('submitBtn');
    elements.logOutput = document.getElementById('logOutput');
    elements.statusInfo = document.getElementById('statusInfo');
    elements.loading = document.getElementById('loading');
    elements.submitBtn.disabled = true;
}

/**
 * 显示加载动画
 */
function showLoading() {
    elements.loading.classList.add('loading');
}

/**
 * 隐藏加载动画
 */
function hideLoading() {
    setTimeout(() => {
        elements.loading.classList.remove('loading');
    }, 300);
}

/**
 * 添加日志消息到队列
 * @param {string} message - 日志消息
 * @param {string} type - 类型（info/success/error）
 */
function addLog(message, type = 'info') {
    state.logQueue.push({ message, type });
    state.isProcessing = true;
    
    if (!state.processTimer) {
        processLogQueue();
    }
}

/**
 * 处理日志队列
 */
function processLogQueue() {
    if (state.logQueue.length === 0) {
        state.processTimer = null;
        state.isProcessing = false;
        return;
    }

    const { message, type } = state.logQueue.shift();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry ' + type;
    logEntry.textContent = message;
    
    elements.logOutput.insertBefore(logEntry, elements.logOutput.firstChild);
    
    state.processTimer = setTimeout(processLogQueue, 250 + Math.random() * 300);
}

/**
 * 等待处理完成后再执行回调
 * @param {Function} callback - 回调函数
 */
function waitForProcessing(callback) {
    const interval = setInterval(() => {
        if (state.isProcessing) {
            clearInterval(interval);
            callback();
        }
    }, 100);
}

/**
 * 启动处理流程
 */
function startProcessing() {
    showLoading();
    addLog('本次关键词：', 'info');
    waitForProcessing(() => {
        hideLoading();
    });
    setTimeout(() => {
        elements.submitBtn.disabled = true;
    }, 500);
}

/**
 * 检查是否为特殊情况（如 BV 号）
 * @param {string} input - 输入字符串
 * @returns {boolean} 是否为特殊情况
 */
function isExceptionalCase(input) {
    if (!config.enable_exceptional_case) return false;
    
    for (const pattern of config.exceptionalPatterns) {
        if (pattern.test(input)) {
            return true;
        }
    }
    return false;
}

/**
 * 处理表单提交
 */
function handleSubmit() {
    elements.submitBtn.disabled = true;
    showLoading();
    
    console.log('「1851e6b9979255737f9afb0fcc80b3aa8463dbc27e470743b0c5c1b00adb8037d72cee404baecc」');
    
    const inputValue = elements.input.value.trim();
    elements.logOutput.innerHTML = '';
    addLog('开始处理...');

    if (!inputValue) {
        addLog('关键词为空。', 'error');
        waitForProcessing(() => {
            elements.submitBtn.disabled = false;
            hideLoading();
        });
        return;
    }

    // 显示大小写敏感性提示
    if (config.case_sensitive) {
        addLog(`本次关键词：${inputValue}\n（区分大小写）`);
    } else if (config.enable_exceptional_case && isExceptionalCase(inputValue)) {
        addLog(`本次关键词：${inputValue}\n（特殊情况，本次区分大小写）`);
    } else {
        addLog(`本次关键词：${inputValue}\n（不区分大小写）`);
    }

    setTimeout(() => {
        processKeyword(inputValue);
    }, 300);
}

/**
 * 打开新窗口（处理弹窗拦截）
 * @param {string} url - 要打开的 URL
 */
function openWindow(url) {
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
        addLog('弹出窗口行为被拦截 ✕\n请去浏览器设置中允许"弹出式窗口"。', 'error');
        addLog('别担心，我们直接跳转...', 'info');
        waitForProcessing(() => {
            setTimeout(() => {
                window.location.href = url;
            }, 1000);
        });
    }
}

/**
 * 处理关键词匹配和跳转
 * @param {string} input - 用户输入
 */
function processKeyword(input) {
    addLog('读取数据文件...');
    
    fetch(config.data_file)
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载数据文件。\n（' + response.status + ' ' + response.statusText + '）');
            }
            return response.text();
        })
        .then(content => {
            const lines = content.split('\n').map(line => line.trim());
            const separatorIndex = lines.indexOf('---');
            
            if (separatorIndex === -1) {
                throw new Error('未找到分隔符 "---"。');
            }

            const dataLines = lines.slice(separatorIndex + 1).filter((line, index, arr) => true);
            const keywordMap = {};
            let i = 0;

            while (i < dataLines.length) {
                const keyword = dataLines[i];
                
                if (!keyword) {
                    i++;
                    continue;
                }

                const url = dataLines[i + 1];
                
                if (keyword && url) {
                    let tip = null;
                    
                    if (i + 2 < dataLines.length) {
                        const thirdLine = dataLines[i + 2];
                        if (thirdLine.startsWith(':') || thirdLine.startsWith(':')) {
                            tip = thirdLine.substring(1).trim();
                            if (tip === '') tip = null;
                        }
                    }

                    keywordMap[keyword] = { url, tip };
                    i += keywordMap[keyword].tip !== null ? 3 : 2;
                } else {
                    i++;
                }
            }

            // 确定是否区分大小写
            let matchedEntry = null;
            let isCaseSensitive = config.case_sensitive;
            
            if (config.enable_exceptional_case && isExceptionalCase(input)) {
                isCaseSensitive = true;
            }

            if (isCaseSensitive) {
                matchedEntry = keywordMap[input];
            } else {
                for (const [key, value] of Object.entries(keywordMap)) {
                    if (key.toLowerCase() === input.toLowerCase()) {
                        matchedEntry = value;
                        break;
                    }
                }
            }

            // 未找到匹配项
            if (!matchedEntry || !matchedEntry.url) {
                addLog('没有匹配 "' + input + '" 的 URL。', 'error');
                waitForProcessing(() => {
                    elements.submitBtn.disabled = false;
                    hideLoading();
                });
                return;
            }

            const targetUrl = matchedEntry.url;
            const tip = matchedEntry.tip;

            addLog('匹配到↓\n' + targetUrl);

            function doRedirect() {
                addLog('准备前往！');
                waitForProcessing(() => {
                    setTimeout(() => {
                        addLog('出发咯！(≧▽≦)', 'success');
                        waitForProcessing(() => {
                            elements.submitBtn.disabled = false;
                            hideLoading();
                            setTimeout(() => {
                                if (config.open_newtab) {
                                    openWindow(targetUrl);
                                } else {
                                    window.location.href = targetUrl;
                                }
                            }, 200);
                        });
                    }, 200);
                });
            }

            if (tip) {
                addLog('来自关键词的提示：\n（点击确定以继续...）\n＿＿＿\n' + tip);
                waitForProcessing(() => {
                    setTimeout(() => {
                        const confirmed = confirm('来自关键词的提示：\n（点击确定以继续...）\n＿＿＿\n' + tip);
                        if (confirmed) {
                            addLog('已阅读。', 'info');
                            doRedirect();
                        } else {
                            addLog('取消跳转。', 'error');
                            waitForProcessing(() => {
                                elements.submitBtn.disabled = false;
                                hideLoading();
                            });
                        }
                    }, 100);
                });
            } else {
                doRedirect();
            }
        })
        .catch(error => {
            addLog('错误：' + (error.message || '读取数据失败'), 'error');
            waitForProcessing(() => {
                elements.submitBtn.disabled = false;
                hideLoading();
            });
        });
}

/**
 * 切换主题
 */
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'dark') {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        addLog('主题→ 浅色.', 'success');
    } else if (currentTheme === 'light') {
        localStorage.setItem('theme', 'system');
        applySystemTheme();
        addLog('主题→ 系统.', 'info');
    } else {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        addLog('主题→ 深色.', 'info');
    }
}

/**
 * 应用系统主题
 */
function applySystemTheme() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

/**
 * 监听系统主题变化
 */
function listenSystemTheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (localStorage.getItem('theme') === 'system') {
            if (event.matches) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }
    });
}

/**
 * 初始化主题
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
    } else {
        // system or undefined
        localStorage.setItem('theme', 'system');
        applySystemTheme();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initTheme();
    listenSystemTheme();
    
    // 绑定主题切换按钮
    if (elements.statusInfo) {
        elements.statusInfo.addEventListener('click', toggleTheme);
    }
    
    // 绑定提交按钮
    elements.submitBtn.addEventListener('click', handleSubmit);
    
    // 处理 URL 参数
    const params = new URLSearchParams(window.location.search);
    const vParam = params.get('v');
    
    if (vParam) {
        if (vParam.startsWith('-')) {
            const value = vParam.substring(1);
            if (value.trim() === '') {
                elements.input.value = '';
                startProcessing();
                addLog('关键词为空。');
            } else {
                elements.input.value = value;
                startProcessing();
                addLog('自动填充：' + value + ' 的 URL。');
                elements.submitBtn.disabled = true;
                showLoading();
                setTimeout(() => {
                    processKeyword(value);
                }, 500);
            }
        } else {
            elements.input.value = vParam;
            startProcessing();
            addLog('自动填充：' + vParam);
            addLog('本次将自动执行...');
        }
    } else {
        elements.input.value = '';
        startProcessing();
        addLog('关键词为空。');
    }
});
