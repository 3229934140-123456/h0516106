import React, { useState } from 'react';
import {
  Bell,
  Search,
  Menu,
  User,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabStore } from '@/store/useLabStore';
import { formatRelativeTime } from '@/utils/dateFormat';
import type { Notification, AbnormalResult } from '@/types';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarCollapsed }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { notifications, abnormalResults, currentUser, markNotificationRead } = useLabStore();

  const unreadCount = notifications.filter(n => n.status === 'sent').length;

  const getAbnormalByNotifId = (notifId: string): AbnormalResult | undefined => {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return undefined;
    return abnormalResults.find(a => a.id === notif.abnormalResultId);
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white border-b border-neutral-200 z-30 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-60'
      )}
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <Menu size={20} className="text-neutral-600" />
          </button>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索样品追踪号、名称..."
              className="w-80 pl-10 pr-4 py-2 bg-neutral-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className={cn(
                'relative p-2 rounded-lg hover:bg-neutral-100 transition-colors',
                unreadCount > 0 && 'animate-pulse'
              )}
            >
              <Bell size={20} className="text-neutral-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-fade-in z-50">
                <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-800">异常通知</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-neutral-100 rounded"
                  >
                    <X size={16} className="text-neutral-400" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                      暂无通知
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif: Notification) => {
                      const abnormal = getAbnormalByNotifId(notif.id);
                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            'p-4 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors',
                            notif.status === 'sent' && 'bg-primary-50/50'
                          )}
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                              abnormal?.severity === 'critical' ? 'bg-danger-100' :
                              abnormal?.severity === 'high' ? 'bg-danger-50' :
                              'bg-warning-50'
                            )}>
                              <span className="text-sm">⚠️</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-neutral-800 line-clamp-2">
                                {notif.content}
                              </p>
                              <p className="text-xs text-neutral-400 mt-1">
                                {formatRelativeTime(notif.sentAt)}
                              </p>
                            </div>
                            {notif.status === 'sent' && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-neutral-800">
                  {currentUser?.realName || '用户'}
                </p>
                <p className="text-xs text-neutral-500">
                  {currentUser?.role === 'admin' ? '管理员' :
                   currentUser?.role === 'operator' ? '实验员' :
                   currentUser?.role === 'manager' ? '项目经理' : '客户'}
                </p>
              </div>
              <ChevronDown size={16} className="text-neutral-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-fade-in z-50">
                <div className="p-2">
                  <button className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">
                    个人设置
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">
                    修改密码
                  </button>
                  <div className="my-1 border-t border-neutral-200" />
                  <button className="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 rounded-lg transition-colors">
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
