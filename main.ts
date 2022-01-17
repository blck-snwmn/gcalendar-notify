type result = {
  response_type: string
  text: string,
  attachments: string[]
}
function postCrnScheduleAtWeek() {
  var result: result = {
    response_type: "in_channel",
    text: "init",
    attachments: []
  };
  var date = new Date()
  result = commandShowScheduleAtWeek(result, date);
  Logger.log(result.text);
  var response = postMsg("release_date", result.text);
  Logger.log(response);
  var responseJson = JSON.parse(response.getContentText());
  //  Logger.log(responseJson.ok);
  if (!responseJson.ok) {
    postMsg("bot", "■定期実行失敗\n送信処理に失敗しました。\nログを確認ください。");
  }
}
function commandShowScheduleAtWeek(result: result, date: Date) {
  var events = getScheduleAtWeek(date);
  result.text = fotmatEventList(events);
  return result;
}

function getScheduleAtWeek(start: Date) {
  var toString = Object.prototype.toString;
  if (toString.call(start) !== "[object Date]") {
    throw new Error("arg type is not Date.");
  }
  var calendar = getScheduleCalendar();

  var startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  var endTime = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
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
    const title = "- " + event.getTitle() + "\n"
    if (!acc[ymd]) {
      acc[ymd] = "";
    }
    acc[ymd] += title;
    return acc
  }, {});
  return Object.keys(dateToTitles).reduce((acc, dateKey) => {
    const titles = dateToTitles[dateKey]
    const body = "■" + dateKey + "\n" + titles
    acc += body
    return acc
  }, "")
}

function postMsg(baseChannel: string, text: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
  var TOKEN = PropertiesService.getScriptProperties().getProperty("SLACK_ACCESS_TOKEN");
  var channel = "#" + baseChannel;

  var url = "https://slack.com/api/chat.postMessage";
  var payload = {
    "channel": channel,
    "text": text
  };
  var headers = {
    "Authorization": "Bearer " + TOKEN
  };
  var options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    "contentType": "application/json; charset=utf-8",
    "headers": headers,
    "method": "post",
    "payload": JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(url, options);
  return response;
}

function getYMD(date: GoogleAppsScript.Base.Date) {
  if (date === null || Object.prototype.toString.call(date) !== "[object Date]") {
    throw new Error("date arg is invalid.");
  }
  return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
}

function getScheduleCalendar() {
  var calenderID = PropertiesService.getScriptProperties().getProperty("CALENDER_ID");
  if (calenderID === null) {
    throw new Error("CalendarID is null.");
  }
  var calendar = CalendarApp.getCalendarById(calenderID);
  if (calendar === null) {
    throw new Error("Calendar is null.");
  }
  return calendar;
}