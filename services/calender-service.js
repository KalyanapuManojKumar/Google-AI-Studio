// services/calendarService.js
import { google } from "googleapis";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

export const createCalendarEvent = async (appointmentData) => {
  const { name, phone, service, date, time } = appointmentData;

  const startDateTime = dayjs.tz(`${date}T${time}`, "Asia/Kolkata");
  const endDateTime = startDateTime.add(1, "hour");

  const event = {
    summary: `${service} Appointment - ${name}`,
    description: `Customer: ${name}\nService: ${service}\nPhone: ${phone}`,
    start: { dateTime: startDateTime.format(), timeZone: "Asia/Kolkata" },
    end: { dateTime: endDateTime.format(), timeZone: "Asia/Kolkata" },
  };

  const calendarResponse = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return calendarResponse.data;
};

export const deleteCalendarEvent = async (eventId) => {
  if (!eventId) return;
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
};
