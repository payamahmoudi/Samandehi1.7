// ━━━━━━━━ دادهٔ پایهٔ سامانه (Seed) ━━━━━━━━
// این فایل به‌صورت خودکار از فایل اکسل «قالب ساماندهی نیرو ۱۴۰۶-۱۴۰۵» ساخته شده است.
// برای به‌روزرسانی، از بخش «ورود/خروج» داخل سامانه فایل اکسل جدید را Import کنید.
import { School, Personnel, SubjectRequirement, BalanceRecord, ScheduleEntry } from '../types';
import type { ReferenceData } from '../utils/excelImport';

export const sampleSchools: School[] = [
  {
    "id": "s1",
    "code": "11001",
    "name": "شهید جعفرزاده",
    "type": "ابتدایی",
    "gender": "دخترانه",
    "location": "شهری",
    "region": "سامان",
    "classCount": 6,
    "studentCount": 145,
    "grades": [
      {
        "grade": "اول",
        "classCount": 1,
        "studentCount": 25
      },
      {
        "grade": "دوم",
        "classCount": 1,
        "studentCount": 25
      },
      {
        "grade": "سوم",
        "classCount": 1,
        "studentCount": 25
      },
      {
        "grade": "چهارم",
        "classCount": 1,
        "studentCount": 25
      },
      {
        "grade": "پنجم",
        "classCount": 1,
        "studentCount": 25
      },
      {
        "grade": "ششم",
        "classCount": 1,
        "studentCount": 25
      }
    ],
    "needsManager": true,
    "needsAssistant": true
  },
  {
    "id": "s2",
    "code": "11002",
    "name": "امام خمینی",
    "type": "ابتدایی",
    "gender": "پسرانه",
    "location": "روستایی",
    "region": "چلیچه",
    "classCount": 4,
    "studentCount": 90,
    "grades": [
      {
        "grade": "اول",
        "classCount": 1,
        "studentCount": 15
      },
      {
        "grade": "دوم",
        "classCount": 1,
        "studentCount": 15
      },
      {
        "grade": "سوم",
        "classCount": 1,
        "studentCount": 15
      },
      {
        "grade": "چهارم",
        "classCount": 1,
        "studentCount": 15
      },
      {
        "grade": "پنجم",
        "classCount": 1,
        "studentCount": 15
      },
      {
        "grade": "ششم",
        "classCount": 1,
        "studentCount": 15
      }
    ],
    "needsManager": true,
    "needsAssistant": false
  },
  {
    "id": "s3",
    "code": "12001",
    "name": "فرزانگان",
    "type": "متوسطه اول",
    "gender": "دخترانه",
    "location": "شهری",
    "region": "سامان",
    "classCount": 6,
    "studentCount": 170,
    "grades": [
      {
        "grade": "هفتم",
        "classCount": 2,
        "studentCount": 57
      },
      {
        "grade": "هشتم",
        "classCount": 2,
        "studentCount": 57
      },
      {
        "grade": "نهم",
        "classCount": 2,
        "studentCount": 57
      }
    ],
    "needsManager": true,
    "needsAssistant": true
  },
  {
    "id": "s4",
    "code": "13001",
    "name": "شهید بهشتی",
    "type": "متوسطه دوم نظری",
    "gender": "پسرانه",
    "location": "شهری",
    "region": "سامان",
    "classCount": 9,
    "studentCount": 220,
    "grades": [
      {
        "grade": "دهم",
        "classCount": 3,
        "studentCount": 74
      },
      {
        "grade": "یازدهم",
        "classCount": 3,
        "studentCount": 74
      },
      {
        "grade": "دوازدهم",
        "classCount": 3,
        "studentCount": 74
      }
    ],
    "needsManager": true,
    "needsAssistant": true
  },
  {
    "id": "s5",
    "code": "14001",
    "name": "هنرستان شهید چمران",
    "type": "هنرستان",
    "gender": "پسرانه",
    "location": "شهری",
    "region": "سامان",
    "classCount": 4,
    "studentCount": 80,
    "grades": [
      {
        "grade": "دهم",
        "classCount": 2,
        "studentCount": 27
      },
      {
        "grade": "یازدهم",
        "classCount": 2,
        "studentCount": 27
      },
      {
        "grade": "دوازدهم",
        "classCount": 2,
        "studentCount": 27
      }
    ],
    "needsManager": true,
    "needsAssistant": false,
    "fields": [
      "الکترونیک، مکانیک"
    ]
  }
];

export const samplePersonnel: Personnel[] = [
  {
    "id": "p1",
    "firstName": "فاطمه",
    "lastName": "احمدی",
    "nationalCode": "4620000001",
    "gender": "زن",
    "field": "آموزگار ابتدایی",
    "degree": "لیسانس",
    "employmentType": "رسمی",
    "status": "فعال",
    "maxHours": 24,
    "assignedHours": 0,
    "nonMandatoryHours": 0,
    "isLocked": false,
    "assignments": [],
    "role": "معلم",
    "personnelCode": "100001",
    "serviceYears": 15,
    "reducedHours": false
  },
  {
    "id": "p2",
    "firstName": "حسین",
    "lastName": "کریمی",
    "nationalCode": "4620000002",
    "gender": "مرد",
    "field": "دبیر ریاضی",
    "degree": "لیسانس",
    "employmentType": "رسمی",
    "status": "فعال",
    "maxHours": 24,
    "assignedHours": 0,
    "nonMandatoryHours": 0,
    "isLocked": false,
    "assignments": [],
    "role": "معلم",
    "personnelCode": "100002",
    "serviceYears": 22,
    "reducedHours": true
  },
  {
    "id": "p3",
    "firstName": "زهرا",
    "lastName": "موسوی",
    "nationalCode": "4620000003",
    "gender": "زن",
    "field": "دبیر ادبیات فارسی",
    "degree": "فوق لیسانس",
    "employmentType": "رسمی",
    "status": "فعال",
    "maxHours": 24,
    "assignedHours": 0,
    "nonMandatoryHours": 0,
    "isLocked": false,
    "assignments": [],
    "role": "معلم",
    "personnelCode": "100003",
    "serviceYears": 10,
    "reducedHours": false
  },
  {
    "id": "p4",
    "firstName": "علی",
    "lastName": "رضایی",
    "nationalCode": "4620000004",
    "gender": "مرد",
    "field": "دبیر علوم تجربی",
    "degree": "لیسانس",
    "employmentType": "پیمانی",
    "status": "فعال",
    "maxHours": 24,
    "assignedHours": 0,
    "nonMandatoryHours": 0,
    "isLocked": false,
    "assignments": [],
    "role": "معلم",
    "personnelCode": "100004",
    "serviceYears": 6,
    "reducedHours": false
  },
  {
    "id": "p5",
    "firstName": "مریم",
    "lastName": "نوری",
    "nationalCode": "4620000005",
    "gender": "زن",
    "field": "دبیر زبان انگلیسی",
    "degree": "لیسانس",
    "employmentType": "رسمی",
    "status": "فعال",
    "maxHours": 24,
    "assignedHours": 0,
    "nonMandatoryHours": 0,
    "isLocked": false,
    "assignments": [],
    "role": "معلم",
    "personnelCode": "100005",
    "serviceYears": 18,
    "reducedHours": false
  },
  {
    "id": "p6",
    "firstName": "محمد",
    "lastName": "جعفری",
    "nationalCode": "4620000006",
    "gender": "مرد",
    "field": "هنرآموز الکترونیک",
    "degree": "لیسانس",
    "employmentType": "رسمی",
    "status": "فعال",
    "maxHours": 24,
    "assignedHours": 0,
    "nonMandatoryHours": 0,
    "isLocked": false,
    "assignments": [],
    "role": "معلم",
    "personnelCode": "100006",
    "serviceYears": 12,
    "reducedHours": false
  },
  {
    "id": "p7",
    "firstName": "سعید",
    "lastName": "عباسی",
    "nationalCode": "4620000007",
    "gender": "مرد",
    "field": "مدیریت آموزشی",
    "degree": "فوق لیسانس",
    "employmentType": "رسمی",
    "status": "فعال",
    "maxHours": 36,
    "assignedHours": 0,
    "nonMandatoryHours": 0,
    "isLocked": false,
    "assignments": [],
    "role": "مدیر",
    "personnelCode": "100007",
    "serviceYears": 25,
    "reducedHours": true
  }
];

export const sampleBalanceRecords: BalanceRecord[] = [
  {
    "schoolId": "11001",
    "schoolName": "شهید جعفرزاده",
    "subject": "پایه اول ابتدایی",
    "grade": "اول",
    "totalHours": 24,
    "assignedHours": 0,
    "remainingHours": 24,
    "category": "عمومی"
  },
  {
    "schoolId": "11001",
    "schoolName": "شهید جعفرزاده",
    "subject": "پایه دوم ابتدایی",
    "grade": "دوم",
    "totalHours": 24,
    "assignedHours": 24,
    "remainingHours": 0,
    "category": "عمومی"
  },
  {
    "schoolId": "11001",
    "schoolName": "شهید جعفرزاده",
    "subject": "تربیت بدنی",
    "grade": "ابتدایی",
    "totalHours": 2,
    "assignedHours": 0,
    "remainingHours": 2,
    "category": "تخصصی"
  },
  {
    "schoolId": "12001",
    "schoolName": "فرزانگان",
    "subject": "ریاضی",
    "grade": "هفتم",
    "totalHours": 16,
    "assignedHours": 10,
    "remainingHours": 6,
    "category": "عمومی"
  },
  {
    "schoolId": "12001",
    "schoolName": "فرزانگان",
    "subject": "ادبیات فارسی",
    "grade": "هفتم",
    "totalHours": 20,
    "assignedHours": 20,
    "remainingHours": 0,
    "category": "عمومی"
  },
  {
    "schoolId": "12001",
    "schoolName": "فرزانگان",
    "subject": "علوم تجربی",
    "grade": "هفتم",
    "totalHours": 16,
    "assignedHours": 0,
    "remainingHours": 16,
    "category": "عمومی"
  },
  {
    "schoolId": "13001",
    "schoolName": "شهید بهشتی",
    "subject": "فیزیک",
    "grade": "دهم",
    "totalHours": 12,
    "assignedHours": 0,
    "remainingHours": 12,
    "category": "تخصصی"
  },
  {
    "schoolId": "13001",
    "schoolName": "شهید بهشتی",
    "subject": "دین و زندگی",
    "grade": "دهم",
    "totalHours": 8,
    "assignedHours": 8,
    "remainingHours": 0,
    "category": "عمومی"
  },
  {
    "schoolId": "14001",
    "schoolName": "هنرستان شهید چمران",
    "subject": "مدارهای الکتریکی",
    "grade": "دهم",
    "totalHours": 18,
    "assignedHours": 6,
    "remainingHours": 12,
    "category": "تخصصی"
  },
  {
    "schoolId": "14001",
    "schoolName": "هنرستان شهید چمران",
    "subject": "رسم فنی مکانیک",
    "grade": "دهم",
    "totalHours": 12,
    "assignedHours": 0,
    "remainingHours": 12,
    "category": "تخصصی"
  }
];

export const sampleSubjectRequirements: SubjectRequirement[] = [
  {
    "subject": "پایه اول ابتدایی",
    "grade": "اول",
    "hoursPerWeek": 24,
    "requiredTeacherField": "پایه اول ابتدایی",
    "category": "عمومی"
  },
  {
    "subject": "پایه دوم ابتدایی",
    "grade": "دوم",
    "hoursPerWeek": 24,
    "requiredTeacherField": "پایه دوم ابتدایی",
    "category": "عمومی"
  },
  {
    "subject": "تربیت بدنی",
    "grade": "ابتدایی",
    "hoursPerWeek": 2,
    "requiredTeacherField": "تربیت بدنی",
    "category": "تخصصی"
  },
  {
    "subject": "ریاضی",
    "grade": "هفتم",
    "hoursPerWeek": 8,
    "requiredTeacherField": "ریاضی",
    "category": "عمومی"
  },
  {
    "subject": "ادبیات فارسی",
    "grade": "هفتم",
    "hoursPerWeek": 10,
    "requiredTeacherField": "ادبیات فارسی",
    "category": "عمومی"
  },
  {
    "subject": "علوم تجربی",
    "grade": "هفتم",
    "hoursPerWeek": 8,
    "requiredTeacherField": "علوم تجربی",
    "category": "عمومی"
  },
  {
    "subject": "فیزیک",
    "grade": "دهم",
    "hoursPerWeek": 4,
    "requiredTeacherField": "فیزیک",
    "category": "تخصصی"
  },
  {
    "subject": "دین و زندگی",
    "grade": "دهم",
    "hoursPerWeek": 3,
    "requiredTeacherField": "دین و زندگی",
    "category": "عمومی"
  },
  {
    "subject": "مدارهای الکتریکی",
    "grade": "دهم",
    "hoursPerWeek": 9,
    "requiredTeacherField": "مدارهای الکتریکی",
    "category": "تخصصی"
  },
  {
    "subject": "رسم فنی مکانیک",
    "grade": "دهم",
    "hoursPerWeek": 6,
    "requiredTeacherField": "رسم فنی مکانیک",
    "category": "تخصصی"
  }
];

export const sampleScheduleEntries: ScheduleEntry[] = [
  {
    "id": "sch1",
    "schoolId": "12001",
    "schoolName": "فرزانگان",
    "personnelId": "",
    "personnelName": "حسین کریمی",
    "subject": "ریاضی",
    "grade": "هفتم",
    "day": "شنبه",
    "time": "۸:۰۰ تا ۹:۳۰"
  },
  {
    "id": "sch2",
    "schoolId": "12001",
    "schoolName": "فرزانگان",
    "personnelId": "",
    "personnelName": "حسین کریمی",
    "subject": "ریاضی",
    "grade": "هشتم",
    "day": "یکشنبه",
    "time": "۸:۰۰ تا ۹:۳۰"
  }
];

export const sampleReferenceData: ReferenceData = {
  "majors": [
    {
      "code": 1001,
      "name": "آموزگار ابتدایی",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1002,
      "name": "دبیر ریاضی",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1003,
      "name": "دبیر فیزیک",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1004,
      "name": "دبیر شیمی",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1005,
      "name": "دبیر زیست‌شناسی",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1006,
      "name": "دبیر علوم تجربی",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1007,
      "name": "دبیر ادبیات فارسی",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1008,
      "name": "دبیر عربی",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1009,
      "name": "دبیر زبان انگلیسی",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1010,
      "name": "دبیر علوم اجتماعی (تاریخ/جغرافیا)",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1011,
      "name": "دبیر معارف اسلامی (دینی)",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1012,
      "name": "دبیر تربیت بدنی",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1013,
      "name": "هنرآموز الکترونیک",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1014,
      "name": "هنرآموز مکانیک",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1015,
      "name": "هنرآموز کامپیوتر",
      "group": "معلم",
      "defaultHours": 24
    },
    {
      "code": 1016,
      "name": "مربی پرورشی",
      "group": "مربی",
      "defaultHours": 24
    },
    {
      "code": 1017,
      "name": "مشاور",
      "group": "مشاور",
      "defaultHours": 24
    },
    {
      "code": 1018,
      "name": "مربی بهداشت",
      "group": "مربی",
      "defaultHours": 24
    },
    {
      "code": 1019,
      "name": "مدیریت آموزشی",
      "group": "مدیر/معاون",
      "defaultHours": 36
    },
    {
      "code": 1020,
      "name": "دبیر آمادگی دفاعی",
      "group": "معلم",
      "defaultHours": 24
    }
  ],
  "groups": [
    {
      "code": 10,
      "name": "آموزش ابتدایی"
    },
    {
      "code": 20,
      "name": "ریاضی"
    },
    {
      "code": 21,
      "name": "فیزیک"
    },
    {
      "code": 22,
      "name": "شیمی"
    },
    {
      "code": 23,
      "name": "زیست‌شناسی"
    },
    {
      "code": 30,
      "name": "ادبیات فارسی"
    },
    {
      "code": 31,
      "name": "عربی"
    },
    {
      "code": 32,
      "name": "زبان انگلیسی"
    },
    {
      "code": 33,
      "name": "مطالعات/تاریخ/جغرافیا"
    },
    {
      "code": 34,
      "name": "دینی و قرآن"
    },
    {
      "code": 40,
      "name": "علوم تجربی (متوسطه اول)"
    },
    {
      "code": 50,
      "name": "تربیت بدنی"
    },
    {
      "code": 60,
      "name": "هنر"
    },
    {
      "code": 70,
      "name": "پرورشی و مشاوره"
    },
    {
      "code": 80,
      "name": "فنی - برق و الکترونیک"
    },
    {
      "code": 81,
      "name": "فنی - مکانیک"
    },
    {
      "code": 82,
      "name": "فنی - کامپیوتر"
    },
    {
      "code": 90,
      "name": "عمومی و سایر"
    }
  ],
  "lessons": [
    {
      "code": 4001,
      "name": "پایه اول ابتدایی",
      "groupCode": 10,
      "groupName": "آموزش ابتدایی",
      "period": "ابتدایی",
      "stdHours": 24
    },
    {
      "code": 4002,
      "name": "پایه دوم ابتدایی",
      "groupCode": 10,
      "groupName": "آموزش ابتدایی",
      "period": "ابتدایی",
      "stdHours": 24
    },
    {
      "code": 4003,
      "name": "پایه سوم ابتدایی",
      "groupCode": 10,
      "groupName": "آموزش ابتدایی",
      "period": "ابتدایی",
      "stdHours": 24
    },
    {
      "code": 4004,
      "name": "پایه چهارم ابتدایی",
      "groupCode": 10,
      "groupName": "آموزش ابتدایی",
      "period": "ابتدایی",
      "stdHours": 24
    },
    {
      "code": 4005,
      "name": "پایه پنجم ابتدایی",
      "groupCode": 10,
      "groupName": "آموزش ابتدایی",
      "period": "ابتدایی",
      "stdHours": 24
    },
    {
      "code": 4006,
      "name": "پایه ششم ابتدایی",
      "groupCode": 10,
      "groupName": "آموزش ابتدایی",
      "period": "ابتدایی",
      "stdHours": 24
    },
    {
      "code": 4007,
      "name": "چندپایه ابتدایی",
      "groupCode": 10,
      "groupName": "آموزش ابتدایی",
      "period": "ابتدایی",
      "stdHours": 24
    },
    {
      "code": 4101,
      "name": "ریاضی",
      "groupCode": 20,
      "groupName": "ریاضی",
      "period": "متوسطه اول",
      "stdHours": 4
    },
    {
      "code": 4102,
      "name": "فیزیک",
      "groupCode": 21,
      "groupName": "فیزیک",
      "period": "متوسطه دوم",
      "stdHours": 3
    },
    {
      "code": 4103,
      "name": "شیمی",
      "groupCode": 22,
      "groupName": "شیمی",
      "period": "متوسطه دوم",
      "stdHours": 3
    },
    {
      "code": 4104,
      "name": "زیست‌شناسی",
      "groupCode": 23,
      "groupName": "زیست‌شناسی",
      "period": "متوسطه دوم",
      "stdHours": 3
    },
    {
      "code": 4105,
      "name": "علوم تجربی",
      "groupCode": 40,
      "groupName": "علوم تجربی (متوسطه اول)",
      "period": "متوسطه اول",
      "stdHours": 4
    },
    {
      "code": 4106,
      "name": "ادبیات فارسی",
      "groupCode": 30,
      "groupName": "ادبیات فارسی",
      "period": "متوسطه اول",
      "stdHours": 5
    },
    {
      "code": 4107,
      "name": "عربی",
      "groupCode": 31,
      "groupName": "عربی",
      "period": "متوسطه اول",
      "stdHours": 2
    },
    {
      "code": 4108,
      "name": "زبان انگلیسی",
      "groupCode": 32,
      "groupName": "زبان انگلیسی",
      "period": "متوسطه اول",
      "stdHours": 3
    },
    {
      "code": 4109,
      "name": "مطالعات اجتماعی",
      "groupCode": 33,
      "groupName": "مطالعات/تاریخ/جغرافیا",
      "period": "متوسطه اول",
      "stdHours": 3
    },
    {
      "code": 4110,
      "name": "تاریخ",
      "groupCode": 33,
      "groupName": "مطالعات/تاریخ/جغرافیا",
      "period": "متوسطه دوم",
      "stdHours": 2
    },
    {
      "code": 4111,
      "name": "جغرافیا",
      "groupCode": 33,
      "groupName": "مطالعات/تاریخ/جغرافیا",
      "period": "متوسطه دوم",
      "stdHours": 2
    },
    {
      "code": 4112,
      "name": "دین و زندگی",
      "groupCode": 34,
      "groupName": "دینی و قرآن",
      "period": "متوسطه دوم",
      "stdHours": 2
    },
    {
      "code": 4113,
      "name": "تربیت بدنی",
      "groupCode": 50,
      "groupName": "تربیت بدنی",
      "period": "عمومی",
      "stdHours": 2
    },
    {
      "code": 4114,
      "name": "آمادگی دفاعی",
      "groupCode": 90,
      "groupName": "عمومی و سایر",
      "period": "متوسطه دوم",
      "stdHours": 2
    },
    {
      "code": 4115,
      "name": "هنر",
      "groupCode": 60,
      "groupName": "هنر",
      "period": "متوسطه اول",
      "stdHours": 1
    },
    {
      "code": 4116,
      "name": "تفکر و سبک زندگی",
      "groupCode": 90,
      "groupName": "عمومی و سایر",
      "period": "متوسطه اول",
      "stdHours": 1
    },
    {
      "code": 4117,
      "name": "کار و فناوری",
      "groupCode": 90,
      "groupName": "عمومی و سایر",
      "period": "متوسطه اول",
      "stdHours": 2
    },
    {
      "code": 4201,
      "name": "مدارهای الکتریکی",
      "groupCode": 80,
      "groupName": "فنی - برق و الکترونیک",
      "period": "هنرستان",
      "stdHours": 6
    },
    {
      "code": 4202,
      "name": "الکترونیک عمومی",
      "groupCode": 80,
      "groupName": "فنی - برق و الکترونیک",
      "period": "هنرستان",
      "stdHours": 6
    },
    {
      "code": 4203,
      "name": "رسم فنی مکانیک",
      "groupCode": 81,
      "groupName": "فنی - مکانیک",
      "period": "هنرستان",
      "stdHours": 6
    },
    {
      "code": 4204,
      "name": "مبانی کامپیوتر",
      "groupCode": 82,
      "groupName": "فنی - کامپیوتر",
      "period": "هنرستان",
      "stdHours": 4
    }
  ],
  "qualifications": [
    {
      "lessonCode": 4001,
      "lessonName": "پایه اول ابتدایی",
      "majorCode": 1001,
      "majorName": "آموزگار ابتدایی",
      "groupCode": 10
    },
    {
      "lessonCode": 4002,
      "lessonName": "پایه دوم ابتدایی",
      "majorCode": 1001,
      "majorName": "آموزگار ابتدایی",
      "groupCode": 10
    },
    {
      "lessonCode": 4003,
      "lessonName": "پایه سوم ابتدایی",
      "majorCode": 1001,
      "majorName": "آموزگار ابتدایی",
      "groupCode": 10
    },
    {
      "lessonCode": 4004,
      "lessonName": "پایه چهارم ابتدایی",
      "majorCode": 1001,
      "majorName": "آموزگار ابتدایی",
      "groupCode": 10
    },
    {
      "lessonCode": 4005,
      "lessonName": "پایه پنجم ابتدایی",
      "majorCode": 1001,
      "majorName": "آموزگار ابتدایی",
      "groupCode": 10
    },
    {
      "lessonCode": 4006,
      "lessonName": "پایه ششم ابتدایی",
      "majorCode": 1001,
      "majorName": "آموزگار ابتدایی",
      "groupCode": 10
    },
    {
      "lessonCode": 4007,
      "lessonName": "چندپایه ابتدایی",
      "majorCode": 1001,
      "majorName": "آموزگار ابتدایی",
      "groupCode": 10
    },
    {
      "lessonCode": 4101,
      "lessonName": "ریاضی",
      "majorCode": 1002,
      "majorName": "دبیر ریاضی",
      "groupCode": 20
    },
    {
      "lessonCode": 4101,
      "lessonName": "ریاضی",
      "majorCode": 1003,
      "majorName": "دبیر فیزیک",
      "groupCode": 20
    },
    {
      "lessonCode": 4102,
      "lessonName": "فیزیک",
      "majorCode": 1003,
      "majorName": "دبیر فیزیک",
      "groupCode": 21
    },
    {
      "lessonCode": 4102,
      "lessonName": "فیزیک",
      "majorCode": 1002,
      "majorName": "دبیر ریاضی",
      "groupCode": 21
    },
    {
      "lessonCode": 4103,
      "lessonName": "شیمی",
      "majorCode": 1004,
      "majorName": "دبیر شیمی",
      "groupCode": 22
    },
    {
      "lessonCode": 4103,
      "lessonName": "شیمی",
      "majorCode": 1006,
      "majorName": "دبیر علوم تجربی",
      "groupCode": 22
    },
    {
      "lessonCode": 4104,
      "lessonName": "زیست‌شناسی",
      "majorCode": 1005,
      "majorName": "دبیر زیست‌شناسی",
      "groupCode": 23
    },
    {
      "lessonCode": 4104,
      "lessonName": "زیست‌شناسی",
      "majorCode": 1006,
      "majorName": "دبیر علوم تجربی",
      "groupCode": 23
    },
    {
      "lessonCode": 4105,
      "lessonName": "علوم تجربی",
      "majorCode": 1006,
      "majorName": "دبیر علوم تجربی",
      "groupCode": 40
    },
    {
      "lessonCode": 4105,
      "lessonName": "علوم تجربی",
      "majorCode": 1004,
      "majorName": "دبیر شیمی",
      "groupCode": 40
    },
    {
      "lessonCode": 4105,
      "lessonName": "علوم تجربی",
      "majorCode": 1005,
      "majorName": "دبیر زیست‌شناسی",
      "groupCode": 40
    },
    {
      "lessonCode": 4106,
      "lessonName": "ادبیات فارسی",
      "majorCode": 1007,
      "majorName": "دبیر ادبیات فارسی",
      "groupCode": 30
    },
    {
      "lessonCode": 4107,
      "lessonName": "عربی",
      "majorCode": 1008,
      "majorName": "دبیر عربی",
      "groupCode": 31
    },
    {
      "lessonCode": 4107,
      "lessonName": "عربی",
      "majorCode": 1011,
      "majorName": "دبیر معارف اسلامی (دینی)",
      "groupCode": 31
    },
    {
      "lessonCode": 4108,
      "lessonName": "زبان انگلیسی",
      "majorCode": 1009,
      "majorName": "دبیر زبان انگلیسی",
      "groupCode": 32
    },
    {
      "lessonCode": 4109,
      "lessonName": "مطالعات اجتماعی",
      "majorCode": 1010,
      "majorName": "دبیر علوم اجتماعی (تاریخ/جغرافیا)",
      "groupCode": 33
    },
    {
      "lessonCode": 4109,
      "lessonName": "مطالعات اجتماعی",
      "majorCode": 1011,
      "majorName": "دبیر معارف اسلامی (دینی)",
      "groupCode": 33
    },
    {
      "lessonCode": 4110,
      "lessonName": "تاریخ",
      "majorCode": 1010,
      "majorName": "دبیر علوم اجتماعی (تاریخ/جغرافیا)",
      "groupCode": 33
    },
    {
      "lessonCode": 4111,
      "lessonName": "جغرافیا",
      "majorCode": 1010,
      "majorName": "دبیر علوم اجتماعی (تاریخ/جغرافیا)",
      "groupCode": 33
    },
    {
      "lessonCode": 4112,
      "lessonName": "دین و زندگی",
      "majorCode": 1011,
      "majorName": "دبیر معارف اسلامی (دینی)",
      "groupCode": 34
    },
    {
      "lessonCode": 4113,
      "lessonName": "تربیت بدنی",
      "majorCode": 1012,
      "majorName": "دبیر تربیت بدنی",
      "groupCode": 50
    },
    {
      "lessonCode": 4114,
      "lessonName": "آمادگی دفاعی",
      "majorCode": 1012,
      "majorName": "دبیر تربیت بدنی",
      "groupCode": 90
    },
    {
      "lessonCode": 4114,
      "lessonName": "آمادگی دفاعی",
      "majorCode": 1010,
      "majorName": "دبیر علوم اجتماعی (تاریخ/جغرافیا)",
      "groupCode": 90
    },
    {
      "lessonCode": 4115,
      "lessonName": "هنر",
      "majorCode": 1016,
      "majorName": "مربی پرورشی",
      "groupCode": 60
    },
    {
      "lessonCode": 4116,
      "lessonName": "تفکر و سبک زندگی",
      "majorCode": 1016,
      "majorName": "مربی پرورشی",
      "groupCode": 90
    },
    {
      "lessonCode": 4116,
      "lessonName": "تفکر و سبک زندگی",
      "majorCode": 1017,
      "majorName": "مشاور",
      "groupCode": 90
    },
    {
      "lessonCode": 4117,
      "lessonName": "کار و فناوری",
      "majorCode": 1015,
      "majorName": "هنرآموز کامپیوتر",
      "groupCode": 90
    },
    {
      "lessonCode": 4117,
      "lessonName": "کار و فناوری",
      "majorCode": 1013,
      "majorName": "هنرآموز الکترونیک",
      "groupCode": 90
    },
    {
      "lessonCode": 4201,
      "lessonName": "مدارهای الکتریکی",
      "majorCode": 1013,
      "majorName": "هنرآموز الکترونیک",
      "groupCode": 80
    },
    {
      "lessonCode": 4202,
      "lessonName": "الکترونیک عمومی",
      "majorCode": 1013,
      "majorName": "هنرآموز الکترونیک",
      "groupCode": 80
    },
    {
      "lessonCode": 4203,
      "lessonName": "رسم فنی مکانیک",
      "majorCode": 1014,
      "majorName": "هنرآموز مکانیک",
      "groupCode": 81
    },
    {
      "lessonCode": 4204,
      "lessonName": "مبانی کامپیوتر",
      "majorCode": 1015,
      "majorName": "هنرآموز کامپیوتر",
      "groupCode": 82
    }
  ],
  "errors": []
};
