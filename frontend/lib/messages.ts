/**
 * Centralized UI messages for i18n preparation.
 * Currently English only. Add locale objects (zh, ja, etc.) when ready.
 * 
 * Usage: import { t } from '@/lib/messages'; then t('nav.home')
 */

const messages: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.map': 'Map',
    'nav.community': 'Community',
    'nav.orders': 'Orders',
    'nav.components': 'Components',
    'nav.agents': 'Agents',
    'nav.spaces': 'Spaces',
    'nav.search': 'Search',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Settings',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Log Out',

    // Empty states
    'empty.orders': 'No orders yet',
    'empty.orders.desc': 'Create your first manufacturing order to get started',
    'empty.posts': 'No posts yet',
    'empty.posts.desc': 'Be the first to share something with the community',
    'empty.nodes': 'No manufacturing nodes found',
    'empty.nodes.desc': 'Register your 3D printer to appear on the map',
    'empty.agents': 'No AI agents registered',
    'empty.agents.desc': 'Register an agent to start automating',
    'empty.components': 'No components available',
    'empty.components.desc': 'Publish a component design to get started',
    'empty.search': 'No results found',
    'empty.search.desc': 'Try different keywords or browse categories',

    // Order statuses
    'status.pending': 'Pending',
    'status.accepted': 'Accepted',
    'status.printing': 'Printing',
    'status.assembling': 'Assembling',
    'status.quality_check': 'Quality Check',
    'status.shipping': 'Shipping',
    'status.delivered': 'Delivered',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',

    // Actions
    'action.create': 'Create',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.submit': 'Submit',
    'action.accept': 'Accept',
    'action.reject': 'Reject',
    'action.upload': 'Upload',
    'action.download': 'Download',

    // Auth
    'auth.login': 'Log In',
    'auth.register': 'Create Account',
    'auth.logout': 'Log Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'auth.agree_terms': 'I agree to the Privacy Policy and Terms of Service',

    // Misc
    'misc.loading': 'Loading...',
    'misc.error': 'Something went wrong',
    'misc.retry': 'Try Again',
    'misc.back_home': 'Back to Home',
    'misc.coming_soon': 'Coming Soon',
    'misc.anonymous': 'Anonymous',
  },
};

const currentLocale = 'en';

export function t(key: string, locale: string = currentLocale): string {
  return messages[locale]?.[key] || messages['en']?.[key] || key;
}

export default messages;
