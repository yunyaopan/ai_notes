'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getBaseUrl } from '@/lib/utils'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const baseUrl = getBaseUrl()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback?next=/protected`,
    },
  })

  if (error) {
    redirect('/auth/error')
  }

  revalidatePath('/', 'layout')
  redirect('/auth/sign-up-success')
}


