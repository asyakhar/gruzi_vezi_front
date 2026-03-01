import React, { useState, useEffect, useRef } from "react";
import "./AutocompleteInput.css";

const AutocompleteInput = ({
  value,
  onChange,
  name,
  placeholder,
  required,
  label,
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStations = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/stations/search?query=${encodeURIComponent(
          query
        )}`
      );

      if (!response.ok) throw new Error("Ошибка поиска станций");

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Ошибка:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length >= 2) {
        fetchStations(inputValue);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(e);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (station) => {
    // station может быть объектом или строкой
    const stationName = typeof station === "object" ? station.name : station;

    setInputValue(stationName);
    setShowSuggestions(false);

    // Создаем событие для формы
    const event = {
      target: {
        name: name,
        value: stationName,
      },
    };
    onChange(event);
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      {label && (
        <label className="form-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <div className="autocomplete-input-container">
        <input
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className="form-input"
          autoComplete="off"
        />
        {loading && <span className="autocomplete-loader">🔍</span>}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="autocomplete-suggestions">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(item)}
              className="autocomplete-suggestion-item"
            >
              <div className="station-name">{item.name || item}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
