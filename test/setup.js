require('@babel/polyfill');
require('browser-env')([ 'window', 'document', 'navigator' ]);

const indexedDB = require('fake-indexeddb');
const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

window.Promise = global.Promise;
window.indexedDB = indexedDB;
window.IDBKeyRange = FDBKeyRange;
