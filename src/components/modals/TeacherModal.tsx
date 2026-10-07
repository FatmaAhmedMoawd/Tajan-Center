import React, { useState, useEffect } from 'react';
import { Teacher } from '../../types';
import { useCenter } from '../../store/CenterContext';
import { X, GraduationCap, Phone, Palette, AlertCircle, Banknote } from 'lucide-react';
import { TEACHER_COLOR_PRESETS } from '../../lib/constants';

interface TeacherModalProps {
  isOpen: boolean;
  teacherToEdit?: Teacher | null;
  onClose: () => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  teacherToEdit,
  onClose,
}) => {
  const { addTeacher, updateTeacher } = useCenter();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [monthlyFee, setMonthlyFee] = useState<number>(180);
  const [color, setColor] = useState(TEACHER_COLOR_PRESETS[0].hex);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (teacherToEdit) {
      setName(teacherToEdit.name);
      setSubject(teacherToEdit.subject);
      setMonthlyFee(teacherToEdit.monthlyFee || 180);
      setColor(teacherToEdit.color);
      setPhone(teacherToEdit.phone || '');
      setNotes(teacherToEdit.notes || '');
      setError('');
    } else {
      setName('');
      setSubject('');
      setMonthlyFee(180);
      setColor(TEACHER_COLOR_PRESETS[0].hex);
      setPhone('');
      setNotes('');
      setError('');
    }
  }, [teacherToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('يرجى إدخال اسم المدرس');
      return;
    }

    if (!subject.trim()) {
      setError('يرجى إدخال مادة التدريس');
      return;
    }

    if (teacherToEdit) {
      updateTeacher(teacherToEdit.id, {
        name: name.trim(),
        subject: subject.trim(),
        monthlyFee: Number(monthlyFee) || 180,
        color,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addTeacher({
        name: name.trim(),
        subject: subject.trim(),
        monthlyFee: Number(monthlyFee) || 180,
        color,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {teacherToEdit ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}
              </h2>
              <p className="text-xs text-slate-500">
                {teacherToEdit
                  ? 'تحديث الاسم والمادة وسعر الاشتراك واللون'
                  : 'إضافة مدرس جديد لكادر السنتر وتحديد سعر اشتراكه الشهري'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Teacher Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              اسم المدرس <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: أستاذ محمود عبد العال"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
            />
          </div>

          {/* Subject, Monthly Fee, and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المادة الدراسية <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (error) setError('');
                }}
                placeholder="مثال: فيزياء وكيمياء"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-teal-600" />
                <span>سعر الاشتراك الشهري (ج.م)</span>
              </label>
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                min="0"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              رقم التليفون (اختياري)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                dir="ltr"
                className="w-full text-left pl-3.5 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Color preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span>اللون المميّز للمدرس</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {TEACHER_COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.hex}
                  onClick={() => setColor(preset.hex)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    color === preset.hex
                      ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full shadow-xs"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="text-[11px] text-slate-600 font-medium">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ملاحظات المدرس
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: مواعيد الحصص، تفاصيل التواصل..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[44px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors min-h-[44px]"
            >
              {teacherToEdit ? 'حفظ التعديلات' : 'إضافة المدرس'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
