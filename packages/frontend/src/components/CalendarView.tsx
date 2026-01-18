import { useState, useEffect } from 'react';
import type { Habit, CalendarDay } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';

interface CalendarViewProps {
  habit: Habit;
  onClose: () => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function CalendarView({ habit, onClose }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    async function fetchCalendarData() {
      setLoading(true);
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const response = await habitsApi.getCalendar(habit.id, startDate, endDate);
      if (response.success && response.data) {
        setCalendarData(response.data);
      }
      setLoading(false);
    }

    fetchCalendarData();
  }, [habit.id, year, month]);

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getStatusForDay = (day: number): CalendarDay | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarData.find((d) => d.date === dateStr);
  };

  const getStatusClass = (day: number): string => {
    const status = getStatusForDay(day);
    if (!status) return '';

    switch (status.status) {
      case 'completed':
        return 'day--completed';
      case 'skipped':
        return 'day--skipped';
      case 'missed':
        return 'day--missed';
      default:
        return '';
    }
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = getDaysInMonth();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{habit.name} - Calendar</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="calendar">
          <div className="calendar-nav">
            <button onClick={goToPreviousMonth}>&lt;</button>
            <span className="calendar-title">{MONTHS[month]} {year}</span>
            <button onClick={goToNextMonth}>&gt;</button>
          </div>

          <div className="calendar-grid">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="calendar-header">{day}</div>
            ))}

            {loading ? (
              <div className="calendar-loading">Loading...</div>
            ) : (
              days.map((day, index) => (
                <div
                  key={index}
                  className={`calendar-day ${day ? getStatusClass(day) : 'day--empty'} ${day && isToday(day) ? 'day--today' : ''}`}
                >
                  {day}
                </div>
              ))
            )}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot legend-dot--completed"></span>
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot--skipped"></span>
              <span>Skipped</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot--missed"></span>
              <span>Missed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
