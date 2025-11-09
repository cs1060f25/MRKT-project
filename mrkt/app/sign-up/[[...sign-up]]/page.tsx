/**
 * Sign Up Page
 *
 * Clerk pre-built sign-up component.
 */

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp />
    </div>
  )
}
