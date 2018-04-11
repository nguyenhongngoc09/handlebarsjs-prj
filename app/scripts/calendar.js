function getTimeStamp() {
  const nowDate = new Date();
  const nowYear = ("0000" + (nowDate.getFullYear().toString())).slice(-4);
  const nowMonth = ("00" + ((nowDate.getMonth() + 1).toString())).slice(-2);
  const nowDay = ("00" + ((nowDate.getDate()).toString())).slice(-2);
  const nowHours = ("00" + (nowDate.getHours().toString())).slice(-2);
  const nowMinutes = ("00" + (nowDate.getMinutes().toString())).slice(-2);
  const nowSeconds = ("00" + (nowDate.getSeconds().toString())).slice(-2);

  var nowTime = 'T' + nowHours + nowMinutes + nowSeconds;

  var now = nowYear + nowMonth + nowDay + nowTime;

  return now;
}

$(document).ready(() => {
  const separator = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';

  $('.js-calendar').on('click', function() {
    const self = $(this);

    const uId = self.data('uid');
    const location = self.data('location');
    const stampTime = getTimeStamp();
    const endTime = self.data('end-time');
    const startTime = self.data('start-time');
    const description = self.data('description');
    const subject = self.data('subject');

    const calendarEvent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ecosperity//NONSGML v1.0//EN',
      'BEGIN:VEVENT',
      'UID:' + uId,
      'CLASS:PUBLIC',
      'DESCRIPTION:' + description,
      'DTSTAMP;VALUE=DATE-TIME:' + stampTime,
      'DTSTART;VALUE=DATE-TIME:' + startTime,
      'DTEND;VALUE=DATE-TIME:' + endTime,
      'LOCATION:' + location,
      'SUMMARY;LANGUAGE=en-us:' + subject,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    if (!endTime) {
      calendarEvent.splice(9, 1);
    }

    const calendarEventString = calendarEvent.join(separator);

    window.open( 'data:text/calendar;charset=utf8,' + calendarEventString);
  });
});
