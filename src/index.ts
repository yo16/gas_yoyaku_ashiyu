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

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function doGet(e: any): GoogleAppsScript.HTML.HtmlOutput {
  const htmlOutput = createPage(e, e.parameter.page);

  return htmlOutput;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createPage(e: any, page: string): GoogleAppsScript.HTML.HtmlOutput {
  let template = null;
  switch (page) {
    case 'toppage':
      template = createPageToppage(e);
      break;
    default:
      template = createPageToppage(e);
  }
  const htmlOut = template.evaluate();
  htmlOut.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return htmlOut;
}

// ---------------------------------------------------------------
// トップページ
const TIMETABLE: string[] = [
  '9:00～',
  '9:30～',
  '10:00～',
  '10:30～',
  '11:00～',
  '11:30～',
  '12:00～',
  '12:30～',
  '13:00～',
  '13:30～',
  '14:00～',
  '14:30～',
  '15:00～',
  '15:30～',
  '16:00～',
  '16:30～',
  '17:00～',
  '17:30～',
  '18:00～',
  '18:30～',
  '19:00～',
  '19:30～',
  '20:00～',
  '20:30～',
];
// トップページを返す
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createPageToppage(e: any): GoogleAppsScript.HTML.HtmlTemplate {
  // 表示する日
  const curDt: Date = e.bookdt || new Date();

  // テンプレートを取得
  const tmpl = HtmlService.createTemplateFromFile('toppage');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let values: any[] = [];
  if (SHEET_ID) {
    // シートを取得
    const sh = SpreadsheetApp.openById(SHEET_ID);
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
  // // timeでソート
  // curDtBookings.sort((a: BookInfo, b: BookInfo) => a.time - b.time);
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

  // テンプレートへ変数を設定
  tmpl.today = formatDt(new Date());
  tmpl.curdt = formatDt(curDt);
  tmpl.bookings = bookingsForDisp;

  return tmpl;
}

// ---------------------------------------------------------------
// ユーティリティ関数
// 日付を MM/DD(weekday) 形式にする
function formatDt(dt: Date): string {
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  return `${dt.getMonth() + 1}月${dt.getDate()}日(${WD[dt.getDay()]})`;
}

// 時刻を hh:mm～ 形式にする ※ TIMETABLEのフォーマット。完全一致検索で利用しているので一致させること。
function formatTime(dt: Date): string {
  // 前ゼロをつけた文字列にする
  const strH = `0${dt.getHours()}`.slice(-2);
  const strM = `0${dt.getMinutes()}`.slice(-2);

  // 前ゼロを除外してフォーマット化
  return `${strH}:${strM}～`;
}

// ２つのDateを比較し、同じ日かどうか判定
function isSameDay(dt1: Date, dt2: Date): boolean {
  return (
    dt1.getFullYear() === dt2.getFullYear() &&
    dt1.getMonth() === dt2.getMonth() &&
    dt1.getDate() === dt2.getDate()
  );
}
