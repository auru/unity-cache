import test from 'ava';
import createCache from '../src/'
import UnityCacheError from '../src/error';

test.beforeEach(t => {
    t.context.cache = createCache(['store', 'store2', 'drop_store']);
});

test('set/get val with default expiration period', async t => {
    await t.context.cache.set('store', 'key-not-expired', 'val');
    const cachedVal = await t.context.cache.get('store', 'key-not-expired');
    t.is(cachedVal, 'val');
});

test('set/get val with set expiration period', async t => {
    await t.context.cache.set('store', 'key2', 'val2', 1000);
    const cachedVal = await t.context.cache.get('store', 'key2');
    t.is(cachedVal, 'val2');
});

test('set/get expired val', async t => {
    await t.context.cache.set('store', 'key-expired', 'val', 0);
    const cachedVal = await t.context.cache.get('store', 'key-expired');

    t.is(cachedVal, null);
});

test('set/get expired val without validation', async t => {
    await t.context.cache.set('store', 'key-expired-2', 'val', 0);
    const cachedVal = await t.context.cache.get('store', 'key-expired-2', false);
    t.is(cachedVal, 'val');
});

test('get non-existent val', async t => {
    const cachedVal = await t.context.cache.get('store', 'key-non-exist');
    t.is(cachedVal, null);
});

test('set val on non-existent store', async t => {
    t.throws(t.context.cache.set('store-not-exist', 'key', 'val'), Error);
});

test('get val on non-existent store', async t => {
    t.throws(t.context.cache.get('store-not-exist', 'key', 'val'), Error);
});

test('remove val', async t => {
    await t.context.cache.remove('store', 'key-not-exist');
    t.pass();
});

test('remove non-existent key', async t => {
    t.notThrows(async () => await t.context.cache.remove('store', 'key-not-exist'));
});

test('remove val on non-existent store', async t => {
    t.throws(t.context.cache.remove('store-not-exist', 'key'), Error);
});

test('illegal store name', async t => {
    t.throws(() => createCache(['with spaces']), UnityCacheError);
});

test('does not throw on cache params', async t => {
    t.notThrows(() => createCache(['store'], 'test', 'test database', 'localStorageWrapper'));
});

test('drop store', async t => {
    t.notThrows(async () => await t.context.cache.drop('drop_store'));
});
