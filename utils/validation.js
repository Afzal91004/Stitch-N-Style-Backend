// utils/validation.js
export const validateMeasurements = (measurements) => {
  const errors = {};
  const validations = {
    chest: { min: 20, max: 60 },
    waist: { min: 20, max: 60 },
    hips: { min: 20, max: 60 },
    length: { min: 20, max: 72 },
    shoulders: { min: 12, max: 30 },
    sleeves: { min: 15, max: 40 },
  };

  Object.entries(validations).forEach(([field, { min, max }]) => {
    const value = Number(measurements[field]);
    if (!measurements[field]) {
      errors[field] = `${field} measurement is required`;
    } else if (isNaN(value)) {
      errors[field] = `${field} must be a number`;
    } else if (value < min || value > max) {
      errors[field] = `${field} must be between ${min} and ${max} inches`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
