import React from 'react';
import { IQResultView } from './iq';
import type { ResultData } from './common/types';

interface ResultComponentProps {
  results: ResultData;
  userInfo?: {name: string, email: string, age: string, location: string} | null;
  onRetake: () => void;
  onHome: () => void;
}

/**
 * @deprecated Sử dụng IQResultView thay thế
 * 
 * Component này được giữ lại để đảm bảo tương thích ngược với code cũ.
 * Với các dự án mới, hãy sử dụng component cụ thể cho loại test (IQResultView, EQResultView, etc.)
 */
export default function ResultComponent(props: ResultComponentProps) {
  return <IQResultView {...props} />;
}