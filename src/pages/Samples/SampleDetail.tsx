import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Calendar, User, Building, FileText, QrCode, Edit3, Play, Printer } from 'lucide-react';
import { useLabStore } from '@/store/useLabStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime } from '@/utils/dateFormat';
import { QRCodePrint } from '@/components/common/QRCodePrint';
import { useToast } from '@/components/common/Toast';
import type { FlowLog, Experiment } from '@/types';
import { STAGES } from '@/types';

const SampleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getSampleById, getFlowLogsBySampleId, getExperimentsBySampleId, getReportsBySampleId, templates } = useLabStore();

  const [showPrint, setShowPrint] = React.useState(false);

  const sample = id ? getSampleById(id) : undefined;
  const flowLogs = id ? getFlowLogsBySampleId(id) : [];
  const experiments = id ? getExperimentsBySampleId(id) : [];
  const reports = id ? getReportsBySampleId(id) : [];

  if (!sample) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FlaskConical size={64} className="text-neutral-300 mb-4" />
        <p className="text-neutral-500 mb-4">样品不存在</p>
        <button
          onClick={() => navigate('/samples')}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          返回列表
        </button>
      </div>
    );
  }

  const getCurrentStageIndex = () => {
    return STAGES.findIndex(s => s.key === sample.currentStage);
  };

  const handleStartExperiment = () => {
    if (templates.length === 0) {
      showToast('请先创建实验流程模板', 'warning');
      return;
    }
    navigate('/experiments/new', { state: { sampleId: sample.id, sampleName: sample.name } });
  };

  const getStageIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Package: <span className="text-lg">📦</span>,
      FlaskConical: <span className="text-lg">🧪</span>,
      Microscope: <span className="text-lg">🔬</span>,
      BarChart3: <span className="text-lg">📊</span>,
      FileCheck: <span className="text-lg">✅</span>,
      Archive: <span className="text-lg">📁</span>,
    };
    return icons[iconName] || <span className="text-lg">📋</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/samples')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-600" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-neutral-800">{sample.name}</h1>
              <StatusBadge status={sample.status} type="sample" />
            </div>
            <p className="text-neutral-500 mt-1 font-mono">{sample.trackingNo}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPrint(true)}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium flex items-center space-x-2"
          >
            <QrCode size={16} />
            <span>打印标签</span>
          </button>
          <button
            onClick={handleStartExperiment}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Play size={16} />
            <span>开始实验</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">样品信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FlaskConical size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">样品类型</p>
                  <p className="text-neutral-800 font-medium">{sample.type}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">样品来源</p>
                  <p className="text-neutral-800 font-medium">{sample.source}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">委托方</p>
                  <p className="text-neutral-800 font-medium">{sample.client}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">接收日期</p>
                  <p className="text-neutral-800 font-medium">{sample.receivedDate}</p>
                </div>
              </div>
            </div>
            {sample.description && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-sm text-neutral-500 mb-1">样品描述</p>
                <p className="text-neutral-700">{sample.description}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">流转进度</h2>
            <div className="relative">
              {STAGES.map((stage, index) => {
                const isCurrent = stage.key === sample.currentStage;
                const isPast = index < getCurrentStageIndex();
                const stageFlow = flowLogs.find(l => l.toStage === stage.key);

                return (
                  <div key={stage.key} className="relative pb-8 last:pb-0">
                    {index < STAGES.length - 1 && (
                      <div
                        className={`absolute left-5 top-10 w-0.5 h-full ${
                          isPast ? 'bg-success-500' : 'bg-neutral-200'
                        }`}
                      />
                    )}
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isCurrent
                            ? 'bg-primary-500 text-white ring-4 ring-primary-100 shadow-lg shadow-primary-500/30'
                            : isPast
                            ? 'bg-success-500 text-white'
                            : 'bg-neutral-200 text-neutral-400'
                        }`}
                      >
                        {isPast ? (
                          <span className="text-sm">✓</span>
                        ) : (
                          getStageIcon(stage.icon)
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`font-medium ${
                              isCurrent ? 'text-primary-600' : isPast ? 'text-neutral-800' : 'text-neutral-400'
                            }`}
                          >
                            {stage.label}
                          </h4>
                          {stageFlow && (
                            <span className="text-sm text-neutral-500">
                              {formatDateTime(stageFlow.operatedAt)}
                            </span>
                          )}
                        </div>
                        {stageFlow && (
                          <p className="text-sm text-neutral-500 mt-1">
                            操作人：{stageFlow.operator}
                            {stageFlow.remark && ` · ${stageFlow.remark}`}
                          </p>
                        )}
                        {isCurrent && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-medium rounded-full animate-pulse">
                            当前环节
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-800">流转记录</h2>
              <button
                onClick={() => navigate('/flow', { state: { sampleId: sample.id } })}
                className="text-sm text-primary-500 hover:text-primary-600 flex items-center space-x-1"
              >
                <Edit3 size={14} />
                <span>更新状态</span>
              </button>
            </div>
            {flowLogs.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">暂无流转记录</p>
            ) : (
              <div className="space-y-3">
                {[...flowLogs].reverse().map((log: FlowLog) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-neutral-50"
                  >
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-neutral-800">
                          <span className="text-neutral-500">从</span>{' '}
                          <span className="font-medium">
                            {STAGES.find(s => s.key === log.fromStage)?.label || log.fromStage}
                          </span>{' '}
                          <span className="text-neutral-500">流转到</span>{' '}
                          <span className="font-medium text-primary-600">
                            {STAGES.find(s => s.key === log.toStage)?.label || log.toStage}
                          </span>
                        </p>
                        <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
                          {formatDateTime(log.operatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        操作人：{log.operator}
                        {log.remark && ` · 备注：${log.remark}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">相关实验</h3>
            {experiments.length === 0 ? (
              <p className="text-neutral-500 text-center py-6 text-sm">暂无实验记录</p>
            ) : (
              <div className="space-y-3">
                {experiments.map((exp: Experiment) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-lg border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 cursor-pointer transition-all"
                    onClick={() => navigate(`/experiments/${exp.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-neutral-800 text-sm truncate">{exp.title}</p>
                      <StatusBadge status={exp.status} type="experiment" size="sm" />
                    </div>
                    <p className="text-xs text-neutral-500">
                      操作人：{exp.operator}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formatDateTime(exp.startedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">相关报告</h3>
            {reports.length === 0 ? (
              <p className="text-neutral-500 text-center py-6 text-sm">暂无报告</p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3 rounded-lg border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 cursor-pointer transition-all"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <FileText size={14} className="text-primary-500" />
                        <p className="font-medium text-neutral-800 text-sm truncate">{report.title}</p>
                      </div>
                      <StatusBadge status={report.status} type="report" size="sm" />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formatDateTime(report.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">追溯二维码</h3>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-neutral-300 mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${sample.trackingNo}`}
                  alt="QR Code"
                  className="w-36 h-36"
                />
              </div>
              <p className="text-xs text-neutral-500 text-center">
                扫描二维码查看样品完整信息和流转记录
              </p>
              <button
                onClick={() => setShowPrint(true)}
                className="mt-4 w-full px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Printer size={14} />
                <span>打印标签</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPrint && (
        <QRCodePrint
          trackingNo={sample.trackingNo}
          sampleName={sample.name}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
};

export default SampleDetail;
