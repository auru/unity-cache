import Dexie from 'dexie';
import UnityCacheError from './error';

const RE_BIN = /^\w+$/;
const EXPIRE_BIN = '___expire___';
const EXPIRE_GLUE = '::';
const DEFAULT_NAME = 'unity';
const DEFAULT_VERSION = 1;

const cacheInstance = {
    config: {},
    db: null
};

function setCacheConfig(name, stores, version) {
    stores = [].concat(stores, EXPIRE_BIN);

    stores = stores.reduce((result, storeName) => {
        if (!RE_BIN.test(storeName)) {
            throw new UnityCacheError(`Store names can only be alphanumeric, '${storeName}' given`);
        }

        result[storeName] = '&';
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

    cacheInstance.db = new Dexie(name);

    if (!cacheInstance.db) {
        /* istanbul ignore next: error new Dexie */
        throw new UnityCacheError('Database is undefined or null');
    }

    cacheInstance.db
        .version(version)
        .stores(stores);
}

function errorHandlerWrapper(method) {
    return async (...params) => {
        try {
            return await method.call(this, ...params);
        } catch (e) {
            switch (e.name) {
            case Dexie.errnames.Upgrade:
            case Dexie.errnames.Version:
                await upgradeDB();
                return null;

            case Dexie.errnames.OpenFailed:
            case Dexie.errnames.ClosedError:
                await openDB();
                return null;

            default:
                /* istanbul ignore next: unhandled db error */
                throw new UnityCacheError(e);
            }
        }
    };
}

async function openDB() {
    if (!cacheInstance.db) {
        throw new UnityCacheError('Database is undefined or null');
    }

    return await cacheInstance.db
        .open()
        /* istanbul ignore next: upgrade db error, first catch in errorHandlerWrapper */
        .catch(Dexie.errnames.Upgrade, async () => {
            await upgradeDB();
        })
        /* istanbul ignore next: version db error, first catch in errorHandlerWrapper */
        .catch(Dexie.errnames.Version, async () => {
            await upgradeDB();
        })
        .catch(e => {
            /* istanbul ignore next: open db error */
            throw new UnityCacheError(e);
        });
}

async function upgradeDB() {
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
        throw new UnityCacheError('Database is undefined or null');
    }

    return await cacheInstance.db
        .delete()
        .catch(e => {
            /* istanbul ignore next: delete db error */
            throw new UnityCacheError(e);
        });
}

function getExpireKey(store, key) {
    return store + EXPIRE_GLUE + key;
}

async function get(store, key, validate = true) {
    const { db } = cacheInstance;

    const expired = await db[EXPIRE_BIN].get(getExpireKey(store, key));
    const isValid = validate && db[store] ? expired > Date.now() : true;

    if (!isValid) {
        await db[EXPIRE_BIN].delete(getExpireKey(store, key));
    }

    return isValid ? await db[store].get(key) : null;
}

async function set(store, key, value, expire = Number.MAX_SAFE_INTEGER) {
    const { db } = cacheInstance;

    return await Promise.all([
        db[EXPIRE_BIN].put(Date.now() + Number(expire), getExpireKey(store, key)),
        db[store].put(value, key)
    ]);
}

async function remove(store, key) {
    if (!store) {
        return await deleteDB();
    }

    const { db } = cacheInstance;

    return await Promise.all([
        db[EXPIRE_BIN].delete(getExpireKey(store, key)),
        db[store].delete(key)
    ]);
}

async function drop(stores) {
    const { db } = cacheInstance;

    stores = [].concat(stores);
    return await Promise.all(stores.map(store => db[store].clear()));
}

function createCache(stores, name = DEFAULT_NAME, version = DEFAULT_VERSION) {
    setCacheConfig(name, stores, version);
    initCacheStores();

    return {
        get: errorHandlerWrapper(get),
        set: errorHandlerWrapper(set),
        remove: errorHandlerWrapper(remove),
        drop: errorHandlerWrapper(drop)
    };
}

export default createCache;
