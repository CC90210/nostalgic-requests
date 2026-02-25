export const PLATFORM_OWNER_EMAIL = process.env.NEXT_PUBLIC_PLATFORM_OWNER_EMAIL || 'konamak@icloud.com';

export function isPlatformOwner(email?: string | null): boolean {
    if (!email) return false;
    return email.toLowerCase() === PLATFORM_OWNER_EMAIL.toLowerCase();
}
