import { createSupabaseClient, isSupabaseConfigured, type Database } from '@/lib/supabase'

export interface KVRecord<T = any> {
  collection: string
  key: string
  data: T
  updated_at?: string
}

export class CloudKVService {
  private supabase = createSupabaseClient()

  private async getUserId(): Promise<string> {
    if (!isSupabaseConfigured || !this.supabase) throw new Error('Supabase not configured')
    const { data, error } = await this.supabase.auth.getUser()
    if (error) throw error
    const user = data.user
    if (!user) throw new Error('Not authenticated')
    return user.id
  }

  async save<T = any>(collection: string, key: string, data: T): Promise<Database['public']['Tables']['app_kv']['Row']> {
    if (!isSupabaseConfigured || !this.supabase) throw new Error('Supabase not configured')
    const userId = await this.getUserId()

    const payload = {
      user_id: userId,
      collection,
      key,
      data,
      updated_at: new Date().toISOString(),
    }

    const { data: upserted, error } = await this.supabase
      .from('app_kv')
      .upsert(payload, { onConflict: 'user_id,collection,key' })
      .select()
      .single()

    if (error) throw error
    return upserted
  }

  async load<T = any>(collection: string, key: string): Promise<T | null> {
    if (!isSupabaseConfigured || !this.supabase) throw new Error('Supabase not configured')
    const userId = await this.getUserId()

    const { data, error } = await this.supabase
      .from('app_kv')
      .select('data, updated_at')
      .eq('user_id', userId)
      .eq('collection', collection)
      .eq('key', key)
      .single()

    if (error) {
      // Not found
      if ((error as any).code === 'PGRST116') return null
      throw error
    }

    return (data?.data ?? null) as T
  }
}

export const cloudKV = new CloudKVService()