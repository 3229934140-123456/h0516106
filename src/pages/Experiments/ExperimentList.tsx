import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Play, CheckCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useLabStore } from '@/store/useLabStore';
import { formatDateTime } from '@/utils/dateFormat';
import type { Experiment } from '@/types';

const ExperimentList: React.FC = () => {
  const navigate = useNavigate();
  const { experiments, samples, templates } = useLabStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('startedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getSampleName = useCallback((sampleId: string) => {
    return samples.find(s => s.id === sampleId)?.name || '未知样品';
  }, [samples]);

  const getTemplateName = useCallback((templateId: string) => {
    return templates.find(t => t.id === templateId)?.name || '未知模板';
  }, [templates]);

  const getTrackingNo = useCallback((sampleId: string) => {
    return samples.find(s => s.id === sampleId)?.trackingNo || '-';
  }, [samples]);

  const filteredExperiments = useMemo(() => {
    let result = [...experiments];

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          getSampleName(e.sampleId).toLowerCase().includes(search) ||
          getTrackingNo(e.sampleId).toLowerCase().includes(search) ||
          e.operator.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortKey as keyof Experiment] as string;
      const bVal = b[sortKey as keyof Experiment] as string;
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [experiments, searchText, statusFilter, sortKey, sortOrder, getSampleName, getTrackingNo]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Filter size={16} className="text-neutral-500" />;
      case 'in_progress':
        return <Play size={16} className="text-primary-500" />;
      case 'completed':
        return <CheckCircle size={16} className="text-success-500" />;
      default:
        return null;
    }
  };

  const columns: Column<Experiment>[] = [
    {
      key: 'title',
      header: '实验名称',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status)}
          <span className="font-medium text-neutral-800">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'sampleId',
      header: '关联样品',
      render: (row) => (
        <div>
          <div className="font-medium text-neutral-800">{getSampleName(row.sampleId)}</div>
          <div className="text-xs text-neutral-500 font-mono">{getTrackingNo(row.sampleId)}</div>
        </div>
      ),
    },
    {
      key: 'templateId',
      header: '使用模板',
      render: (row) => (
        <span className="text-neutral-600">{getTemplateName(row.templateId)}</span>
      ),
    },
    {
      key: 'operator',
      header: '操作人员',
      render: (row) => (
        <span className="text-neutral-600">{row.operator}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      sortable: true,
      render: (row) => (
        <StatusBadge status={row.status} type="experiment" size="sm" />
      ),
    },
    {
      key: 'startedAt',
      header: '开始时间',
      sortable: true,
      render: (row) => (
        <span className="text-neutral-500 text-sm">
          {formatDateTime(row.startedAt)}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: '完成时间',
      render: (row) => (
        <span className="text-neutral-500 text-sm">
          {row.completedAt ? formatDateTime(row.completedAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      align: 'center',
      width: '100px',
      render: (row) => (
        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/experiments/${row.id}`);
            }}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">实验记录</h1>
          <p className="text-neutral-500 mt-1">管理所有实验记录和操作数据</p>
        </div>
        <button
          onClick={() => navigate('/experiments/new')}
          className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
        >
          <Plus size={18} />
          <span>新建实验</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索实验名称、样品、操作人员..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">全部状态</option>
                <option value="draft">草稿</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <DataTable<Experiment>
        columns={columns}
        data={filteredExperiments}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(row) => navigate(`/experiments/${row.id}`)}
        emptyText="暂无实验记录"
      />
    </div>
  );
};

export default ExperimentList;
