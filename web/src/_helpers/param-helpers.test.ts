import * as util from './param-helpers';

test('nameToURI: Encodes spaces as hyphens', () => {
  const testStr = 'this is a test';
  const output = util.nameToURI(testStr);

  expect(output).toEqual('this_is_a_test');
});

test('nameToURI: A non-string value returns undefined', () => {
  const testStr = null;
  const output = util.nameToURI(testStr);

  expect(output).toEqual(undefined);
});

test('uriToName: Decodes hyphens to spaces', () => {
  const testStr = 'this_is_a_test';
  const output = util.uriToName(testStr);

  expect(output).toEqual('this is a test');
});

test('uriToName: A non-string value returns undefined', () => {
  const testStr = null;
  const output = util.uriToName(testStr);

  expect(output).toEqual(undefined);
});
