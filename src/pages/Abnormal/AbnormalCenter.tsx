import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, Filter, Search, Eye, Bell, User, RotateCcw } from 'lucide-react';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useLabStore } from '@/store/useLabStore';
import { formatDateTime } from '@/utils/dateFormat';
import { useToast } from '@/components/common/Toast';
import type { AbnormalResult } from '@/types';

const AbnormalCenter: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { abnormalResults, samples, currentUser, handleAbnormalResult, notifications, markNotificationRead } = useLabStore();
  const [searchText, setSearchText] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [handledRemark, setHandledRemark] = useState('');

  const getSampleName = useCallback((sampleId: string) => {
    return samples.find(s => s.id === sampleId)?.name || '未知样品';
  }, [samples]);

  const getTrackingNo = useCallback((sampleId: string) => {
    return samples.find(s => s.id === sampleId)?.trackingNo || '-';
  }, [samples]);

  const filteredAbnormals = useMemo(() => {
    let result = [...abnormalResults];

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (a) =>
          a.description.toLowerCase().includes(search) ||
          getSampleName(a.sampleId).toLowerCase().includes(search) ||
          getTrackingNo(a.sampleId).toLowerCase().includes(search)
      );
    }

    if (severityFilter !== 'all') {
      result = result.filter((a) => a.severity === severityFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'handled') {
        result = result.filter((a) => a.handled);
      } else if (statusFilter === 'resolved') {
        result = result.filter((a) => a.resolved);
      } else {
        result = result.filter((a) => !a.handled && !a.resolved);
      }
    }

    result.sort((a, b) => {
      const aVal = a[sortKey as keyof AbnormalResult] as string;
      const bVal = b[sortKey as keyof AbnormalResult] as string;
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [abnormalResults, searchText, severityFilter, statusFilter, sortKey, sortOrder, getSampleName, getTrackingNo]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleConfirmMark = () => {
    if (!handlingId || !currentUser) {
      showToast('请先登录', 'error');
      return;
    }
    if (!handledRemark.trim()) {
      showToast('请填写处理说明', 'warning');
      return;
    }
    handleAbnormalResult(handlingId, currentUser.realName, handledRemark.trim());
    showToast('异常处理记录已保存', 'success');
    setHandlingId(null);
    setHandledRemark('');
  };

  const handleViewNotification = (abnormalResultId: string) => {
    const notif = notifications.find(n => n.abnormalResultId === abnormalResultId);
    if (notif && notif.status === 'sent') {
      markNotificationRead(notif.id);
    }
  };

  const stats = useMemo(() => ({
    total: abnormalResults.length,
    unhandled: abnormalResults.filter(a => !a.handled && !a.resolved).length,
    critical: abnormalResults.filter(a => a.severity === 'critical' && !a.handled && !a.resolved).length,
    high: abnormalResults.filter(a => a.severity === 'high' && !a.handled && !a.resolved).length,
    medium: abnormalResults.filter(a => a.severity === 'medium' && !a.handled && !a.resolved).length,
    low: abnormalResults.filter(a => a.severity === 'low' && !a.handled && !a.resolved).length,
    resolved: abnormalResults.filter(a => a.resolved).length,
  }), [abnormalResults]);

  const columns: Column<AbnormalResult>[] = [
    {
      key: 'severity',
      header: '严重程度',
      sortable: true,
      render: (row) => (
        <StatusBadge status={row.severity} type="severity" size="sm" />
      ),
    },
    {
      key: 'description',
      header: '异常描述',
      render: (row) => (
        <div className="max-w-xs">
          <p className="text-neutral-800 text-sm line-clamp-2">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'sampleId',
      header: '关联样品',
      render: (row) => (
        <div>
          <div className="font-medium text-neutral-800 text-sm">{getSampleName(row.sampleId)}</div>
          <div className="text-xs text-neutral-500 font-mono">{getTrackingNo(row.sampleId)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      sortable: true,
      render: (row) => {
        if (row.resolved) {
          return (
            <span className="flex items-center space-x-1 text-neutral-500 text-sm">
              <RotateCcw size={14} />
              <span>已恢复</span>
            </span>
          );
        }
        if (row.handled) {
          return (
            <span className="flex items-center space-x-1 text-success-600 text-sm">
              <CheckCircle size={14} />
              <span>已处理</span>
            </span>
          );
        }
        return (
          <span className="flex items-center space-x-1 text-warning-600 text-sm">
            <Clock size={14} />
            <span>待处理</span>
          </span>
        );
      },
    },
    {
      key: 'handledInfo',
      header: '处理信息',
      render: (row) => (
        <div>
          {row.handled ? (
            <>
              <div className="flex items-center space-x-1 text-sm text-neutral-700">
                <User size={12} />
                <span>{row.handledBy}</span>
              </div>
              {row.handledRemark && (
                <p className="text-xs text-neutral-500 mt-1 line-clamp-1">说明：{row.handledRemark}</p>
              )}
              {row.handledAt && (
                <p className="text-xs text-neutral-400 mt-0.5">{formatDateTime(row.handledAt)}</p>
              )}
            </>
          ) : row.resolved ? (
            <p className="text-xs text-neutral-400">
              结果已恢复正常<br />{row.resolvedAt && formatDateTime(row.resolvedAt)}
            </p>
          ) : (
            <span className="text-xs text-neutral-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: '发现时间',
      sortable: true,
      render: (row) => (
        <span className="text-neutral-500 text-sm">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      align: 'center',
      width: '160px',
      render: (row) => (
        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewNotification(row.id);
              navigate(`/samples/${row.sampleId}`);
            }}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="查看样品"
          >
            <Eye size={16} />
          </button>
          {!row.handled && !row.resolved && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHandlingId(row.id);
                setHandledRemark('');
              }}
              className="p-2 text-neutral-400 hover:text-success-500 hover:bg-success-50 rounded-lg transition-colors"
              title="标记已处理"
            >
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">异常中心</h1>
          <p className="text-neutral-500 mt-1">管理所有异常检测结果，及时处理并通知相关人员</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">异常总数</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-neutral-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">待处理</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{stats.unhandled}</p>
            </div>
            <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-warning-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">紧急</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">{stats.critical}</p>
            </div>
            <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center">
              <Bell size={20} className="text-danger-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">严重</p>
              <p className="text-2xl font-bold text-danger-500 mt-1">{stats.high}</p>
            </div>
            <div className="w-10 h-10 bg-danger-50/50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-danger-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">已恢复</p>
              <p className="text-2xl font-bold text-neutral-500 mt-1">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
              <RotateCcw size={20} className="text-neutral-500" />
            </div>
          </div>
        </div>
      </div>

      {stats.unhandled > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle size={20} className="text-danger-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-danger-800">待处理异常提醒</h4>
            <p className="text-sm text-danger-600 mt-1">
              当前有 {stats.unhandled} 个异常结果待处理
              {stats.critical > 0 && (
                <span className="font-semibold">，其中 {stats.critical} 个为紧急级别，请及时处理！</span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索异常描述、样品名称、追踪号..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-neutral-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">全部级别</option>
                <option value="critical">紧急</option>
                <option value="high">严重</option>
                <option value="medium">中等</option>
                <option value="low">轻微</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">全部状态</option>
                <option value="unhandled">待处理</option>
                <option value="handled">已处理</option>
                <option value="resolved">已恢复</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <DataTable<AbnormalResult>
        columns={columns}
        data={filteredAbnormals}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(row) => {
          handleViewNotification(row.id);
          navigate(`/samples/${row.sampleId}`);
        }}
        rowClassName={(row) => {
          if (row.resolved) return 'bg-neutral-50/50 opacity-70';
          if (!row.handled) {
            if (row.severity === 'critical') return 'bg-danger-50/50';
            if (row.severity === 'high') return 'bg-danger-50/30';
            return 'bg-warning-50/30';
          }
          return '';
        }}
        emptyText="暂无异常数据"
      />

      {handlingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">异常处理记录</h3>
            <p className="text-sm text-neutral-500 mb-4">
              请填写处理说明，记录处理人、处理措施和处理结果等信息。
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  处理说明 <span className="text-danger-500">*</span>
                </label>
                <textarea
                  value={handledRemark}
                  onChange={(e) => setHandledRemark(e.target.value)}
                  rows={4}
                  placeholder="请描述处理措施和结果..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => { setHandlingId(null); setHandledRemark(''); }}
                  className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmMark}
                  className="flex-1 px-4 py-2.5 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium flex items-center justify-center space-x-2 shadow-lg shadow-success-500/20"
                >
                  <CheckCircle size={16} />
                  <span>确认处理</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbnormalCenter;
