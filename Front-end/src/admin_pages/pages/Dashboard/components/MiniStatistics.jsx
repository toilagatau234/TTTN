import React from 'react';
import { Skeleton } from 'antd';

const MiniStatistics = ({ icon, title, value, growth, prefix, loading }) => {
  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white rounded-[24px] shadow-premium p-6 transition-all hover:shadow-hover group overflow-hidden border border-white/50">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/30 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-blue-100/40 transition-colors"></div>

      {loading ? (
        <div className="flex items-center gap-4">
          <Skeleton.Avatar active size={56} shape="square" className="rounded-2xl" />
          <div className="flex-1">
            <Skeleton active paragraph={{ rows: 1 }} title={false} />
          </div>
        </div>
      ) : (
        <div className="flex items-center relative z-10">
          {/* Icon Box with Gradient */}
          <div className="h-[56px] w-[56px] rounded-2xl bg-[#F4F7FE] flex items-center justify-center text-blue-600 text-2xl shadow-sm group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>

          {/* Info */}
          <div className="ml-5 flex-1 leading-tight">
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.1em] mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-[#2B3674] tracking-tighter m-0">
                {prefix}{value}
              </h4>
              {growth !== undefined && (
                <div className={`flex items-center text-[11px] font-black px-2 py-0.5 rounded-full ${growth >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                  {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniStatistics;