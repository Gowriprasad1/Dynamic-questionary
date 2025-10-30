import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import DatePicker from 'react-date-picker'

// Minimal InputField adapted from Instainsure _form.js
export function InputField({label, afterLabel = null, value, onChange, type = 'text', placeholder, error, name, onBlur, ...rest}){
  return (
    <div className="ui-input-wrapper">
      {label && (typeof label === 'string' ? (
        <label className="ui-input-label">{label}</label>
      ) : (
        // If label is a React node (contains blocks like <div> or <ol>), render as a div to avoid invalid HTML
        <div className="ui-input-label">{label}</div>
      ))}
      {afterLabel && <div className="ui-after-label">{afterLabel}</div>}
      <div className="ui-input-field">
        <input
          name={name}
          value={value ?? ''}
          onChange={e => onChange && onChange(e.target.value, e)}
          onBlur={onBlur}
          type={type}
          placeholder={placeholder}
          className={error ? 'ui-input error' : 'ui-input'}
          {...rest}
        />
      </div>
      {error && <div className="ui-input-error">{error}</div>}
    </div>
  )
}

InputField.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  value: PropTypes.any,
  onChange: PropTypes.func,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  name: PropTypes.string,
  onBlur: PropTypes.func,
  afterLabel: PropTypes.node,
}

export function DateField({value, onChange, ...rest}){
  return (
    <div className="ui-input-wrapper">
      <DatePicker onChange={onChange} value={value} {...rest} />
    </div>
  )
}

export function SelectField({label, afterLabel = null, value, onChange, options = [], error, name}){
  return (
    <div className="ui-input-wrapper">
      {label && (typeof label === 'string' ? (
        <label className="ui-input-label">{label}</label>
      ) : (
        <div className="ui-input-label">{label}</div>
      ))}
      {afterLabel && <div className="ui-after-label">{afterLabel}</div>}
      <div className="ui-input-field">
        <select
          name={name}
          className={error ? 'ui-input error' : 'ui-input'}
          value={value ?? ''}
          onChange={e => onChange && onChange(e.target.value)}
        >
          <option value="">Select</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.val}>{opt.val}</option>
          ))}
        </select>
      </div>
      {error && <div className="ui-input-error">{error}</div>}
    </div>
  )
}

export function CheckboxGroup({label, afterLabel = null, value = [], onChange, options = [], error, name}){
  const toggle = (val) => {
    const current = Array.isArray(value) ? value : [];
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    onChange && onChange(next);
  }
  return (
    <div className="ui-input-wrapper">
      {label && (typeof label === 'string' ? (
        <label className="ui-input-label">{label}</label>
      ) : (
        <div className="ui-input-label">{label}</div>
      ))}
      {afterLabel && <div className="ui-after-label">{afterLabel}</div>}
      <div className="ui-select-list" role="list">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={`insta-tab ${value.includes(opt.val) ? 'active' : ''}`}
            onClick={() => toggle(opt.val)}
          >
            {opt.val}
          </button>
        ))}
      </div>
      {error && <div className="ui-input-error">{error}</div>}
    </div>
  )
}

export function TextAreaField({label, afterLabel = null, value, onChange, rows = 4, error, placeholder}){
  return (
    <div className="ui-input-wrapper">
      {label && (typeof label === 'string' ? (
        <label className="ui-input-label">{label}</label>
      ) : (
        <div className="ui-input-label">{label}</div>
      ))}
      {afterLabel && <div className="ui-after-label">{afterLabel}</div>}
      <textarea
        className="ui-input"
        rows={rows}
        value={value ?? ''}
        onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <div className="ui-input-error">{error}</div>}
    </div>
  )
}

const InstaForm = { InputField, DateField, SelectField, CheckboxGroup, TextAreaField };

export default InstaForm;

// Instainsure-like UiModal with portal
export const UiModal = ({ isShowing, hide, ...props }) => {
  let needHeader = !props.noHeader || false;
  const handleClick = (event) => {
    if (event.target.closest('.modal') === null) {
      hide();
    }
  };
  return isShowing
    ? ReactDOM.createPortal(
        <React.Fragment>
          <div className="modal-overlay" onClick={hide} />
          <div
            className="modal-wrapper"
            aria-modal
            aria-hidden
            tabIndex={-1}
            role="dialog"
            id={props.id || null}
            onClick={handleClick}
          >
            <div className="modal">
              {needHeader && (
                <div className="modal-header">
                  <button
                    type="button"
                    className="modal-close-button"
                    data-dismiss="modal"
                    aria-label="Close"
                    onClick={hide}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
              )}
              {props.children}
            </div>
          </div>
        </React.Fragment>,
        document.body
      )
    : null;
};
