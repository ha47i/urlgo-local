// 全局配置
const data_file = './../_data.txt'; // 数据文件路径
const case_sensitive = false; // 是否区分大小写
const open_newtab = true; // 是否在新标签页打开URL
const enable_exceptional_case = true; // 否启用特殊情况处理

// 特殊情况的正则表达式（可以在这里添加更多）
const exceptionalPatterns = [
    /^BV[1-9A-Za-z]{10}$/,  // B站BV号
    // 可以继续添加其他特殊模式
];
