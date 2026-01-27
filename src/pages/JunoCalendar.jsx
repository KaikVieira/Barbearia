import React, { useState } from "react";
import "./JunoCalendar.css";

function JunoCalendar({ dataSelecionada, setDataSelecionada }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    const prev = new Date(currentDate);
    const now = new Date();
    if (prev.getFullYear() <= now.getFullYear() && prev.getMonth() <= now.getMonth()) return;
    prev.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(next);
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  const selectDate = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setDataSelecionada(selected.toISOString().split("T")[0]);
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = getDaysInMonth(year, month);
    const firstDayWeek = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayWeek; i++) {
      days.push(<div key={`empty-${i}`} className="empty-day" />);
    }

    for (let i = 1; i <= numDays; i++) {
      const dayDate = new Date(year, month, i);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = dayDate < today;

      const dayISO = dayDate.toISOString().split("T")[0];
      const todayISO = today.toISOString().split("T")[0];

      days.push(
        <button
          key={i}
          disabled={isPast}
          className={`day-btn ${dataSelecionada === dayISO ? "selected" : ""} ${
            todayISO === dayISO ? "today" : ""
          }`}
          onClick={() => selectDate(i)}
        >
          {i}
        </button>
      );
    }

    return days;
  };

  const weekdayInitials = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="juno-calendar">
      <div className="juno-month">
        <button className="nav-btn" onClick={handlePrevMonth}>◀</button>
        <div className="month-pill">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </div>
        <button className="nav-btn" onClick={handleNextMonth}>▶</button>
      </div>

      <div className="weekdays-grid">
        {weekdayInitials.map((d, idx) => (
          <div key={idx} className="weekday-header">{d}</div>
        ))}
      </div>

      <div className="days-grid">{renderDays()}</div>
    </div>
  );
}

export default JunoCalendar;
