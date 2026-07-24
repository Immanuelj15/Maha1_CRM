import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function CalendarWidget({ events = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get first day of the month and total days
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create array of days representing the grid
  const daysGrid = [];
  // Empty blocks before first day
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  // Days of the month
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Find events on a specific day
  const getEventsForDate = (dayNum) => {
    if (!dayNum) return [];
    
    // Format date string YYYY-MM-DD
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const [selectedDay, setSelectedDay] = useState(null);
  const selectedEvents = selectedDay ? getEventsForDate(selectedDay) : [];

  return (
    <div className="p-4 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          <span>{monthNames[month]} {year}</span>
        </h3>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 focus:outline-none"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 focus:outline-none"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Titles */}
      <div className="grid grid-cols-7 gap-1 text-center py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1 min-h-[220px]">
        {daysGrid.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="p-1" />;
          }

          const dayEvents = getEventsForDate(day);
          const hasEvents = dayEvents.length > 0;
          const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

          // Find status color coding
          let highlightClass = '';
          if (hasEvents) {
            const confirmed = dayEvents.some(e => e.status === 'Confirmed');
            highlightClass = confirmed 
              ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50';
          }

          return (
            <button
              key={`day-${day}`}
              onClick={() => {
                if (hasEvents) {
                  setSelectedDay(day);
                } else {
                  setSelectedDay(null);
                }
              }}
              className={`p-1 text-xs rounded-xl flex flex-col items-center justify-center relative hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none ${
                isToday ? 'ring-2 ring-secondary ring-offset-1 dark:ring-offset-slate-900' : ''
              } ${highlightClass}`}
            >
              <span>{day}</span>
              {hasEvents && (
                <span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Events List */}
      {selectedDay && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          <p className="font-bold text-slate-500 uppercase text-[9px] mb-2">Events on {monthNames[month]} {selectedDay}</p>
          <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
            {selectedEvents.map((ev, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-b-0">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{ev.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  ev.status === 'Confirmed' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-warning/10 text-warning'
                }`}>
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
