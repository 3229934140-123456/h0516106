import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useLabStore } from '@/store/useLabStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime } from '@/utils/dateFormat';
import type { Sample, AbnormalResult } from '@/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { samples, getDashboardStats, abnormalResults } = useLabStore();
  const stats = getDashboardStats();

  const trendData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySamples = samples.filter(s => s.receivedDate === dateStr).length;
      last7Days.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        样品数: daySamples,
      });
    }
    return last7Days;
  }, [samples]);

  const statusDistribution = useMemo(() => [
    { name: '待检测', value: stats.pendingSamples, color: '#FF7D00' },
    { name: '检测中', value: stats.testingSamples, color: '#165DFF' },
    { name: '已完成', value: stats.completedSamples, color: '#00B42A' },
    { name: '异常', value: stats.abnormalSamples, color: '#F53F3F' },
  ], [stats]);

  const recentSamples = useMemo(() =>
    [...samples].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5),
    [samples]
  );

  const unhandledAbnormal = useMemo(() =>
    abnormalResults.filter(a => !a.handled).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [abnormalResults]
  );

  const statCards = [
    { label: '样品总数', value: stats.totalSamples, icon: FlaskConical, color: 'primary', change: `+${stats.todaysSamples} 今日` },
    { label: '待检测', value: stats.pendingSamples, icon: Clock, color: 'warning', change: '待处理' },
    { label: '检测中', value: stats.testingSamples, icon: TrendingUp, color: 'primary', change: '进行中' },
    { label: '已完成', value: stats.completedSamples, icon: CheckCircle, color: 'success', change: '已完成' },
    { label: '异常样品', value: stats.abnormalSamples, icon: AlertTriangle, color: 'danger', change: '需关注' },
    { label: '未处理异常', value: stats.unhandledExceptions, icon: AlertOctagon, color: 'danger', change: '紧急' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; text: string }> = {
      primary: { bg: 'bg-primary-50', icon: 'bg-primary-500', text: 'text-primary-600' },
      success: { bg: 'bg-success-50', icon: 'bg-success-500', text: 'text-success-600' },
      warning: { bg: 'bg-warning-50', icon: 'bg-warning-500', text: 'text-warning-600' },
      danger: { bg: 'bg-danger-50', icon: 'bg-danger-500', text: 'text-danger-600' },
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">仪表盘</h1>
          <p className="text-neutral-500 mt-1">欢迎回来，这是今日的实验室数据概览</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-neutral-500">
          <Calendar size={16} />
          <span>{formatDateTime(new Date())}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);
          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/samples')}
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className={`text-xs ${colors.text} font-medium`}>{card.change}</span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-neutral-800">{card.value}</p>
                <p className="text-sm text-neutral-500 mt-1">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">近7天样品趋势</h3>
            <button
              onClick={() => navigate('/samples')}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center space-x-1"
            >
              <span>查看全部</span>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSamples" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" />
                <XAxis dataKey="date" stroke="#86909C" fontSize={12} />
                <YAxis stroke="#86909C" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E6EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="样品数"
                  stroke="#165DFF"
                  strokeWidth={2}
                  fill="url(#colorSamples)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">状态分布</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" />
                <XAxis type="number" stroke="#86909C" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#86909C" fontSize={12} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E6EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {statusDistribution.map((entry, index) => (
                    <rect key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">最近录入样品</h3>
            <button
              onClick={() => navigate('/samples/new')}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center space-x-1"
            >
              <span>录入新样品</span>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {recentSamples.map((sample: Sample) => (
              <div
                key={sample.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/samples/${sample.id}`)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <FlaskConical size={18} className="text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{sample.name}</p>
                    <p className="text-xs text-neutral-500">{sample.trackingNo}</p>
                  </div>
                </div>
                <StatusBadge status={sample.status} type="sample" size="sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">异常提醒</h3>
            <button
              onClick={() => navigate('/abnormal')}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center space-x-1"
            >
              <span>全部异常</span>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {unhandledAbnormal.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                <CheckCircle size={48} className="mx-auto mb-3 text-success-400" />
                <p>暂无异常结果</p>
              </div>
            ) : (
              unhandledAbnormal.slice(0, 5).map((abn: AbnormalResult) => (
                <div
                  key={abn.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-danger-50/50 border border-danger-100 cursor-pointer hover:bg-danger-50 transition-colors"
                  onClick={() => navigate('/abnormal')}
                >
                  <AlertTriangle size={18} className="text-danger-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800 line-clamp-2">{abn.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <StatusBadge status={abn.severity} type="severity" size="sm" />
                      <span className="text-xs text-neutral-500">{formatDateTime(abn.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
