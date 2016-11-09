import test from 'ava';
import UnityCacheError from '../src/error';

test.beforeEach(t => {
    t.context.error = new UnityCacheError('Something something');
});

test('instance of Error', t => {
    t.true(t.context.error instanceof Error)
});

test('instance of UnityCacheError', t => {
    t.true(t.context.error instanceof UnityCacheError)
});

test('to string', t => {
    t.is(t.context.error.toString(), 'UnityCacheError: Something something')
});