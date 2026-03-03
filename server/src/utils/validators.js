/**
 * Basic email validation regex
 */
export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

/**
 * Check if email is a role-based address
 */
export const isRoleBasedEmail = (email) => {
    const rolePrefixes = [
        'info', 'hello', 'contact', 'press', 'support', 'editorial',
        'admin', 'advertising', 'sales', 'help', 'team', 'office',
        'hr', 'jobs', 'careers', 'billing', 'abuse', 'postmaster',
        'webmaster', 'noreply', 'no-reply',
    ];
    const prefix = email.split('@')[0].toLowerCase();
    return rolePrefixes.includes(prefix);
};

/**
 * Sanitize email
 */
export const sanitizeEmail = (email) => {
    return String(email).toLowerCase().trim();
};
