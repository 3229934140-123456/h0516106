import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Printer, CheckCircle } from 'lucide-react';
import { InputWithScan } from '@/components/forms/InputWithScan';
import { QRCodePrint } from '@/components/common/QRCodePrint';
import { useLabStore } from '@/store/useLabStore';
import { useToast } from '@/components/common/Toast';
import { getTodayString } from '@/utils/dateFormat';
import type { Sample } from '@/types';

const sampleTypes = ['水质样品', '食品样品', '土壤样品', '空气样品', '生物样品', '其他'];

const SampleNew: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addSample, currentUser } = useLabStore();
  const [step, setStep] = useState(1);
  const [showPrint, setShowPrint] = useState(false);
  const [newSample, setNewSample] = useState<Sample | null>(null);

  const [formData, setFormData] = useState({
    originalBarcode: '',
    name: '',
    type: '',
    source: '',
    client: '',
    receivedDate: getTodayString(),
    quantity: 1,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep >= 1) {
      if (!formData.name.trim()) {
        newErrors.name = '请输入样品名称';
      }
      if (!formData.type) {
        newErrors.type = '请选择样品类型';
      }
    }

    if (currentStep >= 2) {
      if (!formData.source.trim()) {
        newErrors.source = '请输入样品来源';
      }
      if (!formData.client.trim()) {
        newErrors.client = '请输入委托方';
      }
      if (!formData.receivedDate) {
        newErrors.receivedDate = '请选择接收日期';
      }
      if (formData.quantity <= 0) {
        newErrors.quantity = '数量必须大于0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateStep(2)) {
      showToast('请完善所有必填信息', 'error');
      return;
    }

    if (!currentUser) {
      showToast('用户未登录', 'error');
      return;
    }

    const sample = addSample({
      name: formData.name,
      type: formData.type,
      source: formData.source,
      client: formData.client,
      receivedDate: formData.receivedDate,
      quantity: formData.quantity,
      description: formData.description,
      createdBy: currentUser.id,
    });

    setNewSample(sample);
    setStep(3);
    showToast('样品录入成功！', 'success');
  };

  const handlePrintAndClose = () => {
    setShowPrint(true);
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const steps = [
    { number: 1, title: '基本信息' },
    { number: 2, title: '来源信息' },
    { number: 3, title: '完成' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/samples')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">录入新样品</h1>
          <p className="text-neutral-500 mt-1">填写样品信息，生成追踪编号并打印标签</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, index) => (
            <React.Fragment key={s.number}>
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    step > s.number
                      ? 'bg-success-500 text-white'
                      : step === s.number
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {step > s.number ? <CheckCircle size={18} /> : s.number}
                </div>
                <span
                  className={`ml-3 font-medium ${
                    step >= s.number ? 'text-neutral-800' : 'text-neutral-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded-full ${
                    step > s.number ? 'bg-success-500' : 'bg-neutral-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputWithScan
                label="原有条码"
                value={formData.originalBarcode}
                onChange={(v) => setFormData({ ...formData, originalBarcode: v })}
                placeholder="扫描或输入样品原有条码"
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  样品名称 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="请输入样品名称"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.name ? 'border-danger-500' : 'border-neutral-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-danger-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  样品类型 <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value });
                    if (errors.type) setErrors({ ...errors, type: '' });
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white ${
                    errors.type ? 'border-danger-500' : 'border-neutral-300'
                  }`}
                >
                  <option value="">请选择样品类型</option>
                  {sampleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="text-xs text-danger-500">{errors.type}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">数量</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setFormData({ ...formData, quantity: val });
                  }}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">样品描述</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入样品描述信息..."
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  样品来源 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => {
                    setFormData({ ...formData, source: e.target.value });
                    if (errors.source) setErrors({ ...errors, source: '' });
                  }}
                  placeholder="请输入样品来源，如：第一水厂"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.source ? 'border-danger-500' : 'border-neutral-300'
                  }`}
                />
                {errors.source && (
                  <p className="text-xs text-danger-500">{errors.source}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  委托方 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => {
                    setFormData({ ...formData, client: e.target.value });
                    if (errors.client) setErrors({ ...errors, client: '' });
                  }}
                  placeholder="请输入委托方名称"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.client ? 'border-danger-500' : 'border-neutral-300'
                  }`}
                />
                {errors.client && (
                  <p className="text-xs text-danger-500">{errors.client}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  接收日期 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => {
                    setFormData({ ...formData, receivedDate: e.target.value });
                    if (errors.receivedDate) setErrors({ ...errors, receivedDate: '' });
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.receivedDate ? 'border-danger-500' : 'border-neutral-300'
                  }`}
                />
                {errors.receivedDate && (
                  <p className="text-xs text-danger-500">{errors.receivedDate}</p>
                )}
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
              <h4 className="font-medium text-primary-700 mb-2">录入信息确认</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">样品名称：</span>
                  <span className="text-neutral-800 font-medium">{formData.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">样品类型：</span>
                  <span className="text-neutral-800 font-medium">{formData.type || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">数量：</span>
                  <span className="text-neutral-800 font-medium">{formData.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">来源：</span>
                  <span className="text-neutral-800 font-medium">{formData.source || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">委托方：</span>
                  <span className="text-neutral-800 font-medium">{formData.client || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">接收日期：</span>
                  <span className="text-neutral-800 font-medium">{formData.receivedDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && newSample && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-success-500" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-800 mb-2">样品录入成功！</h3>
            <p className="text-neutral-500 mb-6">系统已自动生成唯一追踪编号</p>

            <div className="max-w-md mx-auto bg-neutral-50 rounded-xl p-6 mb-8 border border-neutral-200">
              <div className="text-sm text-neutral-500 mb-1">追踪编号</div>
              <div className="text-2xl font-mono font-bold text-primary-600 mb-4">
                {newSample.trackingNo}
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-neutral-300">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${newSample.trackingNo}`}
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200">
          {step > 1 && step < 3 ? (
            <button
              onClick={handlePrev}
              className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
            >
              上一步
            </button>
          ) : (
            <button
              onClick={() => navigate('/samples')}
              className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
            >
              取消
            </button>
          )}

          {step < 2 && (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2"
            >
              <span>下一步</span>
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2"
            >
              <Save size={18} />
              <span>确认录入</span>
            </button>
          )}

          {step === 3 && newSample && (
            <div className="flex space-x-3 ml-auto">
              <button
                onClick={() => navigate('/samples')}
                className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                返回列表
              </button>
              <button
                onClick={handlePrintAndClose}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2"
              >
                <Printer size={18} />
                <span>打印标签</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showPrint && newSample && (
        <QRCodePrint
          trackingNo={newSample.trackingNo}
          sampleName={newSample.name}
          onClose={() => {
            setShowPrint(false);
            navigate('/samples');
          }}
        />
      )}
    </div>
  );
};

export default SampleNew;
