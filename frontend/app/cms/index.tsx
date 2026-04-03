import { Redirect } from 'expo-router';

/**
 * CMS index route — redirects to the CMS login screen.
 *
 * Expo Router requires an index route in each directory for the
 * nested routes (e.g. `/cms/login`) to resolve correctly.
 */
export default function CmsIndex() {
  return <Redirect href="/cms/login" />;
}
