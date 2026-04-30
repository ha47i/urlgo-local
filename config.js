// ============================================
// URL Go - 配置文件
// ============================================

const config = {
    // 数据文件路径
    data_file: '_data.txt',
    
    // true: 新标签页打开，false: 当前页跳转
    open_newtab: true,
    
    // 是否区分大小写
    case_sensitive: false,
    
    // 是否启用特殊情况处理（如 BV 号）
    enable_exceptional_case: true,
    
    // 特殊情况的正则表达式模式
    exceptionalPatterns: [
        /^BV[1-9A-Za-z]{10}$/,  // B 站 BV 号
        // 可以继续添加其他特殊模式
    ]
};
