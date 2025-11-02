'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getBaseUrl } from '@/lib/utils'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const repeatPassword = formData.get('repeat-password') as string

  // Validate password match
  if (password !== repeatPassword) {
    redirect('/auth/error?error=Passwords do not match')
  }

  // Validate email and password are provided
  if (!email || !password) {
    redirect('/auth/error?error=Email and password are required')
  }

  const baseUrl = getBaseUrl()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback?next=/protected`,
    },
  })

  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/auth/sign-up-success')
}


