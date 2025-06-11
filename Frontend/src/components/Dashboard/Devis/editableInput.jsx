// ✅ EditableInput.jsx
import React from 'react';

const EditableInput = ({ name, value = '', placeholder, type = 'text', onChange, index = null }) => (
  <input
    type={type}
    className="editable-input"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(name, e.target.value, index)}
  />
);

export default React.memo(EditableInput);