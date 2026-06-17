import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, FileText, Download, Share2, CheckCircle, AlertTriangle } from 'lucide-react';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useLabStore } from '@/store/useLabStore';
import { formatDateTime } from '@/utils/dateFormat';
import { generateReportPDF } from '@/utils/pdfGenerator';
import type { Report } from '@/types';

const ReportList: React.FC = () => {
  const navigate = useNavigate();
  const { reports, samples, getExperimentById, getStepsByExperimentId } = useLabStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getSampleName = useCallback((sampleId: string) => {
    return samples.find(s => s.id === sampleId)?.name || '未知样品';
  }, [samples]);

  const getTrackingNo = useCallback((sampleId: string) => {
    return samples.find(s => s.id === sampleId)?.trackingNo || '-';
  }, [samples]);

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          getSampleName(r.sampleId).toLowerCase().includes(search) ||
          getTrackingNo(r.sampleId).toLowerCase().includes(search) ||
          r.createdBy.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortKey as keyof Report] as string;
      const bVal = b[sortKey as keyof Report] as string;
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [reports, searchText, statusFilter, sortKey, sortOrder, getSampleName, getTrackingNo]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleDownloadPDF = async (report: Report) => {
    try {
      const sample = samples.find(s => s.id === report.sampleId);
      const experiment = getExperimentById(report.experimentId);
      const steps = getStepsByExperimentId(report.experimentId);

      if (!sample || !experiment) {
        alert('无法找到相关样品或实验信息');
        return;
      }

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = report.content;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.background = '#ffffff';
      document.body.appendChild(tempDiv);

      const blob = await generateReportPDF(tempDiv, report, sample, experiment, steps);
      document.body.removeChild(tempDiv);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF生成失败，请重试');
    }
  };

  const handleShare = async (report: Report) => {
    if (!report.hasElectronicSeal) {
      alert('请先盖章后再分享报告');
      return;
    }

    const shareUrl = `${window.location.origin}/reports/${report.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(`分享链接已复制到剪贴板：\n${shareUrl}`);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`分享链接已复制到剪贴板：\n${shareUrl}`);
    }
  };

  const columns: Column<Report>[] = [
    {
      key: 'title',
      header: '报告名称',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <FileText size={18} className={`${row.hasElectronicSeal ? 'text-success-500' : 'text-primary-500'}`} />
          <span className="font-medium text-neutral-800">{row.title}</span>
          {row.hasElectronicSeal && (
            <span className="px-1.5 py-0.5 bg-success-50 text-success-700 text-xs rounded flex items-center space-x-1">
              <CheckCircle size={10} />
              <span>已盖章</span>
            </span>
          )}
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
      key: 'createdBy',
      header: '创建人',
      render: (row) => (
        <span className="text-neutral-600">{row.createdBy}</span>
      ),
    },
    {
      key: 'approvedBy',
      header: '审核人',
      render: (row) => (
        <span className="text-neutral-600">{row.approvedBy || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      sortable: true,
      render: (row) => (
        <StatusBadge status={row.status} type="report" size="sm" />
      ),
    },
    {
      key: 'createdAt',
      header: '创建时间',
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
      width: '180px',
      render: (row) => (
        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reports/${row.id}`);
            }}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="查看编辑"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadPDF(row);
            }}
            className="p-2 text-neutral-400 hover:text-success-500 hover:bg-success-50 rounded-lg transition-colors"
            title="下载PDF"
          >
            <Download size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare(row);
            }}
            className={`p-2 rounded-lg transition-colors ${
              row.hasElectronicSeal
                ? 'text-neutral-400 hover:text-primary-500 hover:bg-primary-50'
                : 'text-neutral-300 cursor-not-allowed'
            }`}
            title="分享报告"
          >
            <Share2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">报告管理</h1>
          <p className="text-neutral-500 mt-1">管理所有实验报告，生成PDF并分享给委托方</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">草稿</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">
                {reports.filter(r => r.status === 'draft').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-warning-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">审核中</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">
                {reports.filter(r => r.status === 'reviewing').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-primary-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">已通过</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">
                {reports.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-success-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">已盖章</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">
                {reports.filter(r => r.hasElectronicSeal).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-primary-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索报告名称、样品、创建人..."
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
                <option value="reviewing">审核中</option>
                <option value="approved">已通过</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <DataTable<Report>
        columns={columns}
        data={filteredReports}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(row) => navigate(`/reports/${row.id}`)}
        emptyText="暂无报告数据"
      />
    </div>
  );
};

export default ReportList;
