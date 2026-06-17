import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, QrCode, Printer, X } from 'lucide-react';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QRCodePrint } from '@/components/common/QRCodePrint';
import { useLabStore } from '@/store/useLabStore';
import { formatDateTime } from '@/utils/dateFormat';
import { useToast } from '@/components/common/Toast';
import type { Sample } from '@/types';
import { STAGES } from '@/types';

const SampleList: React.FC = () => {
  const navigate = useNavigate();
  const { samples } = useLabStore();
  const { showToast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [printSample, setPrintSample] = useState<Sample | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchPrint, setShowBatchPrint] = useState(false);
  const batchPrintRef = React.useRef<HTMLDivElement>(null);

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

  const handleBatchPrint = () => {
    if (selectedIds.size === 0) {
      showToast('请先选择要打印的样品', 'warning');
      return;
    }
    setShowBatchPrint(true);
  };

  const doBatchPrint = () => {
    const printContent = batchPrintRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('请允许弹出窗口以进行打印', 'error');
      return;
    }

    const selectedSamples = filteredSamples.filter(s => selectedIds.has(s.id));

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>批量样品标签</title>
          <style>
            @page { size: 60mm 40mm; margin: 2mm; }
            body { font-family: 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; }
            .label { width: 56mm; height: 36mm; padding: 2mm; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; page-break-after: always; }
            .tracking-no { font-size: 12px; font-weight: bold; margin-bottom: 2mm; }
            .qr-container { margin-bottom: 2mm; display: flex; justify-content: center; }
            .qr-container img { width: 25mm; height: 25mm; }
            .sample-name { font-size: 10px; text-align: center; max-width: 100%; overflow: hidden; }
            .date { font-size: 8px; color: #666; margin-top: 1mm; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    const successCount = selectedSamples.length;
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      showToast(`批量打印完成：成功 ${successCount} 个，失败 0 个`, 'success');
      setShowBatchPrint(false);
      setSelectedIds(new Set());
    }, 500);
  };

  const selectedSamples = filteredSamples.filter(s => selectedIds.has(s.id));

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

          <div className="flex items-center space-x-3">
            {selectedIds.size > 0 ? (
              <>
                <span className="text-sm text-neutral-600">
                  已选择 <span className="font-semibold text-primary-600">{selectedIds.size}</span> 项
                </span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors flex items-center space-x-1"
                >
                  <X size={14} />
                  <span>取消选择</span>
                </button>
                <button
                  onClick={handleBatchPrint}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
                >
                  <Printer size={16} />
                  <span>批量打印标签</span>
                </button>
              </>
            ) : null}
          </div>
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
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {printSample && (
        <QRCodePrint
          trackingNo={printSample.trackingNo}
          sampleName={printSample.name}
          onClose={() => setPrintSample(null)}
        />
      )}

      {showBatchPrint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto animate-slide-in-right">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">
                批量打印标签预览（共 {selectedSamples.length} 个样品）
              </h3>
              <button
                onClick={() => setShowBatchPrint(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-neutral-400" />
              </button>
            </div>
            <div className="mb-4 text-sm text-neutral-500">
              确认以下标签内容正确后，点击"打印全部"按钮。
            </div>
            <div
              ref={batchPrintRef}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
            >
              {selectedSamples.map((s) => (
                <div
                  key={s.id}
                  className="label border-2 border-dashed border-neutral-300 rounded-lg p-4 w-[220px] h-[160px] flex flex-col items-center justify-center bg-white mx-auto"
                >
                  <div className="tracking-no text-sm font-bold text-neutral-800 mb-2">
                    {s.trackingNo}
                  </div>
                  <div className="qr-container mb-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(s.trackingNo)}`}
                      alt="QR"
                      width={80}
                      height={80}
                    />
                  </div>
                  <div className="sample-name text-xs text-neutral-700 text-center max-w-full overflow-hidden">
                    {s.name}
                  </div>
                  <div className="date text-[10px] text-neutral-400 mt-1">
                    {new Date().toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowBatchPrint(false)}
                className="px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={doBatchPrint}
                className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
              >
                <Printer size={18} />
                <span>打印全部</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleList;
