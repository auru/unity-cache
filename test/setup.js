require('browser-env')(['window', 'document', 'navigator']);

const indexedDB = require('fake-indexeddb');
const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

window.indexedDB = indexedDB;
window.IDBKeyRange = FDBKeyRange;