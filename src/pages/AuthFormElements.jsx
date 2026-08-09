import React, { useId, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

/**
 * Floating-label input. Always renders a real <label> tied to the input
 * via htmlFor/id, so it stays screen-reader friendly. type="password"
 * automatically gets a show/hide toggle.
 */
export function Field({
  label,
  type = "text",
  icon,
  error,
  hint,
  value,
  onChange,
  onKeyDown,
  autoComplete,
  required = true,
  name,
}) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (revealed ? "text" : "password") : type;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <div className="field-control">
        {icon ? (
          <span className="field-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={label}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        <label htmlFor={id}>{label}</label>
        {isPassword ? (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert">
          <AlertCircle size={13} />
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Button with a real loading/disabled state: while `loading` is true the
 * label is replaced with a spinner and the button is disabled, so a slow
 * request can't be double-submitted.
 */
export function Button({ children, loading, disabled, variant = "primary", type = "submit" }) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : children}
    </button>
  );
}
