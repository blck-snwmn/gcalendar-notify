function postCrnScheduleAtWeek() {
  var result = {
    response_type: "in_channel",
    text: "init",
    attachments: []
  };
  var date = new Date()
  result = commandShowScheduleAtWeek(result, date);
  Logger.log(result.text);
  var response = postMsg("release_date", result.text);
  Logger.log(response);
  var responseJson = JSON.parse(response);
  //  Logger.log(responseJson.ok);
  if (!responseJson.ok) {
    postMsg("bot", "■定期実行失敗\n送信処理に失敗しました。\nログを確認ください。");
  }
}

function doPost(e) {
  if (!validate(e.parameter.token)) {
    throw new Error("invalid token.");
  }

  var result = {
    response_type: "in_channel",
    text: "init",
    attachments: []
  };

  result = executeCommand(e.parameter.command, result);

  var json = JSON.stringify(result);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

//validate
function validate(token) {
  return checkVerificationToken(token);
}
//validate check verification token
function checkVerificationToken(vtoken) {
  return vtoken === PropertiesService.getScriptProperties().getProperty("VERILICATION_TOKEN");
}

//execute command
function executeCommand(command, result) {
  if (command === "/gasshow") {
    result = commandTest(result);
  } else if (command === "/showc") {
    result = commandShowScheduleAtWeek(result, new Date());
  }
  return result;
}
//execute command test
function commandTest(result) {
  result.text = "gasshow_test";
  return result;
}

function commandShowScheduleAtWeek(result, date) {
  var events = getScheduleAtWeek(date);
  result.text = fotmatEventList(events);
  return result;
}

function getScheduleAtWeek(start) {
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
function fotmatEventList(events) {
  var eventList = [];
  events.forEach(function (event) {
    if (!Array.isArray(eventList[getYMD(event.getStartTime())])) {
      eventList[getYMD(event.getStartTime())] = [];
    }
    eventList[getYMD(event.getStartTime())].push(event.getTitle());
  });
  return Object.keys(eventList).reduce(function (previousValue, currentValue, index, array) {
    var nowArray = eventList[currentValue];
    return previousValue + "■" + currentValue + "\n" + Object.keys(nowArray).reduce(function (pValue, cValue) {
      return pValue + "- " + nowArray[cValue] + "\n";
    }, "");
  }, "");
}

function postMsg(baseChannel, text) {
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
  var options = {
    "contentType": "application/json; charset=utf-8",
    "headers": headers,
    "method": "POST",
    "payload": JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(url, options);
  return response;
}

function getYMD(date) {
  if (date === null || Object.prototype.toString.call(date) !== "[object Date]") {
    throw new Error("date arg is invalid.");
  }
  return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
}

function getScheduleCalendar() {
  var calenderID = PropertiesService.getScriptProperties().getProperty("CALENDER_ID");
  var calendar = CalendarApp.getCalendarById(calenderID);
  if (calendar === null) {
    throw new Error("Calendar is null.");
  }
  return calendar;
}