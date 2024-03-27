/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const props = PropertiesService.getScriptProperties();
const SHEET_ID: string | null = props.getProperty('sheet_id');
const PAGE_TITLE: string | null = props.getProperty('page_title');

// Get
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function doGet(e: any): GoogleAppsScript.HTML.HtmlOutput {
  const htmlOutput = createPage(e, e.parameter.page);

  return htmlOutput;
}

function createPage(
  e: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  page: string = ''
): GoogleAppsScript.HTML.HtmlOutput {
  let template = null;
  switch (page) {
    case 'toppage':
      template = createPageToppageByDate(
        e.parameter.date ? new Date(String(e.parameter.date)) : new Date()
      );
      break;
    default:
      template = createPageToppageByDate(
        e.parameter.date ? new Date(String(e.parameter.date)) : new Date()
      );
  }
  return decorateHtmlOut(template);
}
function decorateHtmlOut(
  tmpl: GoogleAppsScript.HTML.HtmlTemplate
): GoogleAppsScript.HTML.HtmlOutput {
  const htmlOut = tmpl.evaluate();
  htmlOut.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  htmlOut.setTitle(String(PAGE_TITLE));
  return htmlOut;
}

// ---------------------------------------------------------------
// トップページ
const TIMETABLE: string[] = [
  '0900',
  '0930',
  '1000',
  '1030',
  '1100',
  '1130',
  '1200',
  '1230',
  '1300',
  '1330',
  '1400',
  '1430',
  '1500',
  '1530',
  '1600',
  '1630',
  '1700',
  '1730',
  '1800',
  '1830',
  '1900',
  '1930',
  '2000',
  '2030',
];
// トップページを返す
function createPageToppageByDate(
  curDt: Date
): GoogleAppsScript.HTML.HtmlTemplate {
  // テンプレートを取得
  const tmpl = HtmlService.createTemplateFromFile('toppage');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let values: any[] = [];
  if (SHEET_ID) {
    // シートを取得
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheets()[0];
    // 値を全部取得
    values = sh.getDataRange().getValues();
  }

  // curDtのデータだけ抽出
  type BookInfo = {
    time: number;
    name: string;
    timeStr: string;
  };
  const curDtBookings: BookInfo[] = [];
  values.forEach(rec => {
    if (isSameDay(new Date(rec[0]), curDt)) {
      curDtBookings.push({
        time: rec[1],
        name: rec[2],
        timeStr: formatTime(new Date(rec[1])),
      });
    }
  });
  // 日付文字列に対応する人を設定
  type FulledTime = Record<string, string>;
  const bookingsByTime: FulledTime = curDtBookings.reduce(
    (map, bi: BookInfo) => {
      return {
        ...map,
        [bi.timeStr]: bi.name,
      };
    },
    {}
  );

  // 表示用のスケジュールを設定
  const bookingsForDisp = TIMETABLE.map(tm => {
    return {
      timeStr: tm,
      name: bookingsByTime[tm] || '',
    };
  });

  const prevDt = new Date(curDt.getTime());
  prevDt.setDate(prevDt.getDate() - 1);
  const nextDt = new Date(curDt.getTime());
  nextDt.setDate(nextDt.getDate() + 1);

  // テンプレートへ変数を設定
  tmpl.today = formatDtStr(new Date());
  tmpl.curdt = formatDtInput(curDt, 'input');
  tmpl.prevdt = formatDtInput(prevDt, 'input');
  tmpl.nextdt = formatDtInput(nextDt, 'input');
  tmpl.bookings = bookingsForDisp;

  return tmpl;
}

// ---------------------------------------------------------------
// 登録処理
type BookingRegisterInfo = {
  bookDate: string;
  bookTime: string;
  userName: string;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function registBooking(info: BookingRegisterInfo): string {
  // シートに登録
  if (SHEET_ID) {
    // シートを取得
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheets()[0];
    // 最終行
    const lastRow = sh.getLastRow();
    // 追加
    sh.getRange(lastRow + 1, 1).setValue(
      formatDtInput(new Date(info.bookDate), 'sheet')
    );
    sh.getRange(lastRow + 1, 2).setValue(formatTimeNum2Time(info.bookTime));
    sh.getRange(lastRow + 1, 3).setValue(info.userName);

    return info.bookDate;
  }
  return 'Error! in registBooking...';
}

// ---------------------------------------------------------------
// ユーティリティ関数
// 日付を MM/DD(weekday) 形式にする
function formatDtStr(dt: Date): string {
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  return `${dt.getMonth() + 1}月${dt.getDate()}日(${WD[dt.getDay()]})`;
}
// 日付を YYYY-MM-DD 形式にする
// inputでは、MMとDDに前ゼロが必須、separatorは-
// Spread Sheetでは、前ゼロは入れてはいけなく、separatorは/
function formatDtInput(dt: Date, style: string): string {
  // 前ゼロを付与
  const baseMM = `0${dt.getMonth() + 1}`.slice(-2);
  const baseDD = `0${dt.getDate()}`.slice(-2);

  let mm = '';
  let dd = '';
  let separator = '-';

  switch (style) {
    case 'sheet':
      // 前ゼロを取る
      mm = String(Number(baseMM));
      dd = String(Number(baseDD));
      // セパレータは/
      separator = '/';
      break;

    case 'input':
    default:
      mm = baseMM;
      dd = baseDD;
      separator = '-';
  }

  return `${dt.getFullYear()}${separator}${mm}${separator}${dd}`;
}

// 時刻を hhmm 形式にする ※ TIMETABLEのフォーマット。完全一致検索で利用しているので一致させること。
function formatTime(dt: Date): string {
  // 前ゼロを"つけた"文字列にする
  const strH = `0${dt.getHours()}`.slice(-2);
  const strM = `0${dt.getMinutes()}`.slice(-2);

  // 前ゼロを除外してフォーマット化
  return `${strH}${strM}`;
}

// 時刻の数値を(900とか)を、9:00に変換
function formatTimeNum2Time(hm: string) {
  const zeroSup = ('0' + hm).slice(-4);
  const h = String(Number(zeroSup.substring(0, 2)));
  const m = zeroSup.substring(2, 4);
  return `${h}:${m}`;
}

// ２つのDateを比較し、同じ日かどうか判定
function isSameDay(dt1: Date, dt2: Date): boolean {
  return (
    dt1.getFullYear() === dt2.getFullYear() &&
    dt1.getMonth() === dt2.getMonth() &&
    dt1.getDate() === dt2.getDate()
  );
}

// GASのURLを取得する関数
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getAppUrl() {
  return ScriptApp.getService().getUrl();
}

// FormUrlEncodedをjson形式に変換
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formUrlEncodedToJson(formData: string) {
  type ParamKeyVaue = Record<string, string>;
  const json: ParamKeyVaue = {};
  formData.split('&').forEach(pair => {
    // eslint-disable-next-line prefer-const
    let [key, value] = pair.split('=');
    value = decodeURIComponent(value.replace(/\+/g, ' '));
    json[key] = value;
  });
  return json;
}
