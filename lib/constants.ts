export const CATEGORIES = {
  income: [
    { label: 'Salary', value: 'salary', icon: '💼', color: '#10B981' },
    { label: 'Freelance', value: 'freelance', icon: '💻', color: '#6366F1' },
    { label: 'Investment', value: 'investment', icon: '📈', color: '#8B5CF6' },
    { label: 'Business', value: 'business', icon: '🏢', color: '#F59E0B' },
    { label: 'Gift', value: 'gift', icon: '🎁', color: '#EC4899' },
    { label: 'Other Income', value: 'other_income', icon: '💰', color: '#14B8A6' },
  ],
  expense: [
    { label: 'Food & Dining', value: 'food', icon: '🍽️', color: '#F97316' },
    { label: 'Transport', value: 'transport', icon: '🚗', color: '#3B82F6' },
    { label: 'Shopping', value: 'shopping', icon: '🛍️', color: '#EC4899' },
    { label: 'Entertainment', value: 'entertainment', icon: '🎬', color: '#8B5CF6' },
    { label: 'Healthcare', value: 'healthcare', icon: '🏥', color: '#EF4444' },
    { label: 'Bills & Utilities', value: 'bills', icon: '⚡', color: '#F59E0B' },
    { label: 'Rent', value: 'rent', icon: '🏠', color: '#6366F1' },
    { label: 'Education', value: 'education', icon: '📚', color: '#10B981' },
    { label: 'Travel', value: 'travel', icon: '✈️', color: '#14B8A6' },
    { label: 'Fitness', value: 'fitness', icon: '💪', color: '#F97316' },
    { label: 'Personal Care', value: 'personal_care', icon: '✨', color: '#EC4899' },
    { label: 'Other Expense', value: 'other_expense', icon: '📦', color: '#6B7280' },
  ],
}

export const ALL_CATEGORIES = [...CATEGORIES.income, ...CATEGORIES.expense]

export const PAYMENT_METHODS = [
  { label: 'UPI', value: 'upi' },
  { label: 'Cash', value: 'cash' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Debit Card', value: 'debit_card' },
  { label: 'Net Banking', value: 'net_banking' },
  { label: 'Wallet', value: 'wallet' },
  { label: 'Cheque', value: 'cheque' },
]

export const CURRENCIES = [
  { label: '₹ INR — Indian Rupee', value: 'INR', symbol: '₹' },
  { label: '$ USD — US Dollar', value: 'USD', symbol: '$' },
  { label: '€ EUR — Euro', value: 'EUR', symbol: '€' },
  { label: '£ GBP — British Pound', value: 'GBP', symbol: '£' },
]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
}

export const GOAL_ICONS = ['🏠', '🚗', '✈️', '💍', '🎓', '💻', '📱', '🏋️', '🌏', '💰', '🎯', '🎸']
export const GOAL_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Transactions', href: '/transactions', icon: 'ArrowLeftRight' },
  { label: 'Budgets', href: '/budgets', icon: 'PieChart' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart2' },
  { label: 'Goals', href: '/goals', icon: 'Target' },
  { label: 'Insights', href: '/insights', icon: 'Lightbulb' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
]

export function getCategoryMeta(value: string) {
  return ALL_CATEGORIES.find((c) => c.value === value) ?? {
    label: value,
    value,
    icon: '📦',
    color: '#6B7280',
  }
}
