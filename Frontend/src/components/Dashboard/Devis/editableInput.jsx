// ✅ EditableInput.jsx
import React from 'react';

const EditableInput = ({ name, value = '', placeholder, type = 'text', onChange, index = null }) => {
  console.log(`🔍 EditableInput ${name}:`, { value, placeholder });
  
  return (
    <input
      type={type}
      className="editable-input"
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => {
        console.log(`📝 Changement ${name}:`, e.target.value);
        onChange(name, e.target.value, index);
      }}
    />
  );
};

export default React.memo(EditableInput);