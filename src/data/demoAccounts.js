// Fixed local-development demo accounts. These are not production users.
// Keep this list in sync with backend/config/demoAccounts.js.
export const DEMO_ACCOUNTS = [
  {
    id: 'member',
    label: 'Demo member',
    name: 'Demo Member',
    email: 'demo.member@reprank.local',
    password: 'RepRankDemo1!',
    role: 'user',
    roleLabel: 'Member',
    description: 'A normal member account for exploring login and protected profile data.',
  },
];

export default DEMO_ACCOUNTS;
