import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Scan, User, MessageSquare, CheckCircle, Package, FlaskConical, Microscope, BarChart3, FileCheck, Archive } from 'lucide-react';
import { InputWithScan } from '@/components/forms/InputWithScan';
import { useLabStore } from '@/store/useLabStore';
import { useToast } from '@/components/common/Toast';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime } from '@/utils/dateFormat';
import type { ExperimentStage } from '@/types';
import { STAGES } from '@/types';

const FlowPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const {
    getSampleByTrackingNo,
    getSampleById,
    updateSampleStage,
    currentUser,
    getFlowLogsBySampleId,
    users,
  } = useLabStore();

  const [trackingNo, setTrackingNo] = useState('');
  const [selectedStage, setSelectedStage] = useState<ExperimentStage>('preparation');
  const [operator, setOperator] = useState(currentUser?.realName || '');
  const [remark, setRemark] = useState('');
  const [selectedSample, setSelectedSample] = useState<ReturnType<typeof getSampleById> | undefined>(undefined);

  const locationState = location.state as { sampleId?: string } | null;

  useEffect(() => {
    if (locationState?.sampleId) {
      const sample = getSampleById(locationState.sampleId);
      if (sample) {
        setTrackingNo(sample.trackingNo);
        setSelectedSample(sample);
      }
    }
  }, [locationState, getSampleById]);

  const handleScan = (code: string) => {
    const sample = getSampleByTrackingNo(code);
    if (sample) {
      setSelectedSample(sample);
      showToast('样品识别成功', 'success');
    } else {
      showToast('未找到该样品', 'error');
    }
  };

  const handleTrackingNoChange = (value: string) => {
    setTrackingNo(value);
    if (value.length >= 10) {
      const sample = getSampleByTrackingNo(value);
      if (sample) {
        setSelectedSample(sample);
      } else {
        setSelectedSample(undefined);
      }
    } else {
      setSelectedSample(undefined);
    }
  };

  const handleSubmit = () => {
    if (!selectedSample) {
      showToast('请先扫描或输入样品追踪号', 'warning');
      return;
    }
    if (!operator.trim()) {
      showToast('请输入操作人', 'warning');
      return;
    }

    updateSampleStage(selectedSample.id, selectedStage, operator, remark);
    showToast('流转状态更新成功', 'success');

    const updatedSample = getSampleById(selectedSample.id);
    setSelectedSample(updatedSample);

    if (updatedSample?.currentStage === 'completed') {
      setTimeout(() => {
        navigate(`/reports/new?sampleId=${selectedSample.id}`);
      }, 1500);
    }
  };

  const handleNewExperiment = () => {
    if (!selectedSample) return;
    navigate('/experiments/new', {
      state: { sampleId: selectedSample.id, sampleName: selectedSample.name },
    });
  };

  const getStageIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Package: <Package size={20} />,
      FlaskConical: <FlaskConical size={20} />,
      Microscope: <Microscope size={20} />,
      BarChart3: <BarChart3 size={20} />,
      FileCheck: <FileCheck size={20} />,
      Archive: <Archive size={20} />,
    };
    return icons[iconName] || <Package size={20} />;
  };

  const getCurrentStageIndex = () => {
    if (!selectedSample) return -1;
    return STAGES.findIndex(s => s.key === selectedSample.currentStage);
  };

  const flowLogs = selectedSample ? getFlowLogsBySampleId(selectedSample.id) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">流转操作</h1>
          <p className="text-neutral-500 mt-1">扫描样品条码，更新流转状态和负责人</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-6">扫码更新状态</h2>

            <div className="space-y-6">
              <InputWithScan
                label="样品追踪号"
                value={trackingNo}
                onChange={handleTrackingNoChange}
                onScan={handleScan}
                placeholder="扫描或输入样品追踪号，如 LAB-20260617-0001"
                required
              />

              {selectedSample && (
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-neutral-800">{selectedSample.name}</h4>
                      <p className="text-sm text-primary-600 font-mono">{selectedSample.trackingNo}</p>
                    </div>
                    <StatusBadge status={selectedSample.status} type="sample" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-neutral-500">类型：</span>
                      <span className="text-neutral-800">{selectedSample.type}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">来源：</span>
                      <span className="text-neutral-800">{selectedSample.source}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">当前环节：</span>
                      <span className="text-primary-600 font-medium">
                        {STAGES.find(s => s.key === selectedSample.currentStage)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">委托方：</span>
                      <span className="text-neutral-800">{selectedSample.client}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  目标环节 <span className="text-danger-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {STAGES.map((stage, index) => {
                    const isDisabled = selectedSample && index <= getCurrentStageIndex();
                    const isCurrent = selectedSample && stage.key === selectedSample.currentStage;

                    return (
                      <button
                        key={stage.key}
                        type="button"
                        disabled={isDisabled && !isCurrent}
                        onClick={() => setSelectedStage(stage.key)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedStage === stage.key
                            ? 'border-primary-500 bg-primary-50 shadow-md'
                            : isDisabled && !isCurrent
                            ? 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
                            : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              selectedStage === stage.key
                                ? 'bg-primary-500 text-white'
                                : isCurrent
                                ? 'bg-primary-100 text-primary-600'
                                : 'bg-neutral-100 text-neutral-500'
                            }`}
                          >
                            {getStageIcon(stage.icon)}
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                selectedStage === stage.key ? 'text-primary-600' : 'text-neutral-800'
                              }`}
                            >
                              {stage.label}
                            </p>
                            {isCurrent && (
                              <p className="text-xs text-primary-500">当前</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-neutral-700">
                    操作人 <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <select
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white appearance-none"
                    >
                      <option value="">请选择操作人</option>
                      {users.filter(u => u.isActive && u.role !== 'client').map(u => (
                        <option key={u.id} value={u.realName}>
                          {u.realName} ({u.role === 'admin' ? '管理员' : u.role === 'operator' ? '实验员' : u.role === 'manager' ? '项目负责人' : u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-neutral-700">备注</label>
                  <div className="relative">
                    <MessageSquare
                      size={18}
                      className="absolute left-3 top-3 text-neutral-400"
                    />
                    <input
                      type="text"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="可选：填写流转备注信息"
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedSample}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} />
                  <span>确认流转</span>
                </button>
                <button
                  onClick={handleNewExperiment}
                  disabled={!selectedSample}
                  className="px-6 py-3 border border-primary-500 text-primary-500 rounded-xl hover:bg-primary-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  开始实验
                </button>
              </div>
            </div>
          </div>

          {selectedSample && flowLogs.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">流转历史</h3>
              <div className="space-y-3">
                {[...flowLogs].reverse().map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-4 rounded-xl bg-neutral-50"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-medium text-sm">
                        {STAGES.findIndex(s => s.key === log.toStage) + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-neutral-800">
                        <span className="text-neutral-500">从</span>{' '}
                        <span className="font-medium">
                          {STAGES.find(s => s.key === log.fromStage)?.label}
                        </span>{' '}
                        <span className="text-neutral-500">→</span>{' '}
                        <span className="font-medium text-primary-600">
                          {STAGES.find(s => s.key === log.toStage)?.label}
                        </span>
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-neutral-500">
                        <span>操作人：{log.operator}</span>
                        <span>{formatDateTime(log.operatedAt)}</span>
                      </div>
                      {log.remark && (
                        <p className="text-sm text-neutral-600 mt-2 bg-white px-3 py-2 rounded-lg border border-neutral-200">
                          备注：{log.remark}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Scan size={20} className="text-primary-500" />
              <h3 className="font-semibold text-neutral-800">扫码提示</h3>
            </div>
            <ul className="space-y-3 text-sm text-neutral-600">
              <li className="flex items-start space-x-2">
                <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                  1
                </span>
                <span>使用扫码枪扫描样品标签上的二维码或条形码</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                  2
                </span>
                <span>系统自动识别样品信息并显示当前状态</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                  3
                </span>
                <span>选择目标环节，确认后更新样品状态</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                  4
                </span>
                <span>也可以手动输入追踪号进行操作</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-3">快捷操作</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/samples/new')}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur hover:bg-white/30 rounded-lg transition-colors font-medium text-sm"
              >
                + 录入新样品
              </button>
              <button
                onClick={() => navigate('/samples')}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur hover:bg-white/30 rounded-lg transition-colors font-medium text-sm"
              >
                查看所有样品
              </button>
              <button
                onClick={() => navigate('/templates')}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur hover:bg-white/30 rounded-lg transition-colors font-medium text-sm"
              >
                管理流程模板
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowPage;
