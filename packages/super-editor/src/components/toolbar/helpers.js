const sanitizeNumber = (value) => {
    // remove non-numeric characters
    let sanitized = value.replace(/[^0-9.]/g, '');
    // convert to number
    sanitized = parseFloat(sanitized);
    if (isNaN(sanitized)) sanitized = 100

    sanitized = parseFloat(sanitized);
    return sanitized;
};

export { sanitizeNumber };