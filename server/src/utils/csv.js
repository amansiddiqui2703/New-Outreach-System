import fs from 'fs';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

/**
 * Parse a CSV file buffer into an array of objects
 */
export const parseCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer.toString());
        stream
            .pipe(csvParser())
            .on('data', (row) => results.push(row))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

/**
 * Parse CSV text string into array of objects
 */
export const parseCSVText = (text) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(text);
        stream
            .pipe(csvParser())
            .on('data', (row) => results.push(row))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

/**
 * Deduplicate contacts by email
 */
export const deduplicateByEmail = (contacts) => {
    const seen = new Set();
    return contacts.filter((contact) => {
        const email = (contact.email || '').toLowerCase().trim();
        if (!email || seen.has(email)) return false;
        seen.add(email);
        return true;
    });
};
