import { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarHeader } from './CalendarHeader';
import { CalendarDetailPopover } from './CalendarDetailPopover';
import type { JLPTLevel, JapaneseHoliday, WordOfTheDay, KanjiOfTheDay } from '../../types/calendar';

// Types for calendar range data
interface CalendarRangeData {
  words: Array<{
    date: string;
    word: WordOfTheDay;
  }>;
  kanji: Array<{
    date: string;
    kanji: KanjiOfTheDay;
  }>;
  holidays: JapaneseHoliday[];
}

type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

interface FullCalendarViewProps {
  onClose: () => void;
}

export function FullCalendarView({ onClose }: FullCalendarViewProps) {
  const { session } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<CalendarViewType>('dayGridMonth');
  const [events, setEvents] = useState<EventInput[]>([]);
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>('N5');
  const [_selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [_rangeData, setRangeData] = useState<CalendarRangeData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Popover state
  const [popoverData, setPopoverData] = useState<{
    type: 'wotd' | 'kotd' | 'holiday';
    data: WordOfTheDay | KanjiOfTheDay | JapaneseHoliday;
    position: { x: number; y: number };
  } | null>(null);

  // Animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Load user's JLPT level
  useEffect(() => {
    if (!session?.access_token) return;

    fetch('/api/calendar?action=settings', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.jlptLevel) setJlptLevel(data.jlptLevel);
      })
      .catch(console.error);
  }, [session?.access_token, jlptLevel]);

  // Fetch calendar data for a date range
  const fetchCalendarData = useCallback(async (start: Date, end: Date, level?: JLPTLevel) => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      const jlpt = level || jlptLevel;

      const response = await fetch(
        `/api/calendar?action=range&start=${startStr}&end=${endStr}&jlpt=${jlpt}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }

      const data: CalendarRangeData = await response.json();
      setRangeData(data);

      // Convert data to FullCalendar events
      const calendarEvents: EventInput[] = [];

      // Add Word of the Day events
      data.words.forEach(({ date, word }) => {
        calendarEvents.push({
          id: `wotd-${date}`,
          title: `${word.word} - ${word.meaning}`,
          start: date,
          allDay: true,
          classNames: ['wotd-event'],
          extendedProps: {
            type: 'wotd',
            data: word
          },
          backgroundColor: '#6366f1',
          borderColor: '#4f46e5'
        });
      });

      // Add Kanji of the Day events
      data.kanji.forEach(({ date, kanji }) => {
        calendarEvents.push({
          id: `kotd-${date}`,
          title: `${kanji.kanji} - ${kanji.meaning}`,
          start: date,
          allDay: true,
          classNames: ['kotd-event'],
          extendedProps: {
            type: 'kotd',
            data: kanji
          },
          backgroundColor: '#a855f7',
          borderColor: '#9333ea'
        });
      });

      // Add Japanese holidays
      data.holidays.forEach((holiday) => {
        calendarEvents.push({
          id: `holiday-${holiday.date}`,
          title: `${holiday.localName}`,
          start: holiday.date,
          allDay: true,
          classNames: ['holiday-event'],
          extendedProps: {
            type: 'holiday',
            data: holiday
          },
          backgroundColor: '#f59e0b',
          borderColor: '#d97706'
        });
      });

      setEvents(calendarEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Track current date range for refetching when JLPT changes
  const [currentDateRange, setCurrentDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Handle date range changes
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setCurrentDateRange({ start: arg.start, end: arg.end });
    fetchCalendarData(arg.start, arg.end);
  }, [fetchCalendarData]);

  // Handle JLPT level change - refetch data
  const handleJlptChange = useCallback((level: JLPTLevel) => {
    setJlptLevel(level);
    if (currentDateRange) {
      fetchCalendarData(currentDateRange.start, currentDateRange.end, level);
    }
  }, [currentDateRange, fetchCalendarData]);

  // Handle view change
  const handleViewChange = (view: CalendarViewType) => {
    setCurrentView(view);
    // Use the calendar API to change the view
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
    }
  };

  // Handle date click
  const handleDateClick = (arg: { date: Date }) => {
    setSelectedDate(arg.date);
  };

  // Handle event click
  const handleEventClick = (arg: EventClickArg) => {
    const { type, data } = arg.event.extendedProps as { type: string; data: WordOfTheDay | KanjiOfTheDay | JapaneseHoliday };

    // Get click position from the event element
    const rect = arg.el.getBoundingClientRect();
    const position = {
      x: rect.right + 10,
      y: rect.top
    };

    setPopoverData({
      type: type as 'wotd' | 'kotd' | 'holiday',
      data,
      position
    });
  };

  // Close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  if (!session) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
          <p className="text-center text-gray-600 dark:text-gray-300">
            Please sign in to use the Calendar.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Full Calendar Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col pointer-events-auto overflow-hidden">
          {/* Header */}
          <CalendarHeader
            currentView={currentView}
            jlptLevel={jlptLevel}
            onViewChange={handleViewChange}
            onJlptChange={handleJlptChange}
            onClose={handleClose}
          />

          {/* Calendar Content */}
          <div className="flex-1 overflow-hidden p-2 sm:p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className={`h-full ${loading ? 'opacity-50' : ''}`}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={currentView}
                headerToolbar={false}
                events={events}
                datesSet={handleDatesSet}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height="100%"
                dayMaxEvents={3}
                nowIndicator={true}
                editable={false}
                selectable={true}
                eventDisplay="block"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                firstDay={0}
                locale="en"
                buttonText={{
                  today: 'Today',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day'
                }}
              />
            </div>
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 pointer-events-none">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Loading...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Popover */}
      {popoverData && (
        <CalendarDetailPopover
          type={popoverData.type}
          data={popoverData.data}
          position={popoverData.position}
          onClose={() => setPopoverData(null)}
        />
      )}

      {/* Custom Calendar Styles */}
      <style>{`
        .fc {
          --fc-border-color: rgba(156, 163, 175, 0.3);
          --fc-today-bg-color: rgba(99, 102, 241, 0.1);
          --fc-neutral-bg-color: transparent;
          --fc-page-bg-color: transparent;
        }

        .dark .fc {
          --fc-border-color: rgba(75, 85, 99, 0.5);
          --fc-today-bg-color: rgba(99, 102, 241, 0.2);
        }

        .fc .fc-daygrid-day-number {
          padding: 4px 8px;
          color: inherit;
        }

        .dark .fc .fc-daygrid-day-number,
        .dark .fc .fc-col-header-cell-cushion {
          color: #e5e7eb;
        }

        .fc .fc-event {
          border-radius: 4px;
          font-size: 0.75rem;
          padding: 2px 4px;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }

        .fc .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .fc .fc-daygrid-day.fc-day-today {
          background: var(--fc-today-bg-color);
        }

        .fc .fc-daygrid-more-link {
          color: #6366f1;
          font-weight: 500;
        }

        .dark .fc .fc-daygrid-more-link {
          color: #818cf8;
        }

        .fc .fc-timegrid-slot-label-cushion {
          font-size: 0.75rem;
        }

        .dark .fc .fc-timegrid-slot-label-cushion {
          color: #9ca3af;
        }

        .wotd-event {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          border: none !important;
        }

        .kotd-event {
          background: linear-gradient(135deg, #a855f7, #ec4899) !important;
          border: none !important;
        }

        .holiday-event {
          background: linear-gradient(135deg, #f59e0b, #ef4444) !important;
          border: none !important;
        }
      `}</style>
    </>
  );
}
