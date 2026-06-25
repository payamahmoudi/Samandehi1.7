import { useState, useRef } from 'react';
import { School, Personnel, BalanceRecord, SubjectRequirement } from '../types';
import { parseExcelFile, getSheetNames, sheetToJson, parseSchoolsSheet, parsePersonnelSheet, parseBalanceSheet, exportToExcel, exportTemplateExcel, balanceToSubjectRequirements, validateImportData, parseReferenceSheets, ReferenceData } from '../utils/excelImport';

interface Props {
  schools: School[];
  personnel: Personnel[];
  balanceRecords: BalanceRecord[];
  onImport: (data: { schools?: School[], personnel?: Personnel[], balanceRecords?: BalanceRecord[], subjectRequirements?: SubjectRequirement[] }) => void;
  onReset: () => void;
}

export default function ImportExport({ schools, personnel, balanceRecords, onImport, onReset }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<{ schools: string; personnel: string; balance: string }>({
    schools: '', personnel: '', balance: '',
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewSheet, setPreviewSheet] = useState('');
  const [workbook, setWorkbook] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState<string[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const wb = await parseExcelFile(file);
      setWorkbook(wb);
      const names = getSheetNames(wb);
      setSheets(names);
      setImportLog([`✅ فایل "${file.name}" با موفقیت خوانده شد.`, `📄 ${names.length} شیت یافت شد: ${names.join('، ')}`]);
      
      // Auto-detect sheets by name (smart detection)
      const findSheet = (keywords: string[]) => names.find(n => keywords.some(k => n.includes(k))) || '';
      setSelectedSheets({
        schools: findSheet(['مدارس', 'مدرسه', 'School']),
        personnel: findSheet(['نیروها', 'نیرو', 'پرسنل', 'Staff']),
        balance: findSheet(['تراز', 'ابلاغ', 'Balance', 'Traz']),
      });
      // If no smart match, fallback to position (skip reference sheets)
      const refNames = ['رشته استخدامی', 'گروه تدریس', 'درس', 'صلاحیت'];
      const dataSheets = names.filter(n => !refNames.some(r => n.includes(r)) && !n.includes('راهنما'));
      if (!findSheet(['مدارس']) && dataSheets.length >= 1) setSelectedSheets(prev => ({ ...prev, schools: dataSheets[0] }));
      if (!findSheet(['نیروها']) && dataSheets.length >= 2) setSelectedSheets(prev => ({ ...prev, personnel: dataSheets[1] }));
      if (!findSheet(['تراز']) && dataSheets.length >= 3) setSelectedSheets(prev => ({ ...prev, balance: dataSheets[2] }));
    } catch (err) {
      setImportLog([`❌ خطا در خواندن فایل: ${err}`]);
    }
  };

  const handlePreview = (sheetName: string) => {
    if (!workbook || !sheetName) return;
    const data = sheetToJson(workbook, sheetName);
    setPreviewData(data.slice(0, 10));
    setPreviewSheet(sheetName);
  };

  const handleImport = async () => {
    if (!workbook) return;
    setImporting(true);
    const log: string[] = [];

    try {
      const importData: { schools?: School[]; personnel?: Personnel[]; balanceRecords?: BalanceRecord[]; subjectRequirements?: SubjectRequirement[] } = {};

      // Parse reference sheets first (if they exist in the workbook)
      let refData: ReferenceData | undefined;
      if (workbook.Sheets['رشته استخدامی'] || workbook.Sheets['درس'] || workbook.Sheets['صلاحیت تدریس']) {
        refData = parseReferenceSheets(workbook);
        log.push(`📋 شیت‌های مرجع خوانده شد: ${refData.majors.length} رشته، ${refData.lessons.length} درس، ${refData.qualifications.length} صلاحیت`);
        if (refData.errors.length > 0) {
          log.push(`⚠️ ${refData.errors.length} خطای مرجع:`);
          refData.errors.slice(0, 5).forEach(e => log.push(`   ⚠️ ${e}`));
        }
      }

      if (selectedSheets.schools) {
        const rows = sheetToJson(workbook, selectedSheets.schools);
        const parsed = parseSchoolsSheet(rows);
        importData.schools = parsed;
        log.push(`✅ ${parsed.length} مدرسه از شیت "${selectedSheets.schools}" وارد شد.`);
      }

      if (selectedSheets.personnel) {
        const rows = sheetToJson(workbook, selectedSheets.personnel);
        const parsed = parsePersonnelSheet(rows, refData);
        importData.personnel = parsed;
        log.push(`✅ ${parsed.length} نیرو از شیت "${selectedSheets.personnel}" وارد شد.`);
      }

      if (selectedSheets.balance) {
        const rows = sheetToJson(workbook, selectedSheets.balance);
        const parsed = parseBalanceSheet(rows, refData);
        importData.balanceRecords = parsed;
        log.push(`✅ ${parsed.length} ردیف تراز از شیت "${selectedSheets.balance}" وارد شد.`);
        
        // Auto-generate SubjectRequirements from balance data
        const schoolsForReqs = importData.schools || schools;
        const generatedReqs = balanceToSubjectRequirements(parsed, schoolsForReqs);
        if (generatedReqs.length > 0) {
          importData.subjectRequirements = generatedReqs;
          log.push(`✅ ${generatedReqs.length} درس از تراز استخراج و به سامانه اضافه شد.`);
        }
      }

      // Cross-validation
      const validationErrors = validateImportData(
        importData.schools || schools,
        importData.personnel || personnel,
        importData.balanceRecords || [],
        [],
        refData
      );
      const criticalErrors = validationErrors.filter(e => e.severity === 'error');
      const warnings = validationErrors.filter(e => e.severity === 'warning');
      if (criticalErrors.length > 0) {
        log.push(`❌ ${criticalErrors.length} خطای بحرانی:`);
        criticalErrors.forEach(e => log.push(`   ❌ شیت ${e.sheet}${e.row ? ` ردیف ${e.row}` : ''}: ${e.message}`));
      }
      if (warnings.length > 0) {
        log.push(`⚠️ ${warnings.length} هشدار:`);
        warnings.forEach(e => log.push(`   ⚠️ شیت ${e.sheet}${e.row ? ` ردیف ${e.row}` : ''}: ${e.message}`));
      }

      if (refData) (importData as any).referenceData = refData;
      onImport(importData);
      log.push('🎉 ورود داده‌ها با موفقیت انجام شد!');
    } catch (err) {
      log.push(`❌ خطا: ${err}`);
    }

    setImportLog(log);
    setImporting(false);
  };

  const handleExport = () => {
    exportToExcel(schools, personnel, balanceRecords);
  };

  const handleTemplateExport = () => {
    exportTemplateExcel();
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
        <h3 className="text-lg font-bold text-indigo-800 mb-3">📥 راهنمای ورود اطلاعات از اکسل</h3>
        <div className="text-sm text-indigo-700 space-y-2">
          <p className="font-semibold">سامانه پایا - ساماندهی نیروی انسانی</p>
          <p>ابتدا «قالب اکسل خام» را دانلود و اطلاعات زیر را پر کنید:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
              <div className="font-bold text-indigo-800 mb-1">📋 شیت‌های مرجع (پایگاه کد)</div>
              <ul className="text-xs space-y-1 text-indigo-600">
                <li>🔵 <strong>رشته استخدامی:</strong> کد ۱۰۰۱-۱۹۹۹ + نام رشته</li>
                <li>🟢 <strong>گروه تدریس:</strong> کد ۱۰-۹۹ + نام گروه</li>
                <li>🟡 <strong>درس:</strong> کد ۴۰۰۱-۴۹۹۹ + نام + گروه + ساعت</li>
                <li>⭐ <strong>صلاحیت تدریس:</strong> کدام رشته مجاز به تدریس کدام درس</li>
              </ul>
            </div>
            <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
              <div className="font-bold text-indigo-800 mb-1">📊 شیت‌های اطلاعاتی</div>
              <ul className="text-xs space-y-1 text-indigo-600">
                <li>🏫 <strong>مدارس:</strong> کد + نام + دوره + جنسیت + کلاس</li>
                <li>👥 <strong>نیروها:</strong> نام + کد ملی + رشته + سنوات</li>
                <li>📝 <strong>تراز ابلاغ:</strong> کد مدرسه + کد درس + ساعت</li>
                <li>📅 <strong>برنامه هفتگی:</strong> اختیاری</li>
              </ul>
            </div>
          </div>
          <div className="bg-indigo-100/50 rounded-lg p-3 mt-2 text-xs">
            <strong>💡 قاعده طلایی:</strong> همه پیوندها با <strong>کد عددی</strong> برقرار می‌شوند. اسم‌ها فقط برای خوانایی. سامانه خودکار کد↔نام را تبدیل می‌کند.
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📂 انتخاب فایل اکسل</h3>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            📁 انتخاب فایل اکسل
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            📤 خروجی اکسل
          </button>
          <button
            onClick={handleTemplateExport}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
          >
            📋 دانلود قالب اکسل خام
          </button>
          <button
            onClick={() => { if (confirm('آیا مطمئن هستید؟ تمام داده‌ها به حالت اولیه برمی‌گردد.')) onReset(); }}
            className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
          >
            🔄 بازنشانی داده‌ها
          </button>
        </div>
      </div>

      {/* Sheet Mapping */}
      {sheets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 تطبیق شیت‌ها</h3>
          {/* Auto-detected reference sheets */}
          <div className="bg-indigo-50 rounded-lg p-3 mb-4 text-xs text-indigo-700 border border-indigo-100">
            <strong>📋 شیت‌های مرجع:</strong> اگر فایل شامل شیت‌های «رشته استخدامی»، «گروه تدریس»، «درس» و «صلاحیت تدریس» باشد، خودکار خوانده می‌شوند.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">🏫 شیت مدارس</label>
              <div className="flex gap-2">
                <select
                  value={selectedSheets.schools}
                  onChange={e => setSelectedSheets(prev => ({ ...prev, schools: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">انتخاب نشده</option>
                  {sheets.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => handlePreview(selectedSheets.schools)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">👁️</button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">👥 شیت نیروها</label>
              <div className="flex gap-2">
                <select
                  value={selectedSheets.personnel}
                  onChange={e => setSelectedSheets(prev => ({ ...prev, personnel: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">انتخاب نشده</option>
                  {sheets.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => handlePreview(selectedSheets.personnel)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">👁️</button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">📝 شیت تراز ابلاغ</label>
              <div className="flex gap-2">
                <select
                  value={selectedSheets.balance}
                  onChange={e => setSelectedSheets(prev => ({ ...prev, balance: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">انتخاب نشده</option>
                  {sheets.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => handlePreview(selectedSheets.balance)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">👁️</button>
              </div>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={importing || (!selectedSheets.schools && !selectedSheets.personnel && !selectedSheets.balance)}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {importing ? '⏳ در حال وارد کردن...' : '📥 شروع ورود اطلاعات'}
          </button>
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            👁️ پیش‌نمایش شیت "{previewSheet}" (۱۰ ردیف اول)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(previewData[0]).map(key => (
                    <th key={key} className="py-2 px-2 text-right border-l border-gray-200 font-medium text-gray-600 whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="py-1 px-2 border-l border-gray-100 whitespace-nowrap">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Log */}
      {importLog.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">📋 گزارش ورود اطلاعات</h3>
          <div className="space-y-1 font-mono text-sm">
            {importLog.map((log, i) => (
              <div key={i} className="text-gray-200">{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Current Data Stats */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 وضعیت فعلی داده‌ها</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-3xl font-bold text-indigo-600">{schools.length}</div>
            <div className="text-xs text-indigo-500 mt-1">مدرسه</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-3xl font-bold text-emerald-600">{personnel.length}</div>
            <div className="text-xs text-emerald-500 mt-1">نیرو</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <div className="text-3xl font-bold text-amber-600">{balanceRecords.length}</div>
            <div className="text-xs text-amber-500 mt-1">ردیف تراز</div>
          </div>
        </div>
      </div>
    </div>
  );
}
