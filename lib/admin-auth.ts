export function isAdmin(userId: string): boolean {
  return !!process.env.DOCTOR_USER_ID && userId === process.env.DOCTOR_USER_ID
}
