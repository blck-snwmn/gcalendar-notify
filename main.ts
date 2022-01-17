function postCrnScheduleAtWeek() {
  const date = new Date()
  const result = commandShowScheduleAtWeek(date);
  Logger.log(result);

  const response = postMsg("release_date", result);
  Logger.log(response);

  const responseJson = JSON.parse(response.getContentText());
  //  Logger.log(responseJson.ok);
  if (!responseJson.ok) {
    postMsg("bot", "■定期実行失敗\n送信処理に失敗しました。\nログを確認ください。");
  }
}

function commandShowScheduleAtWeek(date: Date): string {
  const events = getScheduleAtWeek(date);
  return fotmatEventList(events);
}

function getScheduleAtWeek(start: Date): GoogleAppsScript.Calendar.CalendarEvent[] {
  const calendar = getScheduleCalendar();

  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endTime = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
  return calendar.getEvents(startTime, endTime);
}
//eventのListを以下の形式にfotmat
//■yyyy/mm/dd
//- title1
//- title2
//■yyyy/mm/dd
//- title3
function fotmatEventList(events: GoogleAppsScript.Calendar.CalendarEvent[]): string {
  let dateToTitles = events.reduce((acc: { [key: string]: string }, event) => {
    const ymd = getYMD(event.getStartTime());
    // const title = "- " + event.getTitle() + "\n"
    const title = `- ${event.getTitle()}\n`
    if (!acc[ymd]) {
      acc[ymd] = "";
    }
    acc[ymd] += title;
    return acc
  }, {});
  return Object.keys(dateToTitles).reduce((acc, dateKey) => {
    const titles = dateToTitles[dateKey]
    const body = `■${dateKey}\n${titles}`
    acc += body
    return acc
  }, "")
}

function postMsg(channel: string, text: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
  const token = PropertiesService.getScriptProperties().getProperty("SLACK_ACCESS_TOKEN");

  const url = "https://slack.com/api/chat.postMessage";
  const payload = {
    "channel": `#${channel}`,
    "text": text
  };
  const headers = {
    "Authorization": `Bearer ${token}`
  };
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    "contentType": "application/json; charset=utf-8",
    "headers": headers,
    "method": "post",
    "payload": JSON.stringify(payload)
  };
  return UrlFetchApp.fetch(url, options);
}

function getYMD(date: GoogleAppsScript.Base.Date): string {
  return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
}

function getScheduleCalendar(): GoogleAppsScript.Calendar.Calendar {
  const calenderID = PropertiesService.getScriptProperties().getProperty("CALENDER_ID");
  if (calenderID === null) {
    throw new Error("CalendarID is null.");
  }
  const calendar = CalendarApp.getCalendarById(calenderID);
  if (calendar === null) {
    throw new Error("Calendar is null.");
  }
  return calendar;
}