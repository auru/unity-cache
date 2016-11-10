import test from 'ava';
import factory from '../src/factory'
import UnityCacheError from '../src/error';
import localforageStub from './localforage.stub';

test.beforeEach(t => {
    t.context.cache = factory(localforageStub)(['store', 'store2']);
});

test('set/get val with default expiration period', async t => {
    await t.context.cache.set('store', 'key', 'val');
    const cachedVal = await t.context.cache.get('store', 'key');
    t.is(cachedVal, 'val');
});

test('set/get val with set expiration period', async t => {
    await t.context.cache.set('store', 'key', 'val', 1000);
    const cachedVal = await t.context.cache.get('store', 'key');
    t.is(cachedVal, 'val');
});

test('set/get expired val', async t => {
    await t.context.cache.set('store', 'key', 'val', 0);
    const cachedVal = await t.context.cache.get('store', 'key');
    t.is(cachedVal, null);
});

test('set/get expired val without validation', async t => {
    await t.context.cache.set('store', 'key', 'val');
    const cachedVal = await t.context.cache.get('store', 'key', false);
    t.is(cachedVal, 'val');
});

test('get non-existent val', async t => {
    const cachedVal = await t.context.cache.get('store', 'key');
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
    t.doesNotThrow(async () => await t.context.cache.remove('store', 'key-not-exist'));
});

test('remove val on non-existent store', async t => {
    t.throws(t.context.cache.remove('store-not-exist', 'key'), Error);
});

test('illegal store name', async t => {
    t.throws(() => factory(localforageStub)(['with spaces']), UnityCacheError);
});

test('does not throw on cache params', async t => {
    t.doesNotThrow(() => factory(localforageStub)(['store'], 'test', 'test database', 'localStorage'));
});
