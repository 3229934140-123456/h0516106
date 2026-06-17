import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Download, Share2, CheckCircle, XCircle, Stamp, Eye, Edit3, FileText, History, User, Clock } from 'lucide-react';
import { useLabStore } from '@/store/useLabStore';
import { useToast } from '@/components/common/Toast';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime } from '@/utils/dateFormat';
import { generateReportPDF, generateReportContent } from '@/utils/pdfGenerator';
import type { Report, ReportHistory } from '@/types';

const ACTION_LABELS: Record<ReportHistory['action'], string> = {
  save: '保存报告',
  edit: '编辑报告',
  submit: '提交审核',
  reject: '驳回报告',
  approve: '审核通过',
  seal: '加盖电子章',
};

const ACTION_COLORS: Record<ReportHistory['action'], string> = {
  save: 'bg-neutral-100 text-neutral-600',
  edit: 'bg-primary-100 text-primary-600',
  submit: 'bg-primary-100 text-primary-600',
  reject: 'bg-danger-100 text-danger-600',
  approve: 'bg-success-100 text-success-600',
  seal: 'bg-warning-100 text-warning-700',
};

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    getReportById,
    updateReport,
    addReportHistory,
    getSampleById,
    getExperimentById,
    getStepsByExperimentId,
    getTemplateById,
    currentUser,
    updateSampleStage,
  } = useLabStore();

  const [report, setReport] = useState<Report | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    if (id) {
      const r = getReportById(id);
      if (r) {
        setReport(r);
        setEditedContent(r.content);
        setEditedTitle(r.title);
      }
    }
  }, [id, getReportById]);

  if (!report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-neutral-500">
          <FileText size={48} className="mx-auto mb-4 text-neutral-300" />
          <p>报告不存在</p>
        </div>
      </div>
    );
  }

  const sample = getSampleById(report.sampleId);
  const experiment = getExperimentById(report.experimentId);
  const steps = experiment ? getStepsByExperimentId(experiment.id) : [];
  const template = experiment ? getTemplateById(experiment.templateId) : null;

  const refreshReport = () => {
    if (id) {
      const r = getReportById(id);
      if (r) setReport(r);
    }
  };

  const handleSave = () => {
    if (!id || !currentUser) return;
    updateReport(id, {
      title: editedTitle,
      content: editedContent,
    });
    addReportHistory(id, 'save', currentUser.realName);
    refreshReport();
    setIsEditing(false);
    showToast('报告已保存', 'success');
  };

  const handleStartEdit = () => {
    if (!id || !currentUser) return;
    addReportHistory(id, 'edit', currentUser.realName);
    setIsEditing(true);
  };

  const handleRegenerate = () => {
    if (!sample || !experiment) return;
    const newContent = generateReportContent(sample, experiment, steps, report.hasElectronicSeal);
    setEditedContent(newContent);
    showToast('报告内容已重新生成', 'success');
  };

  const handleSubmitReview = () => {
    if (!id || !currentUser) return;
    updateReport(id, { status: 'reviewing', title: editedTitle, content: editedContent });
    addReportHistory(id, 'submit', currentUser.realName);
    refreshReport();
    showToast('报告已提交审核', 'success');
  };

  const handleApprove = () => {
    if (!id || !currentUser) return;
    const now = new Date().toISOString();
    updateReport(id, {
      status: 'approved',
      approvedBy: currentUser.realName,
      approvedAt: now,
    });
    addReportHistory(id, 'approve', currentUser.realName);
    refreshReport();

    if (sample) {
      updateSampleStage(sample.id, 'review', currentUser.realName, '报告已审核通过');
    }

    showToast('报告已通过审核', 'success');
  };

  const handleConfirmReject = () => {
    if (!id || !currentUser) return;
    if (!rejectReason.trim()) {
      showToast('请填写驳回原因', 'warning');
      return;
    }
    updateReport(id, { status: 'rejected' });
    addReportHistory(id, 'reject', currentUser.realName, rejectReason.trim());
    refreshReport();
    setShowRejectModal(false);
    setRejectReason('');
    showToast('报告已驳回', 'error');
  };

  const handleStamp = () => {
    if (!id || !currentUser || !sample || !experiment) return;
    const newContent = generateReportContent(sample, experiment, steps, true);
    updateReport(id, { hasElectronicSeal: true, content: newContent });
    addReportHistory(id, 'seal', currentUser.realName);
    setEditedContent(newContent);
    refreshReport();
    showToast('电子章已加盖', 'success');
  };

  const handleDownloadPDF = async () => {
    try {
      if (!sample || !experiment) {
        showToast('无法找到关联样品或实验信息', 'error');
        return;
      }

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editedContent;
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
      a.download = `${editedTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('PDF已下载', 'success');
    } catch (err) {
      console.error('PDF generation failed:', err);
      showToast('PDF生成失败，请重试', 'error');
    }
  };

  const handleShare = async () => {
    if (!report.hasElectronicSeal) {
      showToast('请先盖章后再分享报告', 'error');
      return;
    }

    const shareUrl = `${window.location.origin}/reports/${report.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(`分享链接已复制到剪贴板：${shareUrl}`, 'success');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(`分享链接已复制到剪贴板：${shareUrl}`, 'success');
    }
  };

  const canEdit = (report.status === 'draft' || report.status === 'rejected') && !report.hasElectronicSeal;
  const canSubmitReview = (report.status === 'draft' || report.status === 'rejected') && !report.hasElectronicSeal;
  const canApprove = report.status === 'reviewing' && currentUser?.role === 'manager';
  const canStamp = report.status === 'approved' && !report.hasElectronicSeal;

  const sortedHistory = [...(report.history || [])].sort(
    (a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-2xl font-bold text-neutral-800 bg-transparent border-b-2 border-primary-500 focus:outline-none w-96"
                />
              ) : (
                report.title
              )}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <StatusBadge status={report.status} type="report" />
              {report.hasElectronicSeal && (
                <span className="px-2 py-0.5 bg-success-50 text-success-700 text-xs rounded-full flex items-center space-x-1">
                  <Stamp size={12} />
                  <span>已盖章</span>
                </span>
              )}
              <span className="text-sm text-neutral-500">
                创建于 {formatDateTime(report.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedTitle(report.title);
                  setEditedContent(report.content);
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2"
              >
                <Save size={16} />
                <span>保存</span>
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button
                  onClick={handleStartEdit}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium flex items-center space-x-2"
                >
                  <Edit3 size={16} />
                  <span>编辑</span>
                </button>
              )}
              {canEdit && (
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium flex items-center space-x-2"
                >
                  <FileText size={16} />
                  <span>重新生成</span>
                </button>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                  showPreview
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Eye size={16} />
                <span>{showPreview ? '隐藏预览' : '预览'}</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium flex items-center space-x-2"
              >
                <Download size={16} />
                <span>下载PDF</span>
              </button>
              {canSubmitReview && (
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
                >
                  <CheckCircle size={16} />
                  <span>提交审核</span>
                </button>
              )}
              {canApprove && (
                <>
                  <button
                    onClick={() => { setShowRejectModal(true); setRejectReason(''); }}
                    className="px-4 py-2 border border-danger-300 text-danger-600 rounded-lg hover:bg-danger-50 transition-colors font-medium flex items-center space-x-2"
                  >
                    <XCircle size={16} />
                    <span>驳回</span>
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-success-500/20"
                  >
                    <CheckCircle size={16} />
                    <span>通过审核</span>
                  </button>
                </>
              )}
              {canStamp && (
                <button
                  onClick={handleStamp}
                  className="px-4 py-2 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-danger-500/20"
                >
                  <Stamp size={16} />
                  <span>盖电子章</span>
                </button>
              )}
              <button
                onClick={handleShare}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                  report.hasElectronicSeal
                    ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20'
                    : 'border border-neutral-300 text-neutral-400 hover:bg-neutral-50 cursor-not-allowed'
                }`}
                title={report.hasElectronicSeal ? '复制分享链接' : '请先盖章后再分享'}
              >
                <Share2 size={16} />
                <span>分享</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h3 className="font-semibold text-neutral-800 mb-4">关联信息</h3>
            {sample && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">样品名称</span>
                  <span className="text-neutral-800 font-medium">{sample.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">追踪编号</span>
                  <span className="text-primary-600 font-mono font-medium">{sample.trackingNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">委托方</span>
                  <span className="text-neutral-800">{sample.client}</span>
                </div>
                <button
                  onClick={() => navigate(`/samples/${sample.id}`)}
                  className="w-full mt-2 px-3 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
                >
                  查看样品详情
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h3 className="font-semibold text-neutral-800 mb-4">报告信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">创建人</span>
                <span className="text-neutral-800">{report.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">审核人</span>
                <span className="text-neutral-800">{report.approvedBy || '-'}</span>
              </div>
              {report.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">审核时间</span>
                  <span className="text-neutral-800">{formatDateTime(report.approvedAt)}</span>
                </div>
              )}
              {experiment && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">检测人员</span>
                  <span className="text-neutral-800">{experiment.operator}</span>
                </div>
              )}
            </div>
          </div>

          {template && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <h3 className="font-semibold text-neutral-800 mb-4">使用模板</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">模板名称</span>
                  <span className="text-neutral-800">{template.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">步骤数</span>
                  <span className="text-neutral-800">{template.steps.length} 步</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between font-semibold text-neutral-800"
            >
              <span className="flex items-center space-x-2">
                <History size={16} className="text-primary-500" />
                <span>审核历史</span>
                <span className="text-xs text-neutral-400 font-normal">({sortedHistory.length})</span>
              </span>
              <span className="text-xs text-neutral-400">{showHistory ? '收起' : '展开'}</span>
            </button>
            {showHistory && (
              <div className="mt-4 space-y-4">
                {sortedHistory.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-4">暂无操作记录</p>
                ) : (
                  sortedHistory.map((h) => (
                    <div key={h.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ACTION_COLORS[h.action]}`}>
                        <Clock size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-neutral-800">{ACTION_LABELS[h.action]}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5 text-xs text-neutral-500">
                          <User size={10} />
                          <span>{h.operator}</span>
                          <span>·</span>
                          <span>{formatDateTime(h.operatedAt)}</span>
                        </div>
                        {h.remark && (
                          <div className="mt-2 p-2.5 bg-neutral-50 rounded-lg text-xs text-neutral-600 border border-neutral-100">
                            {h.action === 'reject' ? '驳回原因：' : '备注：'}{h.remark}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {showPreview ? (
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                <h3 className="font-semibold text-neutral-800">报告预览</h3>
              </div>
              <div
                className="p-6 max-h-[800px] overflow-auto bg-neutral-50"
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-800">报告内容</h3>
                {isEditing && (
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    编辑模式 - 支持HTML格式
                  </span>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[700px] p-4 font-mono text-sm focus:outline-none resize-none"
                  placeholder="输入报告内容，支持HTML格式..."
                />
              ) : (
                <div
                  className="p-6 max-h-[800px] overflow-auto"
                  dangerouslySetInnerHTML={{ __html: editedContent }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2 flex items-center space-x-2">
              <XCircle size={20} className="text-danger-500" />
              <span>驳回报告</span>
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              请填写驳回原因，以便创建人了解需要修改的内容。
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  驳回原因 <span className="text-danger-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="请详细描述驳回原因..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-transparent transition-all resize-none"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                  className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 px-4 py-2.5 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors font-medium flex items-center justify-center space-x-2 shadow-lg shadow-danger-500/20"
                >
                  <XCircle size={16} />
                  <span>确认驳回</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;
