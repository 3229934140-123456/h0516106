import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, Eye, QrCode } from 'lucide-react';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QRCodePrint } from '@/components/common/QRCodePrint';
import { useLabStore } from '@/store/useLabStore';
import { formatDateTime } from '@/utils/dateFormat';
import type { Sample } from '@/types';
import { STAGES } from '@/types';

const SampleList: React.FC = () => {
  const navigate = useNavigate();
  const { samples } = useLabStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [printSample, setPrintSample] = useState<Sample | null>(null);

  const filteredSamples = useMemo(() => {
    let result = [...samples];

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.trackingNo.toLowerCase().includes(search) ||
          s.client.toLowerCase().includes(search) ||
          s.source.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortKey as keyof Sample] as string;
      const bVal = b[sortKey as keyof Sample] as string;
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [samples, searchText, statusFilter, sortKey, sortOrder]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const getCurrentStageLabel = (stage: string) => {
    return STAGES.find(s => s.key === stage)?.label || stage;
  };

  const columns: Column<Sample>[] = [
    {
      key: 'trackingNo',
      header: '追踪编号',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm text-primary-600 font-medium">
          {row.trackingNo}
        </span>
      ),
    },
    {
      key: 'name',
      header: '样品名称',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-neutral-800">{row.name}</span>
      ),
    },
    {
      key: 'type',
      header: '样品类型',
      render: (row) => (
        <span className="text-neutral-600">{row.type}</span>
      ),
    },
    {
      key: 'source',
      header: '来源',
      render: (row) => (
        <span className="text-neutral-600">{row.source}</span>
      ),
    },
    {
      key: 'client',
      header: '委托方',
      render: (row) => (
        <span className="text-neutral-600">{row.client}</span>
      ),
    },
    {
      key: 'currentStage',
      header: '当前环节',
      render: (row) => (
        <span className="text-neutral-600">{getCurrentStageLabel(row.currentStage)}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      sortable: true,
      render: (row) => (
        <StatusBadge status={row.status} type="sample" size="sm" />
      ),
    },
    {
      key: 'createdAt',
      header: '录入时间',
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
      width: '140px',
      render: (row) => (
        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/samples/${row.id}`);
            }}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPrintSample(row);
            }}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="打印标签"
          >
            <QrCode size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">样品管理</h1>
          <p className="text-neutral-500 mt-1">管理所有实验室样品信息和流转状态</p>
        </div>
        <button
          onClick={() => navigate('/samples/new')}
          className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
        >
          <Plus size={18} />
          <span>录入样品</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索追踪号、名称、委托方..."
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
                <option value="pending">待检测</option>
                <option value="testing">检测中</option>
                <option value="completed">已完成</option>
                <option value="abnormal">异常</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>

          <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium flex items-center space-x-2">
            <Download size={16} />
            <span>导出</span>
          </button>
        </div>
      </div>

      <DataTable<Sample>
        columns={columns}
        data={filteredSamples}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(row) => navigate(`/samples/${row.id}`)}
        rowClassName={(row) => row.status === 'abnormal' ? 'bg-danger-50/30' : ''}
        emptyText="暂无样品数据"
      />

      {printSample && (
        <QRCodePrint
          trackingNo={printSample.trackingNo}
          sampleName={printSample.name}
          onClose={() => setPrintSample(null)}
        />
      )}
    </div>
  );
};

export default SampleList;
