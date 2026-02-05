// Debug utility to check auth state
export const debugAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('currentUser');
  
  console.log('=== AUTH DEBUG ===');
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length || 0);
  console.log('User exists:', !!user);
  if (user) {
    try {
      const parsed = JSON.parse(user);
      console.log('User data:', parsed);
    } catch (e) {
      console.log('User parse error:', e);
    }
  }
  console.log('==================');
};

// Call this in browser console: window.debugAuth()
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}








