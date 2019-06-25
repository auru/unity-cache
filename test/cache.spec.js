/* eslint-disable ava/no-only-test, ava/use-t-well */

import test from 'ava';
import createCache from '../src';
import UnityCacheError from '../src/error';

test.beforeEach(t => {
    t.context.cache = createCache([ 'store', 'store2', 'drop_store' ], 'cache', 1);
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
    await t.throwsAsync(async () => await t.context.cache.set('store-not-exist', 'key', 'val'), Error);
});

test('get val on non-existent store', async t => {
    await t.throwsAsync(async () => await t.context.cache.get('store-not-exist', 'key', 'val'), Error);
});

test('remove val', async t => {
    await t.context.cache.remove('store', 'key-not-exist');
    t.pass();
});

test('remove non-existent key', async t => {
    await t.notThrowsAsync(async () => await t.context.cache.remove('store', 'key-not-exist'));
});

test('remove val on non-existent store', async t => {
    await t.throwsAsync(async () => await t.context.cache.remove('store-not-exist', 'key'), Error);
});

test('illegal store name', async t => {
    await t.throwsAsync(async () => await createCache([ 'with spaces' ]), UnityCacheError);
});

test('does not throw on cache params', async t => {
    await t.notThrowsAsync(async () => await createCache([ 'store' ], 'test', 'test database', 'localStorageWrapper'));
});

test('drop store', async t => {
    await t.notThrowsAsync(async () => await t.context.cache.drop('drop_store'));
});

test('remove database', async t => {
    const cache = createCache([ 'store' ], 'test-1', 1);
    await t.notThrowsAsync(async () => await cache.remove());
});

test('upgrade handle', async t => {
    const cache = createCache([ 'store' ], 'test-2', 1);
    await cache.set('store', 'key', 'val');

    const newCache = createCache([ 'store', 'other' ], 'test-2', 1);
    await t.notThrowsAsync(async () => await newCache.set('store', 'key', 'val'));

    const newCachedVal = await newCache.get('store', 'key');
    t.is(newCachedVal, 'val');
});

test('upgrade handle when new higher version', async t => {
    const cache = createCache([ 'store' ], 'test-3', 1);
    await cache.set('store', 'key', 'val');
    await cache.remove();

    const newCache = createCache([ 'store', 'other' ], 'test-3', 2);
    await t.notThrowsAsync(async () => await newCache.set('store', 'key', 'val'));

    const newCacheValue = await cache.get('store', 'key');
    t.is(newCacheValue, 'val');
});

test('upgrade handle when new lower version', async t => {
    let cache;
    let cacheValue;

    cache = createCache([ 'store' ], 'test-4', 2);
    await cache.set('store', 'key', 'val');

    cache = createCache([ 'store', 'other' ], 'test-4', 1);
    await t.notThrowsAsync(async () => await cache.set('store', 'key', 'val'));

    cacheValue = await cache.get('store', 'key');
    t.is(cacheValue, null);

    await t.notThrowsAsync(async () => await cache.set('store', 'key', 'val'));
    cacheValue = await cache.get('store', 'key');
    t.is(cacheValue, 'val');
});
