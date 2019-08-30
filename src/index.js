import Dexie from 'dexie';
import UnityCacheError from './error';

const RE_BIN = /^\w+$/;
const DEFAULT_NAME = 'unity';
const DEFAULT_VERSION = 1;

const cacheInstance = {
    db: null,
    config: {}
};

function initCacheConfig(stores = [], name = DEFAULT_NAME, version = DEFAULT_VERSION) {
    stores = [].concat(stores);
    stores = stores.reduce((result, storeName) => {
        if (!RE_BIN.test(storeName)) {
            throw new UnityCacheError(`Store names can only be alphanumeric, '${storeName}' given`);
        }

        result[storeName] = '&key, value, expire';

        return result;
    }, {});

    cacheInstance.config = {
        name,
        stores,
        version
    };
}

function initCacheStores() {
    const { name, stores, version } = cacheInstance.config;

    if (cacheInstance.db) {
        closeDB();
    }

    cacheInstance.db = new Dexie(name);

    if (!cacheInstance.db) {
        /* istanbul ignore next: error new Dexie */
        throw new UnityCacheError('Database is undefined or null');
    }

    cacheInstance.db.version(version).stores(stores);
}

function errorHandlerWrapper(method) {
    return async (...params) => {
        try {
            return await method.call(this, ...params);
        } catch (e) {
            switch (e.name) {
            case Dexie.errnames.Upgrade:
            case Dexie.errnames.Version:
            case Dexie.errnames.InvalidState:
            case Dexie.errnames.QuotaExceeded:
                await upgradeDB();
                return null;

            case Dexie.errnames.OpenFailed:
            case Dexie.errnames.DatabaseClosed:
                await openDB();
                return null;

            default:
                /* istanbul ignore next: unhandled db error */
                throw new UnityCacheError(e);
            }
        }
    };
}

function closeDB() {
    if (!cacheInstance.db) {
        /* istanbul ignore next: db is not defined */
        throw new UnityCacheError('Database is undefined or null');
    }

    if (cacheInstance.db.isOpen()) {
        cacheInstance.db.close();
    }
}

async function openDB() {
    if (!cacheInstance.db) {
        /* istanbul ignore next: db is not defined */
        throw new UnityCacheError('Database is undefined or null');
    }

    return await cacheInstance.db
        .open()
        /* istanbul ignore next: upgrade db error, first catch in errorHandlerWrapper */
        .catch(Dexie.errnames.Upgrade, upgradeDB)
        /* istanbul ignore next: version db error, first catch in errorHandlerWrapper */
        .catch(Dexie.errnames.Version, upgradeDB)
        .catch(() => {
            // do nothing on any other error
        });
}

async function upgradeDB() {
    if (!cacheInstance.db) {
        /* istanbul ignore next: db is not defined */
        throw new UnityCacheError('Database is undefined or null');
    }

    return await deleteDB()
        .then(() => {
            initCacheStores();
        })
        .catch(e => {
            /* istanbul ignore next: init error or delete db error */
            throw new UnityCacheError(e);
        });
}

async function deleteDB() {
    if (!cacheInstance.db) {
        /* istanbul ignore next: db is not defined */
        throw new UnityCacheError('Database is undefined or null');
    }

    closeDB();

    return await cacheInstance.db
        .delete()
        .catch(e => {
            /* istanbul ignore next: delete db error */
            throw new UnityCacheError(e);
        });
}

async function get(store, key, validate = true) {
    const { db } = cacheInstance;
    const { value = null, expire = 0 } = await db[store].get(key) || {};
    const isValid = validate ? expire > Date.now() : true;

    if (!isValid) {
        await db[store].delete(key);
    }

    return isValid ? value : null;
}

async function set(store, key, value, ttl = Number.MAX_SAFE_INTEGER) {
    const { db } = cacheInstance;
    const expire = Date.now() + Number(ttl);

    return await db[store].put({ key, value, expire });
}

async function remove(store, key) {
    if (!store) {
        return await deleteDB();
    }

    const { db } = cacheInstance;

    return await db[store].delete(key);
}

async function drop(stores) {
    const { db } = cacheInstance;

    stores = [].concat(stores);

    return await Promise.all(stores.map(store => db[store].clear()));
}

function createCache(stores = [], name = DEFAULT_NAME, version = DEFAULT_VERSION) {
    initCacheConfig(stores, name, version);
    initCacheStores();

    return {
        get: errorHandlerWrapper(get),
        set: errorHandlerWrapper(set),
        drop: errorHandlerWrapper(drop),
        remove: errorHandlerWrapper(remove)
    };
}

export default createCache;
