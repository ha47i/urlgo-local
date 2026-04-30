// ============================================
// URL Go - 旧版配置文件
// ============================================

const config = {
    // 数据文件路径
    data_file: './../_data.txt',
    
    // 是否区分大小写
    case_sensitive: false,
    
    // 是否在新标签页打开 URL
    open_newtab: true,
    
    // 是否启用特殊情况处理（如 BV 号）
    enable_exceptional_case: true,
    
    // 特殊情况的正则表达式模式
    exceptionalPatterns: [
        /^BV[1-9A-Za-z]{10}$/,  // B 站 BV 号
        // 可以继续添加其他特殊模式
    ]
};
