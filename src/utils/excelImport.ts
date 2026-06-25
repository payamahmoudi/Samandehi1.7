import * as XLSX from 'xlsx';
import { School, Personnel, BalanceRecord, GradeInfo, SubjectRequirement, ScheduleEntry } from '../types';

// ━━━━━━━━ REFERENCE TABLES (Code-Based Lookup) ━━━━━━━━

export interface RefMajor { code: number; name: string; group: string; defaultHours: number; }
export interface RefTeachingGroup { code: number; name: string; }
export interface RefLesson { code: number; name: string; groupCode: number; groupName: string; period: string; stdHours: number; }
export interface RefQualification { lessonCode: number; lessonName: string; majorCode: number; majorName: string; groupCode: number; }

export interface ReferenceData {
  majors: RefMajor[];
  groups: RefTeachingGroup[];
  lessons: RefLesson[];
  qualifications: RefQualification[];
  errors: string[];
}

// Parse all 4 reference sheets from workbook
export function parseReferenceSheets(workbook: XLSX.WorkBook): ReferenceData {
  const errors: string[] = [];
  const majors: RefMajor[] = [];
  const groups: RefTeachingGroup[] = [];
  const lessons: RefLesson[] = [];
  const qualifications: RefQualification[] = [];

  // Sheet: رشته استخدامی
  const majSheet = workbook.Sheets['رشته استخدامی'];
  if (majSheet) {
    const rows = XLSX.utils.sheet_to_json(majSheet, { defval: '' });
    rows.forEach((r: any, i: number) => {
      const code = parseInt(r['کد رشته استخدامی']);
      const name = String(r['رشته استخدام / بکارگیری'] || '').trim();
      if (!code || code < 1001 || code > 1999) { if (name) errors.push(`رشته استخدامی ردیف ${i+2}: کد ${code} خارج بازه ۱۰۰۱-۱۹۹۹`); return; }
      if (!name) { errors.push(`رشته استخدامی ردیف ${i+2}: نام خالی`); return; }
      majors.push({ code, name, group: String(r['گروه شغلی'] || ''), defaultHours: parseInt(r['ساعت موظف پیش‌فرض']) || 24 });
    });
  }

  // Sheet: گروه تدریس
  const grpSheet = workbook.Sheets['گروه تدریس'];
  if (grpSheet) {
    const rows = XLSX.utils.sheet_to_json(grpSheet, { defval: '' });
    rows.forEach((r: any, i: number) => {
      const code = parseInt(r['کد گروه']);
      const name = String(r['گروه تدریس'] || '').trim();
      if (!code || code < 10 || code > 99) { if (name) errors.push(`گروه تدریس ردیف ${i+2}: کد ${code} خارج بازه ۱۰-۹۹`); return; }
      if (!name) return;
      groups.push({ code, name });
    });
  }

  // Sheet: درس
  const lesSheet = workbook.Sheets['درس'];
  if (lesSheet) {
    const rows = XLSX.utils.sheet_to_json(lesSheet, { defval: '' });
    rows.forEach((r: any, i: number) => {
      const code = parseInt(r['کد درس']);
      const name = String(r['نام درس'] || '').trim();
      const groupCode = parseInt(r['کد گروه']);
      if (!code || code < 4001 || code > 4999) { if (name) errors.push(`درس ردیف ${i+2}: کد ${code} خارج بازه ۴۰۰۱-۴۹۹۹`); return; }
      if (!name) return;
      const grp = groups.find(g => g.code === groupCode);
      if (!grp) errors.push(`درس ردیف ${i+2}: کد گروه ${groupCode} در شیت «گروه تدریس» یافت نشد`);
      lessons.push({
        code, name, groupCode,
        groupName: grp?.name || String(r['گروه تدریس'] || ''),
        period: String(r['دوره'] || ''),
        stdHours: parseInt(r['ساعت استاندارد']) || 0,
      });
    });
  }

  // Sheet: صلاحیت تدریس
  const qualSheet = workbook.Sheets['صلاحیت تدریس'];
  if (qualSheet) {
    const rows = XLSX.utils.sheet_to_json(qualSheet, { defval: '' });
    rows.forEach((r: any, i: number) => {
      const lessonCode = parseInt(r['کد درس']);
      const majorCode = parseInt(r['کد رشته استخدامی مجاز']);
      if (!lessonCode || !majorCode) return;
      const les = lessons.find(l => l.code === lessonCode);
      const maj = majors.find(m => m.code === majorCode);
      if (!les) errors.push(`صلاحیت ردیف ${i+2}: کد درس ${lessonCode} در شیت «درس» یافت نشد`);
      if (!maj) errors.push(`صلاحیت ردیف ${i+2}: کد استخدامی ${majorCode} در شیت «رشته استخدامی» یافت نشد`);
      qualifications.push({
        lessonCode, lessonName: les?.name || String(r['درس'] || ''),
        majorCode, majorName: maj?.name || String(r['رشته استخدامی مجاز'] || ''),
        groupCode: parseInt(r['کد گروه']) || les?.groupCode || 0,
      });
    });
  }

  return { majors, groups, lessons, qualifications, errors };
}

// Lookup helpers: code → name
export function lookupLessonByCode(ref: ReferenceData, code: number): RefLesson | undefined {
  return ref.lessons.find(l => l.code === code);
}
export function lookupLessonByName(ref: ReferenceData, name: string): RefLesson | undefined {
  return ref.lessons.find(l => l.name === name);
}
export function lookupMajorByCode(ref: ReferenceData, code: number): RefMajor | undefined {
  return ref.majors.find(m => m.code === code);
}
export function lookupMajorByName(ref: ReferenceData, name: string): RefMajor | undefined {
  return ref.majors.find(m => m.name === name);
}
export function lookupGroupByCode(ref: ReferenceData, code: number): RefTeachingGroup | undefined {
  return ref.groups.find(g => g.code === code);
}

// ━━━━━━━━ CORE EXCEL FUNCTIONS ━━━━━━━━

export function parseExcelFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function getSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames;
}

export function sheetToJson(workbook: XLSX.WorkBook, sheetName: string): any[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

// Helper: read cell value with multiple possible column names
function cell(row: any, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== '') return String(v).trim();
  }
  return '';
}

function cellNum(row: any, ...keys: string[]): number {
  const v = cell(row, ...keys);
  return parseInt(v) || 0;
}

// ━━━━━━━━ SHEET 1: SCHOOLS PARSER ━━━━━━━━

export function parseSchoolsSheet(rows: any[]): School[] {
  const schools: School[] = [];
  for (const row of rows) {
    const name = cell(row, 'نام مدرسه', 'نام', 'مدرسه');
    if (!name) continue;
    const code = cell(row, 'کد مدرسه', 'کد', 'کد واحد سازمانی', 'کد سازمانی');

    const typeStr = cell(row, 'دوره تحصیلی', 'دوره', 'مقطع', 'نوع');
    let type: School['type'] = 'ابتدایی';
    if (typeStr.includes('متوسطه اول') || typeStr.includes('راهنمایی')) type = 'متوسطه اول';
    else if (typeStr.includes('غیردولتی') || typeStr.includes('غیر دولتی')) type = 'غیردولتی';
    else if (typeStr.includes('مرکز تابعه') || typeStr.includes('تابعه')) type = 'مرکز تابعه';
    else if (typeStr.includes('هنرستان')) type = 'هنرستان';
    else if (typeStr.includes('کاردانش')) type = 'کاردانش';
    else if (typeStr.includes('متوسطه دوم') || typeStr.includes('دبیرستان')) type = 'متوسطه دوم نظری';
    else if (typeStr.includes('استثنایی')) type = 'استثنایی';

    const genderStr = cell(row, 'جنسیت', 'نوع جنسیتی');
    let gender: School['gender'] = 'مختلط';
    if (genderStr.includes('پسر')) gender = 'پسرانه';
    else if (genderStr.includes('دختر')) gender = 'دخترانه';

    const locationStr = cell(row, 'محل استقرار', 'محل', 'شهری/روستایی');
    const location = locationStr.includes('روستا') ? 'روستایی' as const : 'شهری' as const;

    const classCount = cellNum(row, 'تعداد کلاس', 'کلاس');
    const studentCount = cellNum(row, 'تعداد دانش‌آموز', 'دانش آموز', 'تعداد دانش آموز');

    // Build grades from dedicated columns OR auto-distribute
    const grades: GradeInfo[] = [];
    // Check for per-grade columns like "کلاس_اول", "دانش‌آموز_اول" etc.
    const gradeNames = type === 'ابتدایی' ? ['اول','دوم','سوم','چهارم','پنجم','ششم'] :
      type === 'متوسطه اول' ? ['هفتم','هشتم','نهم'] : ['دهم','یازدهم','دوازدهم'];
    
    let hasGradeDetail = false;
    for (const gn of gradeNames) {
      const cls = cellNum(row, `کلاس_${gn}`, `کلاس ${gn}`, `تعداد کلاس ${gn}`);
      const stu = cellNum(row, `دانش‌آموز_${gn}`, `دانش آموز ${gn}`, `تعداد دانش آموز ${gn}`);
      const field = cell(row, `رشته_${gn}`, `رشته ${gn}`);
      if (cls > 0 || stu > 0) {
        hasGradeDetail = true;
        grades.push({ grade: gn, classCount: cls || 1, studentCount: stu, field: field || undefined });
      }
    }
    
    if (!hasGradeDetail && classCount > 0) {
      const perGrade = Math.ceil(classCount / gradeNames.length);
      const perStudent = Math.ceil(studentCount / gradeNames.length);
      gradeNames.forEach(g => grades.push({ grade: g, classCount: perGrade, studentCount: perStudent }));
    }

    schools.push({
      id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code: code || `M-${Date.now()}`,
      name, type, gender, location,
      region: cell(row, 'منطقه', 'ناحیه') || 'سامان',
      classCount: hasGradeDetail ? grades.reduce((s, g) => s + g.classCount, 0) : classCount,
      studentCount: hasGradeDetail ? grades.reduce((s, g) => s + g.studentCount, 0) : studentCount,
      grades,
      needsManager: true,
      needsAssistant: classCount >= 6,
      fields: cell(row, 'رشته', 'رشته‌ها') ? [cell(row, 'رشته', 'رشته‌ها')] : undefined,
    });
  }
  return schools;
}

// ━━━━━━━━ SHEET 2: PERSONNEL PARSER (with code-based lookup) ━━━━━━━━

export function parsePersonnelSheet(rows: any[], ref?: ReferenceData): Personnel[] {
  const personnel: Personnel[] = [];
  for (const row of rows) {
    const firstName = cell(row, 'نام', 'اسم');
    const lastName = cell(row, 'نام خانوادگی', 'فامیل', 'فامیلی');
    if (!firstName && !lastName) continue;

    const genderStr = cell(row, 'جنسیت', 'جنس');
    const gender: Personnel['gender'] = genderStr.includes('زن') || genderStr.includes('خانم') ? 'زن' : 'مرد';

    const statusStr = cell(row, 'وضعیت', 'حالت');
    let status: Personnel['status'] = 'فعال';
    if (statusStr.includes('زایمان')) status = 'مرخصی زایمان';
    else if (statusStr.includes('مأموریت') || statusStr.includes('ماموریت')) status = 'مأموریت';
    else if (statusStr.includes('بازنشست')) status = 'بازنشسته';

    const roleStr = cell(row, 'سمت', 'نقش', 'پست');
    let role: Personnel['role'] = 'معلم';
    if (roleStr.includes('مدیر')) role = 'مدیر';
    else if (roleStr.includes('معاون پرورشی')) role = 'معاون پرورشی';
    else if (roleStr.includes('معاون اجرایی')) role = 'معاون اجرایی';
    else if (roleStr.includes('معاون آموزشی') || roleStr.includes('معاون')) role = 'معاون آموزشی';
    else if (roleStr.includes('سرپرست')) role = 'سرپرست بخش';
    else if (roleStr.includes('معاون فنی')) role = 'معاون فنی';
    else if (roleStr.includes('سرایدار')) role = 'سرایدار';
    else if (roleStr.includes('خدمتگزار')) role = 'خدمتگزار';

    const serviceYears = cellNum(row, 'سنوات خدمت', 'سنوات', 'سابقه');
    
    personnel.push({
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstName, lastName,
      nationalCode: cell(row, 'کد ملی', 'کدملی', 'شماره ملی'),
      personnelCode: cell(row, 'کد پرسنلی', 'کدپرسنلی', 'شماره پرسنلی', 'پرسنلی') || undefined,
      fatherName: cell(row, 'نام پدر') || undefined,
      phoneNumber: cell(row, 'شماره همراه', 'تلفن', 'موبایل') || undefined,
      fieldDegree: cell(row, 'رشته تحصیلی') || undefined,
      fieldEmployment: cell(row, 'رشته استخدامی') || undefined,
      employmentDate: cell(row, 'تاریخ استخدام') || undefined,
      birthDate: cell(row, 'تاریخ تولد') || undefined,
      serviceYears: serviceYears || undefined,
      lastOrganizationScore: cellNum(row, 'امتیاز سازماندهی', 'آخرین امتیاز') || undefined,
      reducedHours: serviceYears >= 20,
      gender,
      field: (() => {
        // Code-based lookup: name→code and code→name
        const fieldName = cell(row, 'رشته استخدام / بکارگیری', 'رشته', 'رشته تحصیلی', 'تخصص', 'رشته به کارگیری');
        const fieldCode = cellNum(row, 'کد رشته استخدامی');
        if (ref && fieldCode && !fieldName) {
          const found = lookupMajorByCode(ref, fieldCode);
          return found?.name || fieldName || '';
        }
        if (ref && fieldName && !fieldCode) {
          // Will be resolved, just use name
        }
        return fieldName || '';
      })(),
      degree: cell(row, 'مدرک', 'مدرک تحصیلی'),
      employmentType: cell(row, 'نوع استخدام', 'استخدام'),
      status,
      maxHours: cellNum(row, 'ساعت موظف', 'ساعات موظف') || 24,
      assignedHours: cellNum(row, 'ساعات ابلاغ', 'ساعت ابلاغ'),
      nonMandatoryHours: cellNum(row, 'ساعات غیرموظف'),
      isLocked: status === 'مرخصی زایمان',
      assignments: [],
      role,
    });
  }
  return personnel;
}

// ━━━━━━━━ SHEET 3: BALANCE (TRAZ) PARSER (Code-Based) ━━━━━━━━

export function parseBalanceSheet(rows: any[], ref?: ReferenceData): BalanceRecord[] {
  const records: BalanceRecord[] = [];
  for (const row of rows) {
    const schoolName = cell(row, 'نام مدرسه', 'مدرسه');
    const schoolId = cell(row, 'کد مدرسه') || '';
    if (!schoolName && !schoolId) continue;

    // Code-based: try کد درس first, then name
    const lessonCode = cellNum(row, 'کد درس');
    let subject = cell(row, 'درس', 'رشته تدریس', 'نام درس', 'عنوان درس');
    let category = cell(row, 'گروه تدریس', 'نوع درس', 'دسته درس') || undefined;
    let groupCode = cellNum(row, 'کد گروه');

    // Auto-resolve: code → name
    if (ref && lessonCode && !subject) {
      const les = lookupLessonByCode(ref, lessonCode);
      if (les) {
        subject = les.name;
        if (!category) category = les.groupName;
        if (!groupCode) groupCode = les.groupCode;
      }
    }
    // Auto-resolve: name → code (for group)
    if (ref && subject && !groupCode) {
      const les = lookupLessonByName(ref, subject);
      if (les) {
        groupCode = les.groupCode;
        if (!category) category = les.groupName;
      }
    }

    const grade = cell(row, 'پایه');
    if (!subject || !grade) continue;

    records.push({
      schoolId,
      schoolName: schoolName || schoolId,
      subject, grade,
      totalHours: cellNum(row, 'ساعت کل', 'کل ساعات', 'تراز', 'ساعت'),
      assignedHours: cellNum(row, 'ساعات ابلاغ شده', 'ابلاغ شده'),
      remainingHours: cellNum(row, 'باقیمانده', 'مانده'),
      category: (category as any) || undefined,
    });
  }
  return records;
}

// ━━━━━━━━ SHEET 4: SCHEDULE PARSER ━━━━━━━━

export function parseScheduleSheet(rows: any[]): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  for (const row of rows) {
    const schoolName = cell(row, 'مدرسه', 'نام مدرسه', 'کد مدرسه');
    const personnelName = cell(row, 'نام معلم', 'نام نیرو', 'معلم');
    const subject = cell(row, 'درس');
    const grade = cell(row, 'پایه');
    const day = cell(row, 'روز هفته', 'روز') as ScheduleEntry['day'];
    const time = cell(row, 'بازه زمانی', 'ساعت حضور', 'ساعت');
    if (!schoolName || !personnelName || !subject || !day || !time) continue;
    entries.push({
      id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      schoolId: cell(row, 'کد مدرسه') || '',
      schoolName, personnelId: '', personnelName,
      subject, grade, day, time,
    });
  }
  return entries;
}

// ━━━━━━━━ BALANCE → SUBJECT REQUIREMENTS ━━━━━━━━

export function balanceToSubjectRequirements(records: BalanceRecord[], schools: School[]): SubjectRequirement[] {
  const reqs: SubjectRequirement[] = [];
  const seen = new Set<string>();
  for (const rec of records) {
    const school = schools.find(s => s.name === rec.schoolName || s.code === rec.schoolName || s.code === rec.schoolId);
    const gradeInfo = school?.grades.find(g => g.grade === rec.grade);
    const classCount = gradeInfo?.classCount || 1;
    const hoursPerWeek = classCount > 0 ? Math.round(rec.totalHours / classCount) : rec.totalHours;
    const key = `${rec.subject}|${rec.grade}`;
    if (seen.has(key)) continue;
    seen.add(key);
    reqs.push({
      subject: rec.subject, grade: rec.grade,
      hoursPerWeek: hoursPerWeek || rec.totalHours,
      field: (rec as any).field || undefined,
      requiredTeacherField: rec.subject,
      category: rec.category,
    });
  }
  return reqs;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WORKFORCE ANALYSIS ENGINE (فاز ۳)
// Greedy allocation without double-counting
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface WorkforceAnalysisRow {
  groupCode: number;
  groupName: string;
  requiredHours: number;    // نیاز منطقه
  capacityHours: number;    // ظرفیت نیرو
  balance: number;          // تراز (ظرفیت - نیاز)
  equivalentPersons: number; // معادل نفر
  status: 'کمبود' | 'متوازن' | 'مازاد';
  personnelCount: number;
  personnelNames: string[];
}

export function calculateWorkforceAnalysis(
  balance: BalanceRecord[],
  personnel: Personnel[],
  ref: ReferenceData
): WorkforceAnalysisRow[] {
  // Step 1: Calculate required hours per group code
  const groupDemand: Record<number, number> = {};
  for (const rec of balance) {
    // Find group code: from record, or from lesson lookup
    let gCode = 0;
    const lessonCode = parseInt(String(rec.subject).match(/\d{4}/)?.[0] || '0');
    if (lessonCode) {
      const les = ref.lessons.find(l => l.code === lessonCode);
      if (les) gCode = les.groupCode;
    }
    if (!gCode) {
      const les = ref.lessons.find(l => l.name === rec.subject);
      if (les) gCode = les.groupCode;
    }
    // Fallback: try category name
    if (!gCode && rec.category) {
      const grp = ref.groups.find(g => g.name === rec.category);
      if (grp) gCode = grp.code;
    }
    if (!gCode) continue;
    groupDemand[gCode] = (groupDemand[gCode] || 0) + rec.totalHours;
  }

  // Step 2: Find which major codes are qualified for each group
  const groupToMajors: Record<number, Set<number>> = {};
  for (const q of ref.qualifications) {
    const gCode = q.groupCode || ref.lessons.find(l => l.code === q.lessonCode)?.groupCode;
    if (!gCode) continue;
    if (!groupToMajors[gCode]) groupToMajors[gCode] = new Set();
    groupToMajors[gCode].add(q.majorCode);
  }

  // Step 3: Map each active personnel to their major code
  interface PersonnelUnit { id: string; name: string; majorCode: number; hours: number; groups: number[]; allocated: boolean; }
  const units: PersonnelUnit[] = [];
  for (const p of personnel) {
    if (p.status !== 'فعال') continue;
    if (p.role === 'سرایدار' || p.role === 'خدمتگزار') continue;
    // Find major code
    let majorCode = 0;
    const codeFromField = parseInt(String(p.field).match(/\d{4}/)?.[0] || '0');
    if (codeFromField >= 1001 && codeFromField <= 1999) majorCode = codeFromField;
    if (!majorCode) {
      const maj = ref.majors.find(m => m.name === p.field);
      if (maj) majorCode = maj.code;
    }
    if (!majorCode) continue;

    // Find which groups this person qualifies for
    const qualGroups: number[] = [];
    for (const [gStr, majSet] of Object.entries(groupToMajors)) {
      if (majSet.has(majorCode)) qualGroups.push(parseInt(gStr));
    }
    if (qualGroups.length === 0) continue;

    units.push({
      id: p.id || p.nationalCode,
      name: `${p.firstName} ${p.lastName}`,
      majorCode,
      hours: p.maxHours || 24,
      groups: qualGroups,
      allocated: false,
    });
  }

  // Step 4: Greedy allocation (no double-counting)
  const groupCapacity: Record<number, number> = {};
  const groupPersonnel: Record<number, string[]> = {};
  const groupPersonnelCount: Record<number, number> = {};

  // Phase A: Single-specialty first
  const singleSpec = units.filter(u => u.groups.length === 1);
  for (const u of singleSpec) {
    const g = u.groups[0];
    groupCapacity[g] = (groupCapacity[g] || 0) + u.hours;
    if (!groupPersonnel[g]) groupPersonnel[g] = [];
    groupPersonnel[g].push(u.name);
    groupPersonnelCount[g] = (groupPersonnelCount[g] || 0) + 1;
    u.allocated = true;
  }

  // Phase B: Multi-specialty → allocate to group with highest deficit
  const multiSpec = units.filter(u => u.groups.length > 1 && !u.allocated);
  for (const u of multiSpec) {
    // Find group with worst deficit
    let worstGroup = u.groups[0];
    let worstDeficit = Infinity;
    for (const g of u.groups) {
      const demand = groupDemand[g] || 0;
      const cap = groupCapacity[g] || 0;
      const deficit = cap - demand; // More negative = worse
      if (deficit < worstDeficit) {
        worstDeficit = deficit;
        worstGroup = g;
      }
    }
    groupCapacity[worstGroup] = (groupCapacity[worstGroup] || 0) + u.hours;
    if (!groupPersonnel[worstGroup]) groupPersonnel[worstGroup] = [];
    groupPersonnel[worstGroup].push(u.name);
    groupPersonnelCount[worstGroup] = (groupPersonnelCount[worstGroup] || 0) + 1;
    u.allocated = true;
  }

  // Step 5: Build results
  const allGroupCodes = new Set([...Object.keys(groupDemand).map(Number), ...Object.keys(groupCapacity).map(Number)]);
  const results: WorkforceAnalysisRow[] = [];

  for (const gCode of allGroupCodes) {
    const grp = ref.groups.find(g => g.code === gCode);
    const required = groupDemand[gCode] || 0;
    const capacity = groupCapacity[gCode] || 0;
    const bal = capacity - required;
    const avgHours = 24;

    results.push({
      groupCode: gCode,
      groupName: grp?.name || `گروه ${gCode}`,
      requiredHours: required,
      capacityHours: capacity,
      balance: bal,
      equivalentPersons: Math.round((bal / avgHours) * 10) / 10,
      status: bal < 0 ? 'کمبود' : bal === 0 ? 'متوازن' : 'مازاد',
      personnelCount: groupPersonnelCount[gCode] || 0,
      personnelNames: groupPersonnel[gCode] || [],
    });
  }

  return results.sort((a, b) => a.balance - b.balance); // Most deficit first
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRAZ BALANCE ENGINE (per-school per-lesson)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TrazResult {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  subject: string;
  grade: string;
  category: string;
  requiredHours: number;
  assignedHours: number;
  remainingHours: number;
  status: 'کامل' | 'ناقص' | 'اضافه';
  assignedTeachers: string[];
  hourType: { mandatory: number; nonMandatory: number; executive: number };
}

// School-level aggregation: lessons per grade (like Python's StrID_lesson)
export interface SchoolLessonMap {
  schoolCode: string;
  schoolName: string;
  gradeSubjects: Record<string, string[]>; // grade -> [subject1, subject2, ...]
  totalRequired: number;
  totalAssigned: number;
  completionPercent: number;
}

export function calculateTrazBalance(
  balance: BalanceRecord[],
  personnel: Personnel[],
  schools: School[]
): TrazResult[] {
  // Pre-compute assignment index for O(1) lookup instead of O(n²)
  const assignmentIndex: Record<string, { hours: number; type: string; teacher: string }[]> = {};
  for (const p of personnel) {
    for (const a of p.assignments) {
      const aSchool = schools.find(s => s.id === a.schoolId);
      if (!aSchool) continue;
      const key = `${aSchool.code}|${a.subject}|${a.grade}`;
      if (!assignmentIndex[key]) assignmentIndex[key] = [];
      assignmentIndex[key].push({
        hours: a.hours,
        type: a.assignmentType || (a.isMandatory ? 'موظف' : 'غیرموظف'),
        teacher: `${p.firstName} ${p.lastName}`,
      });
    }
  }

  const results: TrazResult[] = [];
  for (const rec of balance) {
    const school = schools.find(s => s.name === rec.schoolName || s.code === rec.schoolId || s.code === rec.schoolName);
    const schoolCode = school?.code || rec.schoolId || '';
    const key = `${schoolCode}|${rec.subject}|${rec.grade}`;
    const assignments = assignmentIndex[key] || [];

    const mandatory = assignments.filter(a => a.type === 'موظف').reduce((s, a) => s + a.hours, 0);
    const nonMandatory = assignments.filter(a => a.type === 'غیرموظف').reduce((s, a) => s + a.hours, 0);
    const executive = assignments.filter(a => a.type === 'تدریس عوامل اجرایی').reduce((s, a) => s + a.hours, 0);
    const totalAssigned = mandatory + nonMandatory + executive;
    const remaining = rec.totalHours - totalAssigned;

    results.push({
      schoolId: school?.id || '',
      schoolName: rec.schoolName,
      schoolCode,
      subject: rec.subject,
      grade: rec.grade,
      category: rec.category || 'عمومی',
      requiredHours: rec.totalHours,
      assignedHours: totalAssigned,
      remainingHours: remaining,
      status: remaining === 0 ? 'کامل' : remaining > 0 ? 'ناقص' : 'اضافه',
      assignedTeachers: [...new Set(assignments.map(a => a.teacher))],
      hourType: { mandatory, nonMandatory, executive },
    });
  }
  return results;
}

// Generate school-level lesson map (like Python's generate_star_separated_classes)
export function generateSchoolLessonMaps(
  balance: BalanceRecord[],
  personnel: Personnel[],
  schools: School[]
): SchoolLessonMap[] {
  const traz = calculateTrazBalance(balance, personnel, schools);
  const schoolMap: Record<string, SchoolLessonMap> = {};

  for (const t of traz) {
    if (!schoolMap[t.schoolCode]) {
      schoolMap[t.schoolCode] = {
        schoolCode: t.schoolCode, schoolName: t.schoolName,
        gradeSubjects: {}, totalRequired: 0, totalAssigned: 0, completionPercent: 0,
      };
    }
    const sm = schoolMap[t.schoolCode];
    if (!sm.gradeSubjects[t.grade]) sm.gradeSubjects[t.grade] = [];
    sm.gradeSubjects[t.grade].push(t.subject);
    sm.totalRequired += t.requiredHours;
    sm.totalAssigned += t.assignedHours;
  }

  return Object.values(schoolMap).map(sm => ({
    ...sm,
    completionPercent: sm.totalRequired > 0 ? Math.round((sm.totalAssigned / sm.totalRequired) * 100) : 0,
  }));
}

// ━━━━━━━━ CROSS-VALIDATION (Enhanced) ━━━━━━━━

export interface ValidationError {
  sheet: string;
  row: number;
  message: string;
  severity: 'error' | 'warning';
}

export function validateImportData(
  schools: School[], personnel: Personnel[], balance: BalanceRecord[], schedule: ScheduleEntry[], ref?: ReferenceData
): ValidationError[] {
  const errors: ValidationError[] = [];
  const schoolNames = new Set(schools.map(s => s.name));
  const schoolCodes = new Set(schools.map(s => s.code));
  const personnelNames = new Set(personnel.map(p => `${p.firstName} ${p.lastName}`));

  // 1. Validate balance → schools
  balance.forEach((b, i) => {
    if (!schoolNames.has(b.schoolName) && !schoolCodes.has(b.schoolId) && !schoolCodes.has(b.schoolName)) {
      errors.push({ sheet: 'تراز ابلاغ', row: i + 2, message: `مدرسه «${b.schoolName}» در شیت مدارس یافت نشد.`, severity: 'error' });
    }
    if (b.totalHours <= 0) {
      errors.push({ sheet: 'تراز ابلاغ', row: i + 2, message: `ساعت کل درس «${b.subject}» صفر یا منفی است.`, severity: 'error' });
    }
    // Check grade matches school type
    const school = schools.find(s => s.name === b.schoolName || s.code === b.schoolId || s.code === b.schoolName);
    if (school) {
      const validGrades = school.grades.map(g => g.grade);
      if (validGrades.length > 0 && !validGrades.includes(b.grade)) {
        errors.push({ sheet: 'تراز ابلاغ', row: i + 2, message: `پایه «${b.grade}» در مدرسه «${b.schoolName}» (${school.type}) وجود ندارد.`, severity: 'warning' });
      }
    }
  });

  // 2. Validate schedule → schools & personnel
  schedule.forEach((s, i) => {
    if (!schoolNames.has(s.schoolName) && !schoolCodes.has(s.schoolId)) {
      errors.push({ sheet: 'برنامه هفتگی', row: i + 2, message: `مدرسه «${s.schoolName}» یافت نشد.`, severity: 'error' });
    }
    if (!personnelNames.has(s.personnelName)) {
      errors.push({ sheet: 'برنامه هفتگی', row: i + 2, message: `نیروی «${s.personnelName}» در شیت نیروها یافت نشد.`, severity: 'warning' });
    }
  });

  // 3. Duplicate school codes
  const codeCounts: Record<string, number> = {};
  schools.forEach(s => { codeCounts[s.code] = (codeCounts[s.code] || 0) + 1; });
  Object.entries(codeCounts).filter(([, c]) => c > 1).forEach(([code]) => {
    errors.push({ sheet: 'مدارس', row: 0, message: `کد مدرسه «${code}» تکراری است.`, severity: 'error' });
  });

  // 4. Duplicate national codes
  const ncCounts: Record<string, number> = {};
  personnel.forEach(p => { if (p.nationalCode) ncCounts[p.nationalCode] = (ncCounts[p.nationalCode] || 0) + 1; });
  Object.entries(ncCounts).filter(([, c]) => c > 1).forEach(([nc]) => {
    errors.push({ sheet: 'نیروها', row: 0, message: `کد ملی «${nc}» تکراری است.`, severity: 'error' });
  });

  // 5. Check personnel hours consistency
  personnel.forEach((p, i) => {
    if (p.role === 'معلم' && p.maxHours !== 24 && p.maxHours !== 20) {
      errors.push({ sheet: 'نیروها', row: i + 2, message: `ساعت موظف ${p.firstName} ${p.lastName} (${p.maxHours}) غیراستاندارد. معلم: ۲۴ یا ۲۰`, severity: 'warning' });
    }
  });

  // 6. Cross-validate balance subjects with school grades (ETL-grade check)
  const schoolGradeMap: Record<string, Set<string>> = {};
  schools.forEach(s => {
    schoolGradeMap[s.code] = new Set(s.grades.map(g => g.grade));
    schoolGradeMap[s.name] = new Set(s.grades.map(g => g.grade));
  });
  balance.forEach((b, i) => {
    const key = b.schoolId || b.schoolName;
    const validGrades = schoolGradeMap[key];
    if (validGrades && !validGrades.has(b.grade)) {
      errors.push({ sheet: 'تراز ابلاغ', row: i + 2, message: `پایه «${b.grade}» برای مدرسه «${b.schoolName}» معتبر نیست. (پایه‌ها: ${[...validGrades].join('، ')})`, severity: 'error' });
    }
  });

  // 7. Check for over-assignment (ETL Traz Balance)
  if (balance.length > 0) {
    const traz = calculateTrazBalance(balance, personnel, schools);
    const overAssigned = traz.filter(t => t.status === 'اضافه');
    overAssigned.forEach(t => {
      errors.push({ sheet: 'تراز ابلاغ', row: 0, message: `⛔ اضافه‌ابلاغ: ${t.subject} پایه ${t.grade} در ${t.schoolName} (${Math.abs(t.remainingHours)} ساعت اضافه)`, severity: 'error' });
    });
  }

  // 8. Reference data errors (from parsing reference sheets)
  if (ref && ref.errors.length > 0) {
    ref.errors.forEach(e => {
      errors.push({ sheet: 'مرجع', row: 0, message: `📋 ${e}`, severity: 'warning' });
    });
  }

  return errors;
}

// ━━━━━━━━ EXPORT: FULL DATA ━━━━━━━━

export function exportToExcel(schools: School[], personnel: Personnel[], _balanceRecords: BalanceRecord[], scheduleEntries: ScheduleEntry[] = [], ref?: ReferenceData) {
  const wb = XLSX.utils.book_new();

  const schoolData = schools.map(s => {
    const mgr = personnel.find(p => p.id === s.managerId);
    return {
      'کد مدرسه': s.code, 'نام مدرسه': s.name, 'دوره تحصیلی': s.type,
      'جنسیت': s.gender, 'محل استقرار': s.location || 'شهری', 'منطقه': s.region,
      'تعداد کلاس': s.classCount, 'تعداد دانش‌آموز': s.studentCount,
      'عوامل اجرایی': (s.executiveRoles || []).join('، '),
      'رشته': s.fields?.join('، ') || '',
      'کد فضا': s.spaceCode || '', 'شناسه ملی': s.nationalId || '',
      'کد پستی': s.postalCode || '', 'تلفن': s.phone || '',
      'موبایل مدیر': (s as any).managerPhone || '', 'آدرس': s.address || '',
      'مدیر': mgr ? `${mgr.firstName} ${mgr.lastName}` : '',
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schoolData), 'مدارس');

  const personnelData = personnel.map(p => ({
    'نام': p.firstName, 'نام خانوادگی': p.lastName, 'کد ملی': p.nationalCode,
    'کد پرسنلی': p.personnelCode || '', 'نام پدر': p.fatherName || '', 'جنسیت': p.gender,
    'رشته': p.field, 'رشته تحصیلی': p.fieldDegree || '', 'رشته استخدامی': p.fieldEmployment || '',
    'مدرک تحصیلی': p.degree, 'نوع استخدام': p.employmentType, 'وضعیت': p.status,
    'نقش': p.role, 'سنوات خدمت': p.serviceYears || '',
    'تاریخ استخدام': p.employmentDate || '', 'تاریخ تولد': p.birthDate || '',
    'شماره همراه': p.phoneNumber || '', 'امتیاز سازماندهی': p.lastOrganizationScore || '',
    'ساعات موظف': p.maxHours, 'ساعات ابلاغ شده': p.assignedHours, 'ساعات غیرموظف': p.nonMandatoryHours,
    'محل خدمت': p.assignments.map(a => a.schoolName).filter((v, i, a) => a.indexOf(v) === i).join('، '),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(personnelData), 'نیروها');

  const assignmentData = personnel.flatMap(p => p.assignments.map(a => ({
    'کد ملی': p.nationalCode, 'نام': `${p.firstName} ${p.lastName}`,
    'کد مدرسه': schools.find(s => s.id === a.schoolId)?.code || '', 'مدرسه': a.schoolName,
    'درس': a.subject, 'پایه': a.grade, 'ساعت': a.hours, 'نوع': a.isMandatory ? 'موظف' : 'غیرموظف',
    'تاریخ ثبت': new Date(a.createdAt).toLocaleDateString('fa-IR'),
  })));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assignmentData), 'ابلاغ‌ها');

  const scheduleData = scheduleEntries.map(s => ({
    'کد مدرسه': s.schoolId, 'مدرسه': s.schoolName,
    'نام معلم': s.personnelName, 'درس': s.subject,
    'پایه': s.grade, 'روز هفته': s.day, 'بازه زمانی': s.time,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scheduleData), 'برنامه هفتگی');

  // Sheet 5: Live Traz Balance Report (ETL-grade)
  const trazResults = calculateTrazBalance(_balanceRecords, personnel, schools);
  if (trazResults.length > 0) {
    const trazData = trazResults.map(t => ({
      'کد مدرسه': t.schoolCode, 'مدرسه': t.schoolName,
      'درس': t.subject, 'پایه': t.grade, 'نوع': t.category,
      'ساعت تراز': t.requiredHours,
      'موظف': t.hourType.mandatory,
      'غیرموظف': t.hourType.nonMandatory,
      'تدریس اجرایی': t.hourType.executive,
      'جمع ابلاغ': t.assignedHours,
      'باقیمانده': t.remainingHours,
      'وضعیت': t.status,
      'معلمان': t.assignedTeachers.join('، '),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trazData), 'گزارش تراز');
  }

  // Sheet 6: School Completion Summary
  const schoolMaps = generateSchoolLessonMaps(_balanceRecords, personnel, schools);
  if (schoolMaps.length > 0) {
    const summaryData = schoolMaps.map(sm => ({
      'کد مدرسه': sm.schoolCode, 'مدرسه': sm.schoolName,
      'کل ساعت تراز': sm.totalRequired, 'کل ابلاغ شده': sm.totalAssigned,
      'درصد تکمیل': `${sm.completionPercent}%`,
      'تعداد دروس': Object.values(sm.gradeSubjects).flat().length,
      'تعداد پایه‌ها': Object.keys(sm.gradeSubjects).length,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'خلاصه مدارس');
  }

  // Sheet: Workforce Analysis (تحلیل نیرو)
  if (ref && ref.qualifications.length > 0) {
    const analysis = calculateWorkforceAnalysis(_balanceRecords, personnel, ref);
    if (analysis.length > 0) {
      const analysisData = analysis.map(a => ({
        'کد گروه': a.groupCode,
        'گروه تدریس': a.groupName,
        'نیاز منطقه (ساعت)': a.requiredHours,
        'ظرفیت نیرو (ساعت)': a.capacityHours,
        'تعداد نیرو': a.personnelCount,
        'تراز (ساعت)': a.balance,
        'معادل نفر': a.equivalentPersons,
        'وضعیت': a.status,
        'نیروها': a.personnelNames.join('، '),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysisData), 'تحلیل نیرو');
    }
  }

  XLSX.writeFile(wb, 'خروجی_پایا.xlsx');
}

// ━━━━━━━━ EXPORT: SMART TEMPLATE ━━━━━━━━

export function exportTemplateExcel() {
  const wb = XLSX.utils.book_new();

  // ━━━ شیت ۱: رشته استخدامی (کد ۱۰۰۱-۱۹۹۹) ━━━
  const sRef1 = XLSX.utils.json_to_sheet([
    { 'کد رشته استخدامی': 1001, 'رشته استخدام / بکارگیری': 'آموزگار ابتدایی', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1002, 'رشته استخدام / بکارگیری': 'دبیر ریاضی', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1003, 'رشته استخدام / بکارگیری': 'دبیر فارسی و ادبیات', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1004, 'رشته استخدام / بکارگیری': 'دبیر علوم تجربی', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1005, 'رشته استخدام / بکارگیری': 'دبیر تربیت بدنی', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1006, 'رشته استخدام / بکارگیری': 'دبیر عربی', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1007, 'رشته استخدام / بکارگیری': 'دبیر زبان انگلیسی', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1008, 'رشته استخدام / بکارگیری': 'دبیر فیزیک', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1009, 'رشته استخدام / بکارگیری': 'دبیر شیمی', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1010, 'رشته استخدام / بکارگیری': 'دبیر تاریخ', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1011, 'رشته استخدام / بکارگیری': 'هنرآموز الکترونیک', 'گروه شغلی': 'فنی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1012, 'رشته استخدام / بکارگیری': 'مدیریت آموزشی', 'گروه شغلی': 'اجرایی', 'ساعت موظف پیش‌فرض': 36 },
    { 'کد رشته استخدامی': 1013, 'رشته استخدام / بکارگیری': 'مشاور', 'گروه شغلی': 'آموزشی', 'ساعت موظف پیش‌فرض': 24 },
    { 'کد رشته استخدامی': 1014, 'رشته استخدام / بکارگیری': 'مربی بهداشت', 'گروه شغلی': 'بهداشت', 'ساعت موظف پیش‌فرض': 24 },
  ]);

  // ━━━ شیت ۲: گروه تدریس (کد ۱۰-۹۹) ━━━
  const sRef2 = XLSX.utils.json_to_sheet([
    { 'کد گروه': 10, 'گروه تدریس': 'آموزش ابتدایی' },
    { 'کد گروه': 20, 'گروه تدریس': 'ریاضی' },
    { 'کد گروه': 30, 'گروه تدریس': 'فارسی و ادبیات' },
    { 'کد گروه': 40, 'گروه تدریس': 'علوم تجربی' },
    { 'کد گروه': 50, 'گروه تدریس': 'تربیت بدنی' },
    { 'کد گروه': 60, 'گروه تدریس': 'زبان' },
    { 'کد گروه': 70, 'گروه تدریس': 'عمومی' },
    { 'کد گروه': 80, 'گروه تدریس': 'فنی و حرفه‌ای' },
    { 'کد گروه': 90, 'گروه تدریس': 'معارف و قرآن' },
  ]);

  // ━━━ شیت ۳: درس (کد ۴۰۰۱-۴۹۹۹) ━━━
  const sRef3 = XLSX.utils.json_to_sheet([
    { 'کد درس': 4001, 'نام درس': 'پایه اول ابتدایی', 'کد گروه': 10, 'گروه تدریس': 'آموزش ابتدایی', 'دوره': 'ابتدایی', 'ساعت استاندارد': 24 },
    { 'کد درس': 4002, 'نام درس': 'پایه دوم ابتدایی', 'کد گروه': 10, 'گروه تدریس': 'آموزش ابتدایی', 'دوره': 'ابتدایی', 'ساعت استاندارد': 24 },
    { 'کد درس': 4003, 'نام درس': 'پایه سوم ابتدایی', 'کد گروه': 10, 'گروه تدریس': 'آموزش ابتدایی', 'دوره': 'ابتدایی', 'ساعت استاندارد': 24 },
    { 'کد درس': 4004, 'نام درس': 'پایه چهارم ابتدایی', 'کد گروه': 10, 'گروه تدریس': 'آموزش ابتدایی', 'دوره': 'ابتدایی', 'ساعت استاندارد': 24 },
    { 'کد درس': 4005, 'نام درس': 'پایه پنجم ابتدایی', 'کد گروه': 10, 'گروه تدریس': 'آموزش ابتدایی', 'دوره': 'ابتدایی', 'ساعت استاندارد': 24 },
    { 'کد درس': 4006, 'نام درس': 'پایه ششم ابتدایی', 'کد گروه': 10, 'گروه تدریس': 'آموزش ابتدایی', 'دوره': 'ابتدایی', 'ساعت استاندارد': 24 },
    { 'کد درس': 4101, 'نام درس': 'ریاضی', 'کد گروه': 20, 'گروه تدریس': 'ریاضی', 'دوره': 'متوسطه', 'ساعت استاندارد': 5 },
    { 'کد درس': 4102, 'نام درس': 'فارسی', 'کد گروه': 30, 'گروه تدریس': 'فارسی و ادبیات', 'دوره': 'متوسطه', 'ساعت استاندارد': 5 },
    { 'کد درس': 4103, 'نام درس': 'علوم تجربی', 'کد گروه': 40, 'گروه تدریس': 'علوم تجربی', 'دوره': 'متوسطه اول', 'ساعت استاندارد': 4 },
    { 'کد درس': 4104, 'نام درس': 'تربیت بدنی', 'کد گروه': 50, 'گروه تدریس': 'تربیت بدنی', 'دوره': 'همه', 'ساعت استاندارد': 2 },
    { 'کد درس': 4105, 'نام درس': 'عربی', 'کد گروه': 60, 'گروه تدریس': 'زبان', 'دوره': 'متوسطه', 'ساعت استاندارد': 2 },
    { 'کد درس': 4106, 'نام درس': 'زبان انگلیسی', 'کد گروه': 60, 'گروه تدریس': 'زبان', 'دوره': 'متوسطه', 'ساعت استاندارد': 2 },
    { 'کد درس': 4107, 'نام درس': 'آمادگی دفاعی', 'کد گروه': 70, 'گروه تدریس': 'عمومی', 'دوره': 'متوسطه', 'ساعت استاندارد': 1 },
    { 'کد درس': 4108, 'نام درس': 'تفکر و سبک زندگی', 'کد گروه': 70, 'گروه تدریس': 'عمومی', 'دوره': 'متوسطه اول', 'ساعت استاندارد': 1 },
    { 'کد درس': 4201, 'نام درس': 'فیزیک', 'کد گروه': 40, 'گروه تدریس': 'علوم تجربی', 'دوره': 'متوسطه دوم', 'ساعت استاندارد': 3 },
    { 'کد درس': 4202, 'نام درس': 'شیمی', 'کد گروه': 40, 'گروه تدریس': 'علوم تجربی', 'دوره': 'متوسطه دوم', 'ساعت استاندارد': 3 },
    { 'کد درس': 4203, 'نام درس': 'زیست شناسی', 'کد گروه': 40, 'گروه تدریس': 'علوم تجربی', 'دوره': 'متوسطه دوم', 'ساعت استاندارد': 3 },
    { 'کد درس': 4204, 'نام درس': 'زمین شناسی', 'کد گروه': 40, 'گروه تدریس': 'علوم تجربی', 'دوره': 'متوسطه دوم', 'ساعت استاندارد': 2 },
    { 'کد درس': 4301, 'نام درس': 'مدارهای الکتریکی', 'کد گروه': 80, 'گروه تدریس': 'فنی و حرفه‌ای', 'دوره': 'هنرستان', 'ساعت استاندارد': 3 },
  ]);

  // ━━━ شیت ۴: صلاحیت تدریس (قلب سیستم ⭐) ━━━
  const sRef4 = XLSX.utils.json_to_sheet([
    { 'کد درس': 4001, 'درس': 'پایه اول ابتدایی', 'کد رشته استخدامی مجاز': 1001, 'رشته استخدامی مجاز': 'آموزگار ابتدایی', 'کد گروه': 10 },
    { 'کد درس': 4002, 'درس': 'پایه دوم ابتدایی', 'کد رشته استخدامی مجاز': 1001, 'رشته استخدامی مجاز': 'آموزگار ابتدایی', 'کد گروه': 10 },
    { 'کد درس': 4005, 'درس': 'پایه پنجم ابتدایی', 'کد رشته استخدامی مجاز': 1001, 'رشته استخدامی مجاز': 'آموزگار ابتدایی', 'کد گروه': 10 },
    { 'کد درس': 4101, 'درس': 'ریاضی', 'کد رشته استخدامی مجاز': 1002, 'رشته استخدامی مجاز': 'دبیر ریاضی', 'کد گروه': 20 },
    { 'کد درس': 4102, 'درس': 'فارسی', 'کد رشته استخدامی مجاز': 1003, 'رشته استخدامی مجاز': 'دبیر فارسی و ادبیات', 'کد گروه': 30 },
    { 'کد درس': 4103, 'درس': 'علوم تجربی', 'کد رشته استخدامی مجاز': 1004, 'رشته استخدامی مجاز': 'دبیر علوم تجربی', 'کد گروه': 40 },
    { 'کد درس': 4201, 'درس': 'فیزیک', 'کد رشته استخدامی مجاز': 1008, 'رشته استخدامی مجاز': 'دبیر فیزیک', 'کد گروه': 40 },
    { 'کد درس': 4202, 'درس': 'شیمی', 'کد رشته استخدامی مجاز': 1009, 'رشته استخدامی مجاز': 'دبیر شیمی', 'کد گروه': 40 },
    { 'کد درس': 4202, 'درس': 'شیمی', 'کد رشته استخدامی مجاز': 1004, 'رشته استخدامی مجاز': 'دبیر علوم تجربی', 'کد گروه': 40 },
    { 'کد درس': 4203, 'درس': 'زیست شناسی', 'کد رشته استخدامی مجاز': 1004, 'رشته استخدامی مجاز': 'دبیر علوم تجربی', 'کد گروه': 40 },
    { 'کد درس': 4204, 'درس': 'زمین شناسی', 'کد رشته استخدامی مجاز': 1004, 'رشته استخدامی مجاز': 'دبیر علوم تجربی', 'کد گروه': 40 },
    { 'کد درس': 4104, 'درس': 'تربیت بدنی', 'کد رشته استخدامی مجاز': 1005, 'رشته استخدامی مجاز': 'دبیر تربیت بدنی', 'کد گروه': 50 },
    { 'کد درس': 4107, 'درس': 'آمادگی دفاعی', 'کد رشته استخدامی مجاز': 1005, 'رشته استخدامی مجاز': 'دبیر تربیت بدنی', 'کد گروه': 70 },
    { 'کد درس': 4105, 'درس': 'عربی', 'کد رشته استخدامی مجاز': 1006, 'رشته استخدامی مجاز': 'دبیر عربی', 'کد گروه': 60 },
    { 'کد درس': 4106, 'درس': 'زبان انگلیسی', 'کد رشته استخدامی مجاز': 1007, 'رشته استخدامی مجاز': 'دبیر زبان انگلیسی', 'کد گروه': 60 },
    { 'کد درس': 4301, 'درس': 'مدارهای الکتریکی', 'کد رشته استخدامی مجاز': 1011, 'رشته استخدامی مجاز': 'هنرآموز الکترونیک', 'کد گروه': 80 },
  ]);

  // Sheet 1: Schools
  const s1 = XLSX.utils.json_to_sheet([
    { 'کد مدرسه': 11001, 'نام مدرسه': 'شهید جعفرزاده', 'دوره تحصیلی': 'ابتدایی', 'جنسیت': 'دخترانه', 'محل استقرار': 'شهری', 'منطقه': 'سامان', 'تعداد کلاس': 6, 'تعداد دانش‌آموز': 145, 'رشته': '' },
    { 'کد مدرسه': 12001, 'نام مدرسه': 'فرزانگان', 'دوره تحصیلی': 'متوسطه اول', 'جنسیت': 'دخترانه', 'محل استقرار': 'شهری', 'منطقه': 'سامان', 'تعداد کلاس': 6, 'تعداد دانش‌آموز': 170, 'رشته': '' },
    { 'کد مدرسه': 14001, 'نام مدرسه': 'هنرستان شهید چمران', 'دوره تحصیلی': 'هنرستان', 'جنسیت': 'پسرانه', 'محل استقرار': 'شهری', 'منطقه': 'سامان', 'تعداد کلاس': 4, 'تعداد دانش‌آموز': 80, 'رشته': 'الکترونیک، مکانیک' },
  ]);

  // Sheet 2: Personnel (with major code auto-lookup)
  const s2 = XLSX.utils.json_to_sheet([
    { 'نام': 'فاطمه', 'نام خانوادگی': 'احمدی', 'کد ملی': '4620000000', 'کد پرسنلی': '100001', 'جنسیت': 'زن', 'رشته استخدام / بکارگیری': 'آموزگار ابتدایی', 'کد رشته استخدامی': 1001, 'مدرک تحصیلی': 'لیسانس', 'نوع استخدام': 'رسمی', 'وضعیت': 'فعال', 'سمت': 'معلم', 'سنوات خدمت': 15, 'ساعت موظف': 24 },
    { 'نام': 'حسین', 'نام خانوادگی': 'کریمی', 'کد ملی': '4620000001', 'کد پرسنلی': '100002', 'جنسیت': 'مرد', 'رشته استخدام / بکارگیری': 'دبیر ریاضی', 'کد رشته استخدامی': 1002, 'مدرک تحصیلی': 'لیسانس', 'نوع استخدام': 'رسمی', 'وضعیت': 'فعال', 'سمت': 'معلم', 'سنوات خدمت': 22, 'ساعت موظف': 20 },
    { 'نام': 'محمدرضا', 'نام خانوادگی': 'جعفری', 'کد ملی': '4620000002', 'کد پرسنلی': '100003', 'جنسیت': 'مرد', 'رشته استخدام / بکارگیری': 'مدیریت آموزشی', 'کد رشته استخدامی': 1012, 'مدرک تحصیلی': 'فوق لیسانس', 'نوع استخدام': 'رسمی', 'وضعیت': 'فعال', 'سمت': 'مدیر', 'سنوات خدمت': 25, 'ساعت موظف': 36 },
  ]);

  // Sheet 5: Balance (Traz) with NEW code system (4xxx)
  const s3 = XLSX.utils.json_to_sheet([
    { 'کد مدرسه': 11001, 'نام مدرسه': 'شهید جعفرزاده', 'کد درس': 4001, 'درس': 'پایه اول ابتدایی', 'کد گروه': 10, 'گروه تدریس': 'آموزش ابتدایی', 'پایه': 'اول', 'نوع درس': 'عمومی', 'ساعت کل': 24, 'ابلاغ شده': 0, 'باقیمانده': 24 },
    { 'کد مدرسه': 11001, 'نام مدرسه': 'شهید جعفرزاده', 'کد درس': 4002, 'درس': 'پایه دوم ابتدایی', 'کد گروه': 10, 'گروه تدریس': 'آموزش ابتدایی', 'پایه': 'دوم', 'نوع درس': 'عمومی', 'ساعت کل': 24, 'ابلاغ شده': 0, 'باقیمانده': 24 },
    { 'کد مدرسه': 11001, 'نام مدرسه': 'شهید جعفرزاده', 'کد درس': 4104, 'درس': 'تربیت بدنی', 'کد گروه': 50, 'گروه تدریس': 'تربیت بدنی', 'پایه': 'اول', 'نوع درس': 'تخصصی', 'ساعت کل': 2, 'ابلاغ شده': 0, 'باقیمانده': 2 },
    { 'کد مدرسه': 12001, 'نام مدرسه': 'فرزانگان', 'کد درس': 4101, 'درس': 'ریاضی', 'کد گروه': 20, 'گروه تدریس': 'ریاضی', 'پایه': 'هفتم', 'نوع درس': 'عمومی', 'ساعت کل': 10, 'ابلاغ شده': 0, 'باقیمانده': 10 },
    { 'کد مدرسه': 12001, 'نام مدرسه': 'فرزانگان', 'کد درس': 4102, 'درس': 'فارسی', 'کد گروه': 30, 'گروه تدریس': 'فارسی و ادبیات', 'پایه': 'هفتم', 'نوع درس': 'عمومی', 'ساعت کل': 10, 'ابلاغ شده': 0, 'باقیمانده': 10 },
    { 'کد مدرسه': 12001, 'نام مدرسه': 'فرزانگان', 'کد درس': 4107, 'درس': 'آمادگی دفاعی', 'کد گروه': 70, 'گروه تدریس': 'عمومی', 'پایه': 'هفتم', 'نوع درس': 'عمومی', 'ساعت کل': 2, 'ابلاغ شده': 0, 'باقیمانده': 2 },
    { 'کد مدرسه': 14001, 'نام مدرسه': 'هنرستان شهید چمران', 'کد درس': 4301, 'درس': 'مدارهای الکتریکی', 'کد گروه': 80, 'گروه تدریس': 'فنی و حرفه‌ای', 'پایه': 'دهم', 'نوع درس': 'تخصصی', 'ساعت کل': 6, 'ابلاغ شده': 0, 'باقیمانده': 6 },
  ]);

  // Sheet 4: Schedule (unchanged)
  const s4 = XLSX.utils.json_to_sheet([
    { 'کد مدرسه': 12001, 'مدرسه': 'فرزانگان', 'نام معلم': 'حسین کریمی', 'درس': 'ریاضی', 'پایه': 'هفتم', 'روز هفته': 'شنبه', 'بازه زمانی': '۸:۰۰ تا ۹:۳۰' },
    { 'کد مدرسه': 12001, 'مدرسه': 'فرزانگان', 'نام معلم': 'حسین کریمی', 'درس': 'ریاضی', 'پایه': 'هشتم', 'روز هفته': 'یکشنبه', 'بازه زمانی': '۸:۰۰ تا ۹:۳۰' },
  ]);

  // Sheet 5: Guide
  const s5 = XLSX.utils.json_to_sheet([
    { 'عنوان': '📌 سامانه پایا', 'توضیح': 'ساماندهی نیروی انسانی آموزش و پرورش', 'مثال': '' },
    { 'عنوان': '', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '━━ ۴ شیت مرجع (پایگاه کد) ━━', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '🔵 شیت «رشته استخدامی»', 'توضیح': 'کد ۱۰۰۱ تا ۱۹۹۹. هر رشته شغلی یک کد یکتا. برای نیروها.', 'مثال': '1001 = آموزگار ابتدایی' },
    { 'عنوان': '🟢 شیت «گروه تدریس»', 'توضیح': 'کد ۱۰ تا ۹۹. دسته‌بندی کلی دروس.', 'مثال': '20 = ریاضی' },
    { 'عنوان': '🟡 شیت «درس»', 'توضیح': 'کد ۴۰۰۱ تا ۴۹۹۹. هر درس/پایه یک کد. متصل به گروه.', 'مثال': '4101 = ریاضی' },
    { 'عنوان': '⭐ شیت «صلاحیت تدریس»', 'توضیح': 'قلب سیستم! مشخص می‌کند هر رشته مجاز به تدریس کدام درس است.', 'مثال': '' },
    { 'عنوان': '', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '━━ چگونه درس جدید اضافه کنم؟ ━━', 'توضیح': '', 'مثال': '' },
    { 'عنوان': 'مرحله ۱', 'توضیح': 'در شیت «درس» یک ردیف جدید اضافه کنید (کد ۴۰۰۱-۴۹۹۹)', 'مثال': '4109 = مطالعات اجتماعی' },
    { 'عنوان': 'مرحله ۲', 'توضیح': 'در شیت «صلاحیت تدریس» مشخص کنید چه رشته‌ای مجاز است', 'مثال': '4109 ← 1010 (دبیر تاریخ)' },
    { 'عنوان': 'مرحله ۳', 'توضیح': 'در شیت «تراز ابلاغ» با کد درس ثبت کنید', 'مثال': '' },
    { 'عنوان': '', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '━━ صلاحیت چند درسی ━━', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '❓ یک معلم چند درس؟', 'توضیح': 'در «صلاحیت تدریس» برای هر درس یک ردیف جدا بنویسید', 'مثال': '' },
    { 'عنوان': 'مثال: دبیر علوم (1004)', 'توضیح': 'می‌تواند تدریس کند: علوم(4103) + فیزیک(4201) + شیمی(4202) + زیست(4203) + زمین(4204)', 'مثال': '۵ ردیف در صلاحیت' },
    { 'عنوان': '💡 قاعده طلایی', 'توضیح': 'همه پیوندها فقط با کد عددی! اسم‌ها فقط برای نمایش.', 'مثال': '' },
    { 'عنوان': '', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '━━ شیت مدارس ━━', 'توضیح': '', 'مثال': '' },
    { 'عنوان': 'کد مدرسه', 'توضیح': 'عدد یکتا (از سامانه سیدا)', 'مثال': '11001' },
    { 'عنوان': 'دوره تحصیلی', 'توضیح': 'ابتدایی | متوسطه اول | متوسطه دوم نظری | هنرستان | کاردانش', 'مثال': 'ابتدایی' },
    { 'عنوان': '', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '━━ شیت نیروها ━━', 'توضیح': '', 'مثال': '' },
    { 'عنوان': 'رشته استخدام / بکارگیری', 'توضیح': 'از شیت «رشته استخدامی» انتخاب کنید', 'مثال': 'آموزگار ابتدایی' },
    { 'عنوان': 'کد رشته استخدامی', 'توضیح': 'کد عددی از شیت مرجع. کد = منبع حقیقت', 'مثال': '1001' },
    { 'عنوان': 'ساعت موظف', 'توضیح': 'معلم:۲۴ | تقلیل(≥۲۰سال):۲۰ | مدیر/معاون:۳۶ | خدمتگزار:۴۴', 'مثال': '24' },
    { 'عنوان': '', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '━━ شیت تراز ابلاغ ⭐ ━━', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '⚠️ مهم‌ترین شیت', 'توضیح': 'نیاز هر مدرسه به هر درس. سامانه از اینجا می‌خواند.', 'مثال': '' },
    { 'عنوان': 'کد درس', 'توضیح': 'کد ۴ رقمی از شیت «درس» (۴۰۰۱-۴۹۹۹)', 'مثال': '4101 = ریاضی' },
    { 'عنوان': 'کد گروه', 'توضیح': 'کد ۲ رقمی از شیت «گروه تدریس» (۱۰-۹۹)', 'مثال': '20 = ریاضی' },
    { 'عنوان': 'ساعت کل', 'توضیح': 'ساعت هفتگی تراز = تعداد کلاس × ساعت استاندارد', 'مثال': '2 کلاس × 5 = 10' },
    { 'عنوان': '', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '━━ محاسبه کمبود/مازاد نیرو ━━', 'توضیح': '', 'مثال': '' },
    { 'عنوان': 'نیاز منطقه', 'توضیح': 'جمع ساعت کل تراز هر گروه تدریس', 'مثال': 'ریاضی: 50 ساعت' },
    { 'عنوان': 'ظرفیت نیرو', 'توضیح': 'جمع ساعت موظف نیروهای مجاز (از صلاحیت تدریس)', 'مثال': '2 دبیر × 24 = 48' },
    { 'عنوان': 'تراز', 'توضیح': 'ظرفیت - نیاز. منفی=کمبود | صفر=متوازن | مثبت=مازاد', 'مثال': '48-50 = -2 (کمبود)' },
    { 'عنوان': 'معادل نفر', 'توضیح': 'تراز ÷ 24 = تعداد نیرو', 'مثال': '-2÷24 = -0.1 نفر' },
    { 'عنوان': '', 'توضیح': '', 'مثال': '' },
    { 'عنوان': '━━ شیت برنامه هفتگی ━━', 'توضیح': '', 'مثال': '' },
    { 'عنوان': 'اختیاری', 'توضیح': 'برنامه حضور معلمان. این شیت تغییر نمی‌کند.', 'مثال': '' },
    { 'عنوان': 'روز هفته', 'توضیح': 'شنبه | یکشنبه | دوشنبه | سه‌شنبه | چهارشنبه', 'مثال': 'شنبه' },
  ]);

  sRef1['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 18 }];
  sRef2['!cols'] = [{ wch: 10 }, { wch: 22 }];
  sRef3['!cols'] = [{ wch: 10 }, { wch: 24 }, { wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 16 }];
  sRef4['!cols'] = [{ wch: 10 }, { wch: 24 }, { wch: 20 }, { wch: 28 }, { wch: 10 }];
  s1['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 28 }];
  s2['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];
  s3['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  s4['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 18 }];
  s5['!cols'] = [{ wch: 30 }, { wch: 75 }, { wch: 28 }];

  XLSX.utils.book_append_sheet(wb, sRef1, 'رشته استخدامی');
  XLSX.utils.book_append_sheet(wb, sRef2, 'گروه تدریس');
  XLSX.utils.book_append_sheet(wb, sRef3, 'درس');
  XLSX.utils.book_append_sheet(wb, sRef4, 'صلاحیت تدریس');
  XLSX.utils.book_append_sheet(wb, s1, 'مدارس');
  XLSX.utils.book_append_sheet(wb, s2, 'نیروها');
  XLSX.utils.book_append_sheet(wb, s3, 'تراز ابلاغ');
  XLSX.utils.book_append_sheet(wb, s4, 'برنامه هفتگی');
  XLSX.utils.book_append_sheet(wb, s5, 'راهنما');

  XLSX.writeFile(wb, 'قالب_پایا.xlsx');
}
