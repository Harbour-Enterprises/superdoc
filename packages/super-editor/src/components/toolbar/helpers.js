const sanitizeNumber = (value, defaultNumber) => {
    // remove non-numeric characters
    let sanitized = value.replace(/[^0-9.]/g, '');
    // convert to number
    sanitized = parseFloat(sanitized);
    if (isNaN(sanitized)) sanitized = defaultNumber

    sanitized = parseFloat(sanitized);
    return sanitized;
};

export { sanitizeNumber };