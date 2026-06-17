import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FlaskConical,
  ArrowRightLeft,
  FileText,
  BookTemplate,
  FileBarChart,
  AlertTriangle,
  ScanLine,
} from 'lucide-react';

const menuItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/samples', label: '样品管理', icon: FlaskConical },
  { path: '/flow', label: '流转操作', icon: ArrowRightLeft },
  { path: '/experiments', label: '实验记录', icon: FileText },
  { path: '/templates', label: '流程模板', icon: BookTemplate },
  { path: '/reports', label: '报告管理', icon: FileBarChart },
  { path: '/abnormal', label: '异常中心', icon: AlertTriangle },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-neutral-700 text-white transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-neutral-600 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ScanLine size={20} />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg whitespace-nowrap">实验室追踪</span>
          )}
        </div>
      </div>

      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'text-neutral-300 hover:bg-neutral-600 hover:text-white'
              )}
            >
              <Icon
                size={20}
                className={cn(
                  'flex-shrink-0 transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />
              {!collapsed && (
                <span className="ml-3 whitespace-nowrap">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {collapsed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-neutral-600 hover:bg-neutral-500 transition-colors"
          >
            <span className="text-neutral-300">→</span>
          </button>
        </div>
      )}
    </aside>
  );
};
