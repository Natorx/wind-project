import { JSX } from 'react';
import './styles/main.css';
import { sidebarItems } from './layout/sidebar/fc_sidebar';
import { useActiveItem } from './context/activeItemContext'; // 新增导入
import APITest from './components/APITest';
import Sidebar from './layout/sidebar/sidebar'

function App() {
  const { activeItem } = useActiveItem();

  // 右侧内容映射（添加 API 测试）
  const contentMap: Record<string, JSX.Element> = {
    dashboard: <div className="content-card"><h2>仪表盘</h2><p>这里是您的数据概览...</p></div>,
    projects: <div className="content-card"><h2>项目管理</h2><p>查看和管理您的项目...</p></div>,
    analytics: <div className="content-card"><h2>数据分析</h2><p>查看详细的分析报告...</p></div>,
    'api-test': <APITest />,
    settings: <div className="content-card"><h2>系统设置</h2><p>调整应用设置...</p></div>,
    help: <div className="content-card"><h2>帮助中心</h2><p>获取使用帮助...</p></div>,
  };

  return (
    <div className="app-container">
      {/* 左侧侧边栏 */}
      <Sidebar />

      {/* 右侧主内容区 */}
      <main className="main-content">
        <header className="main-header">
          <h1>{sidebarItems.find(item => item.id === activeItem)?.label}</h1>
          <div className="header-actions">
            <button className="action-btn">🔔</button>
            <button className="action-btn">🔍</button>
          </div>
        </header>

        <div className="content-wrapper">
          {contentMap[activeItem] || <div>内容未找到</div>}
          
          {/* 仪表盘专用统计卡片 */}
          {activeItem === 'dashboard' && (
            <div className="card-grid">
              <div className="stat-card">
                <h3>今日访问</h3>
                <p className="stat-number">1,248</p>
              </div>
              <div className="stat-card">
                <h3>进行中项目</h3>
                <p className="stat-number">7</p>
              </div>
              <div className="stat-card">
                <h3>完成率</h3>
                <p className="stat-number">85%</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
