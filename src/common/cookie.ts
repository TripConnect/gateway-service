export function extractCookies(cookie: string) {
  return Object.fromEntries(
    cookie.split('; ').map((c) => {
      const [key, ...v] = c.split('=');
      return [key, v.join('=')];
    }),
  );
}
