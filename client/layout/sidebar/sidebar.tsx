import { useActiveItem } from '../../context/activeItemContext'; // 新增
import { sidebarItems } from './fc_sidebar';
const Sidebar: React.FC = () => {
    const { activeItem, setActiveItem } = useActiveItem();
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="logo text-cyan">Wind Project</h2>
        <p className="logo-subtitle">简约管理平台</p>
      </div>

      <nav className="sidebar-nav overflow-y-scroll">
        <ul>
          {sidebarItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-btn ${activeItem === item.id ? 'active' : ''}`}
                onClick={() => setActiveItem(item.id)}
              >
                {item.icon && <span className="nav-icon">{item.icon}</span>}
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <p className="user-name">Natorx</p>
            <p className="user-status">在线</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;