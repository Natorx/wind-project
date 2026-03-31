// 侧边栏项目类型
interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
}

export const sidebarItems: SidebarItem[] = [
{ id: 'dashboard', label: '仪表盘', icon: '📊' },
{ id: 'projects', label: '项目', icon: '📁' },
{ id: 'analytics', label: '分析', icon: '📈' },
{ id: 'api-test', label: 'API 测试', icon: '🔧' },
{ id: 'settings', label: '设置', icon: '⚙️' },
{ id: 'help', label: '帮助', icon: '❓' },
{ id: 'conversion', label: '文件格式转换', icon: '🔄' },
{ id: 'chatbox', label: 'Chatbox Mini', icon: '💬' },
{ id: 'web-scraper', label: '网页解构', icon: '🕸️' },
{ id: 'encryption', label: '加密算法', icon: '🔐' },
{ id: 'cli', label: '命令行调用', icon: '⌨️' },
{ id: 'debug', label: '调试环境配置', icon: '🐛' },
{ id: 'docs', label: '层级结构文档', icon: '📄' },
{ id: 'editor', label: 'Mini代码编辑器', icon: '📝' },
{ id: 'hardware', label: '硬件配置读取', icon: '💻' },
{ id: 'file-explorer', label: '路径镜像', icon: '📂' },
{ id: 'network-devices', label: '网络设备调用', icon: '🌐' },
{ id: 'process-manager', label: '进程调度查看', icon: '📊' },
{ id: 'music-player', label: '音乐播放器', icon: '🎵' },
{ id: 'remote-desktop', label: '桌面远程控制', icon: '🖥️' },
{ id: 'app-launcher', label: '应用管理启动', icon: '🚀' },
{ id: 'email', label: '基础邮件收发', icon: '📧' },
{ id: 'qr-code', label: '二维码生成调用', icon: '📱' },
{ id: 'typing-practice', label: '英语打字练习', icon: '⌨️' },
{ id: 'file-sharing', label: '文件共享', icon: '📤' },
{ id: 'multi-device-login', label: '多设备登录', icon: '🔑' },
{ id: 'plugins', label: '插件扩展', icon: '🧩' }
];