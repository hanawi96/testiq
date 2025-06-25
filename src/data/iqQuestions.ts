import type { Question } from '../utils/test';

export const iqQuestions: Question[] = [
  {
    id: 1,
    type: 'logic',
    difficulty: 'easy',
    question: 'Trong dãy số sau, số tiếp theo là gì?\n2, 4, 8, 16, ?',
    options: ['24', '32', '30', '28'],
    correct: 1,
    explanation: 'Đây là dãy số tăng gấp đôi: 2×2=4, 4×2=8, 8×2=16, 16×2=32'
  },
  {
    id: 2,
    type: 'pattern',
    difficulty: 'easy',
    question: 'Tìm từ khác biệt:\nChó, Mèo, Cá, Chim',
    options: ['Chó', 'Mèo', 'Cá', 'Chim'],
    correct: 2,
    explanation: 'Cá là duy nhất sống dưới nước, còn lại đều sống trên cạn'
  },
  {
    id: 3,
    type: 'math',
    difficulty: 'easy',
    question: 'Nếu 5 áo có giá 100.000đ, thì 8 áo có giá bao nhiêu?',
    options: ['160.000đ', '150.000đ', '140.000đ', '180.000đ'],
    correct: 0,
    explanation: 'Mỗi áo giá 20.000đ (100.000÷5), nên 8 áo = 8×20.000 = 160.000đ'
  },
  {
    id: 4,
    type: 'verbal',
    difficulty: 'medium',
    question: 'SÁCH có mối quan hệ với ĐỌC như NHẠC có mối quan hệ với:',
    options: ['NGHE', 'HÁT', 'NHẢY', 'CHƠI'],
    correct: 0,
    explanation: 'Sách để đọc, nhạc để nghe - đây là mối quan hệ chức năng'
  },
  {
    id: 5,
    type: 'pattern',
    difficulty: 'medium',
    question: 'Hoàn thành dãy chữ cái: A, C, F, J, ?',
    options: ['M', 'N', 'O', 'P'],
    correct: 2,
    explanation: 'Khoảng cách tăng dần: A(+2)C(+3)F(+4)J(+5)O'
  },
  {
    id: 6,
    type: 'spatial',
    difficulty: 'easy',
    question: 'Một hình vuông được chia thành 4 phần bằng nhau, nếu tô màu 2 phần thì bằng bao nhiêu phần trăm?',
    options: ['25%', '50%', '75%', '40%'],
    correct: 1,
    explanation: '2 phần trong 4 phần = 2/4 = 1/2 = 50%'
  },
  {
    id: 7,
    type: 'logic',
    difficulty: 'hard',
    question: 'Nếu tất cả A đều là B, và một số B là C, thì có thể kết luận gì?',
    options: ['Tất cả A đều là C', 'Một số A là C', 'Không thể kết luận gì', 'Tất cả C đều là A'],
    correct: 2,
    explanation: 'Từ hai tiền đề này không đủ thông tin để kết luận về mối quan hệ giữa A và C'
  },
  {
    id: 8,
    type: 'math',
    difficulty: 'medium',
    question: 'Tìm số tiếp theo trong dãy Fibonacci: 1, 1, 2, 3, 5, 8, ?',
    options: ['11', '13', '15', '10'],
    correct: 1,
    explanation: 'Dãy Fibonacci: mỗi số = tổng 2 số trước. 5+8=13'
  },
  {
    id: 9,
    type: 'verbal',
    difficulty: 'medium',
    question: 'Từ nào có nghĩa gần nhất với "THÔNG MINH"?',
    options: ['Lanh lợi', 'Khôn ngoan', 'Nhanh nhẹn', 'Tinh tế'],
    correct: 1,
    explanation: 'Khôn ngoan có nghĩa gần nhất với thông minh, đều chỉ trí tuệ'
  },
  {
    id: 10,
    type: 'logic',
    difficulty: 'hard',
    question: 'Trong 100 người: 85 người đeo kính, 70 người đeo đồng hồ. Ít nhất bao nhiêu người đeo cả hai?',
    options: ['55', '60', '65', '70'],
    correct: 0,
    explanation: 'Ít nhất = 85+70-100 = 55 người (theo nguyên lý bù trừ)'
  }
];

export const testConfig = {
  timeLimit: 1500, // 25 phút = 1500 giây
  title: 'Test IQ Chuẩn Quốc Tế',
  description: 'Đánh giá toàn diện chỉ số thông minh với 10 câu hỏi khoa học'
}; 