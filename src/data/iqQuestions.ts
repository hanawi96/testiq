import type { Question } from '../utils/test';

// ✅ DEMO: 10 câu hỏi IQ ngắn gọn để test chức năng
export const iqQuestions: Question[] = [
  {
    id: 1,
    type: 'logic',
    difficulty: 'easy',
    question: '2, 4, 6, 8, ? - Số tiếp theo trong dãy là gì?',
    options: ['10', '12', '14', '16'],
    correct: 0,
    explanation: 'Dãy số tăng đều 2 đơn vị: 2+2=4, 4+2=6, 6+2=8, 8+2=10'
  },
  {
    id: 2,
    type: 'math',
    difficulty: 'easy',
    question: 'Nếu 1 quả táo có giá 5,000 đồng, thì 3 quả táo có giá bao nhiêu?',
    options: ['10,000 đồng', '15,000 đồng', '20,000 đồng', '25,000 đồng'],
    correct: 1,
    explanation: '3 × 5,000 = 15,000 đồng'
  },
  {
    id: 3,
    type: 'logic',
    difficulty: 'medium',
    question: 'A, C, E, G, ? - Chữ cái tiếp theo là gì?',
    options: ['H', 'I', 'J', 'K'],
    correct: 1,
    explanation: 'Dãy các chữ cái cách nhau 1 vị trí: A(1), C(3), E(5), G(7), I(9)'
  },
  {
    id: 4,
    type: 'spatial',
    difficulty: 'medium',
    question: 'Nếu quay hình vuông 90 độ sang phải, góc trên-trái sẽ ở vị trí nào?',
    options: ['Trên-phải', 'Dưới-phải', 'Dưới-trái', 'Trên-trái'],
    correct: 0,
    explanation: 'Khi quay 90° sang phải, góc trên-trái → trên-phải'
  },
  {
    id: 5,
    type: 'pattern',
    difficulty: 'medium',
    question: '1, 1, 2, 3, 5, 8, ? - Số tiếp theo là gì?',
    options: ['11', '13', '15', '17'],
    correct: 1,
    explanation: 'Dãy Fibonacci: mỗi số = tổng 2 số trước. 5+8=13'
  },
  {
    id: 6,
    type: 'verbal',
    difficulty: 'easy',
    question: 'CON GÀ là với TIẾNG KÉU như CON CHÓ là với?',
    options: ['Tiếng sủa', 'Tiếng rên', 'Tiếng hú', 'Tiếng kêu'],
    correct: 0,
    explanation: 'Gà kêu tiếng kéo, chó kêu tiếng sủa'
  },
  {
    id: 7,
    type: 'logic',
    difficulty: 'hard',
    question: 'Trong một nhóm 5 người, mỗi người bắt tay với mọi người khác một lần. Tổng cộng có bao nhiêu cái bắt tay?',
    options: ['8', '10', '12', '15'],
    correct: 1,
    explanation: 'Công thức: n(n-1)/2 = 5×4/2 = 10 cái bắt tay'
  },
  {
    id: 8,
    type: 'pattern',
    difficulty: 'hard',
    question: '3, 7, 15, 31, ? - Số tiếp theo là gì?',
    options: ['47', '63', '79', '95'],
    correct: 1,
    explanation: 'Quy luật: số tiếp theo = số trước × 2 + 1. 31×2+1=63'
  },
  {
    id: 9,
    type: 'math',
    difficulty: 'expert',
    question: 'Nếu x + 2y = 10 và x - y = 1, thì x = ?',
    options: ['3', '4', '5', '6'],
    correct: 1,
    explanation: 'Từ x-y=1 → x=y+1. Thay vào: (y+1)+2y=10 → 3y=9 → y=3, x=4'
  },
  {
    id: 10,
    type: 'logic',
    difficulty: 'expert',
    question: 'Tất cả A đều là B. Một số B là C. Kết luận nào đúng?',
    options: ['Tất cả A đều là C', 'Một số A là C', 'Không A nào là C', 'Không thể kết luận'],
    correct: 3,
    explanation: 'Từ 2 tiền đề đã cho, không thể suy ra mối quan hệ chắc chắn giữa A và C'
  }
];

export const testConfig = {
  timeLimit: 60, // 60 giây để test chức năng chuông báo
  title: 'Demo Test IQ 10 Câu',
  description: 'Test demo với 10 câu hỏi IQ đa dạng để kiểm tra các chức năng'
}; 