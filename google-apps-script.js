/**
 * Google Apps Script for Landing Page
 *
 * Features:
 * 1. GET: Fetch course schedules from "일정" sheet
 * 2. POST: Save lead data to "리드" sheet + increment enrollment
 *
 * Setup Instructions:
 * 1. Create a new Google Sheet with two sheets:
 *    - "일정" (Schedule): 강의ID, 강의명, 날짜, 시간, 신청자수, 정원, 상태
 *    - "리드" (Leads): 타임스탬프, 이름, 연락처, 회사명, 선택강의, 주관식응답
 *
 * 2. Open Script Editor: Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy: Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL to config.js
 */

// Sheet names
const SCHEDULE_SHEET = '일정';
const LEADS_SHEET = '리드';

/**
 * Handle GET requests - Return schedule data
 */
function doGet(e) {
  try {
    const schedules = getSchedules();

    return ContentService
      .createTextOutput(JSON.stringify(schedules))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - Save lead and update enrollment
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Save lead to sheet
    saveLead(data);

    // Increment enrollment count if course selected
    if (data.course && data.course !== 'GENERAL') {
      incrementEnrollment(data.course);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all schedules from the "일정" sheet
 */
function getSchedules() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SCHEDULE_SHEET);

  if (!sheet) {
    throw new Error('Schedule sheet not found');
  }

  const data = sheet.getDataRange().getValues();

  // Skip header row
  const schedules = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Skip empty rows
    if (!row[0]) continue;

    schedules.push({
      id: row[0],        // 강의ID
      name: row[1],      // 강의명
      date: row[2],      // 날짜
      time: row[3],      // 시간
      enrolled: row[4] || 0,  // 신청자수
      capacity: row[5] || 20, // 정원
      status: row[6] || '모집중'  // 상태
    });
  }

  return schedules;
}

/**
 * Save lead data to the "리드" sheet
 */
function saveLead(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(LEADS_SHEET);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(LEADS_SHEET);
    sheet.appendRow(['타임스탬프', '이름', '연락처', '회사명', '선택강의', '주관식응답']);
  }

  // Get course name from ID
  const courseName = getCourseNameById(data.course);

  // Append the lead data
  sheet.appendRow([
    new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    data.name || '',
    data.phone || '',
    data.company || '',
    courseName || data.course || '',
    data.message || ''
  ]);

  // Send email notification (optional)
  sendNotificationEmail(data, courseName);
}

/**
 * Increment enrollment count for a course
 */
function incrementEnrollment(courseId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SCHEDULE_SHEET);

  if (!sheet) return;

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === courseId) {
      // Column E (index 4) is enrollment count
      const currentCount = data[i][4] || 0;
      sheet.getRange(i + 1, 5).setValue(currentCount + 1);

      // Check if course is now full
      const capacity = data[i][5] || 20;
      if (currentCount + 1 >= capacity) {
        // Update status to "마감"
        sheet.getRange(i + 1, 7).setValue('마감');
      }

      break;
    }
  }
}

/**
 * Get course name by ID
 */
function getCourseNameById(courseId) {
  if (!courseId || courseId === 'GENERAL') {
    return '일정 상관없이 상담';
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SCHEDULE_SHEET);

  if (!sheet) return courseId;

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === courseId) {
      return data[i][1]; // Return course name
    }
  }

  return courseId;
}

/**
 * Send email notification when new lead is received
 * Configure your email in the EMAIL_TO constant
 */
function sendNotificationEmail(data, courseName) {
  // Set your notification email here
  const EMAIL_TO = ''; // e.g., 'your@email.com'

  if (!EMAIL_TO) return;

  const subject = `[새 문의] ${data.name}님이 상담을 신청했습니다`;

  const body = `
새로운 상담 신청이 접수되었습니다.

📋 신청 정보
━━━━━━━━━━━━━━━━━━━━
이름: ${data.name}
연락처: ${data.phone}
회사명: ${data.company || '(미입력)'}
선택 강의: ${courseName}
문의 내용: ${data.message || '(없음)'}
신청 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
━━━━━━━━━━━━━━━━━━━━

빠른 연락 부탁드립니다.
  `;

  try {
    MailApp.sendEmail(EMAIL_TO, subject, body);
  } catch (error) {
    console.log('Email send failed:', error);
  }
}

/**
 * Setup function - Run once to create initial sheet structure
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create Schedule sheet
  let scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);
  if (!scheduleSheet) {
    scheduleSheet = ss.insertSheet(SCHEDULE_SHEET);
    scheduleSheet.appendRow(['강의ID', '강의명', '날짜', '시간', '신청자수', '정원', '상태']);

    // Add sample data
    scheduleSheet.appendRow([
      'COURSE-001',
      '실전 기업인증 마스터 과정 35기',
      '2026년 2월 14일 ~ 16일',
      '10:00 ~ 18:00',
      0,
      20,
      '모집중'
    ]);

    scheduleSheet.appendRow([
      'COURSE-002',
      '실전 기업인증 마스터 과정 36기',
      '2026년 3월 7일 ~ 9일',
      '10:00 ~ 18:00',
      0,
      20,
      '모집중'
    ]);

    // Format header
    scheduleSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    scheduleSheet.setFrozenRows(1);
  }

  // Create Leads sheet
  let leadsSheet = ss.getSheetByName(LEADS_SHEET);
  if (!leadsSheet) {
    leadsSheet = ss.insertSheet(LEADS_SHEET);
    leadsSheet.appendRow(['타임스탬프', '이름', '연락처', '회사명', '선택강의', '주관식응답']);

    // Format header
    leadsSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    leadsSheet.setFrozenRows(1);
  }

  SpreadsheetApp.getUi().alert('시트 설정이 완료되었습니다!');
}

/**
 * Add custom menu for setup
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('랜딩페이지 관리')
    .addItem('시트 초기 설정', 'setupSheets')
    .addItem('모든 일정 보기', 'showAllSchedules')
    .addItem('오늘의 신규 문의', 'showTodayLeads')
    .addToUi();
}

/**
 * Show all schedules in a dialog
 */
function showAllSchedules() {
  const schedules = getSchedules();

  let html = '<style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f4}</style>';
  html += '<table><tr><th>강의명</th><th>날짜</th><th>신청/정원</th><th>상태</th></tr>';

  schedules.forEach(s => {
    const remaining = s.capacity - s.enrolled;
    const statusClass = remaining <= 3 ? 'color:red' : '';
    html += `<tr>
      <td>${s.name}</td>
      <td>${s.date}</td>
      <td style="${statusClass}">${s.enrolled}/${s.capacity}</td>
      <td>${s.status}</td>
    </tr>`;
  });

  html += '</table>';

  const htmlOutput = HtmlService
    .createHtmlOutput(html)
    .setWidth(600)
    .setHeight(400);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '강의 일정 현황');
}

/**
 * Show today's leads
 */
function showTodayLeads() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(LEADS_SHEET);

  if (!sheet) {
    SpreadsheetApp.getUi().alert('리드 시트가 없습니다.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });

  let html = '<style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f4}</style>';
  html += `<h3>오늘 (${today}) 신규 문의</h3>`;
  html += '<table><tr><th>시간</th><th>이름</th><th>연락처</th><th>강의</th></tr>';

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const timestamp = data[i][0];
    if (timestamp && timestamp.toString().includes(today.replace(/\./g, '/'))) {
      count++;
      html += `<tr>
        <td>${timestamp}</td>
        <td>${data[i][1]}</td>
        <td>${data[i][2]}</td>
        <td>${data[i][4]}</td>
      </tr>`;
    }
  }

  html += '</table>';

  if (count === 0) {
    html = `<p>오늘 (${today}) 신규 문의가 없습니다.</p>`;
  } else {
    html = `<p><strong>총 ${count}건</strong>의 신규 문의</p>` + html;
  }

  const htmlOutput = HtmlService
    .createHtmlOutput(html)
    .setWidth(500)
    .setHeight(400);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '오늘의 신규 문의');
}
