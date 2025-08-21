import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  user_type: 'guest' | 'owner'
  created_at: string
  updated_at: string | null
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          setError('Failed to fetch profile')
          setProfile(null)
        } else {
          setProfile(data)
        }
      } catch (err) {
        console.error('Profile fetch error:', err)
        setError('Failed to fetch profile')
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  // Determine if user is an owner from multiple sources
  const isOwner = !!(
    profile?.user_type === 'owner' ||
    user?.user_metadata?.user_type === 'owner' ||
    user?.user_metadata?.role === 'owner'
  )

  return {
    profile,
    loading,
    error,
    isOwner
  }
}

export default useUserProfile