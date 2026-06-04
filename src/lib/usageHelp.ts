const STORAGE_KEY = 'projectotron-help-dismissed';

export function shouldShowUsageHelpOnLoad(): boolean {
	if (typeof localStorage === 'undefined') return true;
	return localStorage.getItem(STORAGE_KEY) !== '1';
}
