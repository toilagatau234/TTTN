import React from 'react';
import { Skeleton } from 'antd';

const MiniStatistics = ({ icon, title, value, growth, prefix, loading }) => {
  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white rounded-[20px] shadow-sm p-4 bg-clip-border transition-all hover:shadow-md">
      {loading ? (
        // Giao diện khi chưa có dữ liệu (Skeleton)
        <div className="flex items-center gap-3">
          <Skeleton.Avatar active size="large" shape="square" />
          <Skeleton active paragraph={{ rows: 1 }} title={false} className="w-full" />
        </div>
      ) : (
        // Giao diện khi CÓ dữ liệu
        <div className="flex items-center">
          {/* Icon Box */}
          <div className="h-[56px] w-[56px] rounded-full bg-light-primary flex items-center justify-center text-brand-500 text-2xl shadow-sm">
            {icon}
          </div>

          {/* Info */}
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <div className="flex items-end gap-2">
              <h4 className="text-2xl font-bold text-navy-700">
                {prefix}{value}
              </h4>
              {growth && (
                <span className={`text-sm font-bold ${growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {growth > 0 ? '+' : ''}{growth}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniStatistics;