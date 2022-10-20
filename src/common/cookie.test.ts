import { clearCookie, getCookie, setCookie } from './cookie';

describe('Cookie Utils', () => {
  let setCookieSpy: jest.SpyInstance<void, [string]>;
  let getCookieSpy: jest.SpyInstance<string, []>;
  let mockCookieString = '';

  beforeAll(() => {
    setCookieSpy = jest.spyOn(document, 'cookie', 'set');
    getCookieSpy = jest.spyOn(document, 'cookie', 'get');
    getCookieSpy.mockImplementation(() => {
      return mockCookieString;
    });
  });

  beforeEach(() => {
    mockCookieString = '';
    setCookieSpy.mockClear();
    getCookieSpy.mockClear();
  });

  afterAll(() => {
    setCookieSpy.mockRestore();
    getCookieSpy.mockRestore();
  });

  test('setCookie sets a basic cookie', () => {
    setCookie('foo_cookie', 'bar');
    expect(setCookieSpy).toBeCalledWith('foo_cookie=bar;path=/;secure');
  });

  test('setCookie sets a basic insecure cookie', () => {
    setCookie('foo_cookie', 'bar', { secure: false });
    expect(setCookieSpy).toBeCalledWith('foo_cookie=bar;path=/');
  });

  test('setCookie sets a basic cookie with exipration date', () => {
    setCookie('foo_cookie', 'bar', { expires: new Date(1666204369514) });
    expect(setCookieSpy).toBeCalledWith(
      'foo_cookie=bar;expires=Wed, 19 Oct 2022 18:32:49 GMT;path=/;secure'
    );
  });

  test('setCookie sets a basic cookie with exipration date and path', () => {
    setCookie('foo_cookie', 'bar', {
      expires: new Date(1666204369514),
      path: '/foobar',
    });
    expect(setCookieSpy).toBeCalledWith(
      'foo_cookie=bar;expires=Wed, 19 Oct 2022 18:32:49 GMT;path=/foobar;secure'
    );
  });

  test('setCookie sets a basic cookie without explicit path if specified as undefined', () => {
    setCookie('foo_cookie', 'bar', { path: undefined });
    expect(setCookieSpy).toBeCalledWith('foo_cookie=bar;secure');
  });

  test('setCookie sets a basic cookie with exipration date, path, and domain', () => {
    setCookie('foo_cookie', 'bar', {
      expires: new Date(1666204369514),
      path: '/foobar',
      domain: 'ci.kbase.us',
    });
    expect(setCookieSpy).toBeCalledWith(
      'foo_cookie=bar;expires=Wed, 19 Oct 2022 18:32:49 GMT;path=/foobar;domain=ci.kbase.us;secure'
    );
  });

  test('clearCookie sets cookie with 0 milliseconds since epoch expiration date', () => {
    clearCookie('foo_cookie');
    expect(setCookieSpy).toBeCalledWith(
      'foo_cookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure'
    );
  });

  test('clearCookie appropriately clears cookie with path', () => {
    clearCookie('foo_cookie', { path: '/foo' });
    expect(setCookieSpy).toBeCalledWith(
      'foo_cookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/foo;secure'
    );
  });

  test('clearCookie appropriately clears cookie with path and domain', () => {
    clearCookie('foo_cookie', { path: '/foo', domain: 'nonsense.kbase.us' });
    expect(setCookieSpy).toBeCalledWith(
      'foo_cookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/foo;domain=nonsense.kbase.us;secure'
    );
  });

  test('getCookie grabs cookie from document.cookie appropriately', () => {
    mockCookieString =
      '_gcl_au=1.1.503742430.1666207927; _gat_gtag_UA_137652528_1=1; ' +
      '_ga=GA1.2.654323348.1666207927; _gid=GA1.2.1077479442.1666207927; ' +
      'kbase_session=Z3Y472VC5XXIXWKUCH3FSCD32MH5CC6M; ' +
      'kbase_session_backup=E3D472AH5CCNCBPZHM3KXHI32RM5HH6R';
    const value = getCookie('kbase_session');
    expect(value).toBe('Z3Y472VC5XXIXWKUCH3FSCD32MH5CC6M');
    expect(getCookieSpy).toBeCalled();
  });

  test('getCookie returns undefined for cookie that DNE', () => {
    mockCookieString =
      '_gcl_au=1.1.503742430.1666207927; _gat_gtag_UA_137652528_1=1; ' +
      '_ga=GA1.2.654323348.1666207927; _gid=GA1.2.1077479442.1666207927; ' +
      'kbase_session=Z3Y472VC5XXIXWKUCH3FSCD32MH5CC6M; ' +
      'kbase_session_backup=E3D472AH5CCNCBPZHM3KXHI32RM5HH6R';
    const value = getCookie('non_cookie_name');
    expect(value).toBe(undefined);
    expect(getCookieSpy).toBeCalled();
  });
});
