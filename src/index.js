import UnityCacheError from './error';
import localforage from 'localforage/dist/localforage.nopromises';

const DB_DRIVER = [ localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE ];
const RE_BIN = /^\w+$/;
const EXPIRE_BIN = '___expire___';
const EXPIRE_GLUE = '::';
const DEFAULT_NAME = 'unity';
const DEFAULT_DESCRIPTION = 'Unity cache';

let cacheBins = {};

function createCacheBins(bins, name, description, driver) {
    bins = [].concat(bins, EXPIRE_BIN);

    return bins.reduce((result, storeName) => {
        if (!RE_BIN.test(storeName)) {
            throw new UnityCacheError(`Store names can only be alphanumeric, '${storeName}' given`);
        }

        result[storeName] = localforage.createInstance({
            storeName,
            name,
            description,
            driver
        });

        return result;
    }, {});
}

function getExpireKey(bin, key) {
    return bin + EXPIRE_GLUE + key;
}

async function get(bin, key, validate = true) {
    const expired = await cacheBins[EXPIRE_BIN].getItem(getExpireKey(bin, key));
    const isValid = validate && cacheBins[bin] ? expired > Date.now() : true;

    if (!isValid) {
        await cacheBins[EXPIRE_BIN].removeItem(getExpireKey(bin, key));
    }

    return isValid ? await cacheBins[bin].getItem(key) : null; // localForage return null if item doesn't exist
}

async function set(bin, key, data, expire = Number.MAX_SAFE_INTEGER) {
    return await Promise.all([
        cacheBins[EXPIRE_BIN].setItem(getExpireKey(bin, key), Date.now() + Number(expire)),
        cacheBins[bin].setItem(key, data)
    ]);
}

async function remove(bin, key) {
    return await Promise.all([
        cacheBins[EXPIRE_BIN].removeItem(getExpireKey(bin, key)),
        cacheBins[bin].removeItem(key)
    ]);
}

function drop(bins) {
    bins = [].concat(bins);
    bins.map(bin => cacheBins[bin].clear());
}

function createCache(bins, name = DEFAULT_NAME, description = DEFAULT_DESCRIPTION, driver = DB_DRIVER) {
    cacheBins = createCacheBins(bins, name, description, driver);

    return {
        get,
        set,
        remove,
        drop
    };
}

export default createCache;
