import { CenterData, Student, Teacher, PaymentRecord } from '../types';
import { GRADES, getDefaultFeeForGrade } from './constants';

export function createSeedData(): CenterData {
  // مدرس واحد فقط في البداية: أستاذ سيد خالد
  const teachers: Teacher[] = [
    {
      id: 'teacher-1',
      name: 'أستاذ سيد خالد',
      subject: 'لغة عربية ونحو',
      color: '#059669', // Emerald Green
      monthlyFee: 80, // Default base fee
      phone: '01123456789',
      notes: 'تأسيس النحو والبلاغة للمرحلتين الابتدائية والإعدادية',
    },
  ];

  const studentNameTemplates = [
    { name: 'عمر شريف عبد الله', parentPhone: '01222334455' },
    { name: 'ملك مصطفى عثمان', parentPhone: '01066778899' },
    { name: 'زياد طارق فاروق', parentPhone: '01199001122' },
    { name: 'فريدة محمد فتحي', parentPhone: '01044556677' },
    { name: 'يوسف إبراهيم بدر', parentPhone: '01288990033' },
    { name: 'نور الدين حسن علام', parentPhone: '01033449900' },
    { name: 'سلمى إيهاب السعدني', parentPhone: '01566778899' },
    { name: 'كريم محمود الجوهري', parentPhone: '01188776655' },
    { name: 'جنى أحمد رضوان', parentPhone: '01044552233' },
    { name: 'حمزة حسام البدري', parentPhone: '01266554433' },
    { name: 'مريم وائل الشريف', parentPhone: '01055443311' },
    { name: 'علي أيمن عبد العزيز', parentPhone: '01112398745' },
    { name: 'حنين عصام مرسي', parentPhone: '01245678912' },
    { name: 'مروان هيثم خليل', parentPhone: '01198765412' },
  ];

  const students: Student[] = [];
  const payments: PaymentRecord[] = [];
  let studentCounter = 1;

  // Generate students across all 6 grades
  // 3, 4, 5, 6 ابتدائي (80 EGP) | 1, 2 إعدادي (100 EGP)
  GRADES.forEach((grade, gIdx) => {
    const countInGrade = 4 + (gIdx % 2); // 4 or 5 students per grade (~27 total)
    const gradeFee = getDefaultFeeForGrade(grade);

    for (let i = 0; i < countInGrade; i++) {
      const studentId = `std-${studentCounter++}`;
      const template = studentNameTemplates[(i + gIdx * 2) % studentNameTemplates.length];

      let status: Student['status'] = 'active';
      if (gIdx === 5 && i === countInGrade - 1) status = 'withdrawn';
      else if (gIdx === 4 && i === countInGrade - 1) status = 'dropped';
      else if (gIdx === 0 && i === 0) status = 'exempt';

      students.push({
        id: studentId,
        teacherId: 'teacher-1',
        grade,
        name: template.name,
        parentPhone: template.parentPhone,
        status,
        monthlyFee: gradeFee, // 80 for primary, 100 for prep
        notes: status === 'exempt' ? 'حالة إنسانية معفاة' : undefined,
        createdAt: '2026-08-01T08:00:00.000Z',
      });
    }
  });

  // 1. August Payments (2026-08)
  students.forEach((student, idx) => {
    const fee = student.monthlyFee || 80;
    if (student.status === 'exempt') {
      payments.push({
        studentId: student.id,
        month: '2026-08',
        status: 'exempt',
        amount: 0,
        paidAt: '2026-08-05',
      });
    } else {
      payments.push({
        studentId: student.id,
        month: '2026-08',
        status: idx % 4 === 0 ? 'cash_to_teacher' : 'paid',
        amount: fee,
        paidAt: `2026-08-0${(idx % 6) + 1}`,
      });
    }
  });

  // 2. September Payments (2026-09) - Default month upon open
  const septemberDates = [
    '2026-09-02',
    '2026-09-04',
    '2026-09-07',
    '2026-09-09',
    '2026-09-12',
    '2026-09-15',
    '2026-09-18',
  ];

  students.forEach((student, idx) => {
    const fee = student.monthlyFee || 80;
    if (student.status === 'exempt') {
      payments.push({
        studentId: student.id,
        month: '2026-09',
        status: 'exempt',
        amount: 0,
        paidAt: '2026-09-04',
      });
    } else if (student.status === 'active' || student.status === 'withdrawn') {
      if (idx % 5 === 0) {
        payments.push({
          studentId: student.id,
          month: '2026-09',
          status: 'unpaid',
        });
      } else {
        const pDate = septemberDates[idx % septemberDates.length];
        payments.push({
          studentId: student.id,
          month: '2026-09',
          status: idx % 3 === 0 ? 'cash_to_teacher' : 'paid',
          amount: fee,
          paidAt: pDate,
        });
      }
    }
  });

  return {
    version: 1,
    teachers,
    students,
    payments,
    unlockedMonths: ['2026-08', '2026-09'],
    updatedAt: new Date().toISOString(),
  };
}
