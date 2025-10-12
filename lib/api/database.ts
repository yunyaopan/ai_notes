import { createClient } from '@/lib/supabase/server';
import { TextChunk } from './types';

export interface Customer {
  id: string;
  stripe_customer_id: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  email: string;
  user_id: string;
}

export async function saveTextChunks(chunks: Omit<TextChunk, 'id' | 'user_id' | 'created_at' | 'updated_at'>[], userId: string): Promise<TextChunk[]> {
  const supabase = await createClient();
  
  const chunksToInsert = chunks.map(chunk => ({
    ...chunk,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from('text_chunks')
    .insert(chunksToInsert)
    .select();

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save chunks to database');
  }

  return data || [];
}

export async function getUserTextChunks(userId: string): Promise<TextChunk[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('text_chunks')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch chunks from database');
  }

  return data || [];
}

export async function updateChunkPinStatus(chunkId: string, userId: string, pinned: boolean): Promise<TextChunk> {
  const supabase = await createClient();
  
  // First, if we're pinning this chunk, unpin all other chunks for this user
  if (pinned) {
    const { error: unpinError } = await supabase
      .from('text_chunks')
      .update({ pinned: false })
      .eq('user_id', userId)
      .eq('pinned', true);
    
    if (unpinError) {
      console.error('Database error unpinning other chunks:', unpinError);
      throw new Error('Failed to unpin other chunks');
    }
  }
  
  // Now update the target chunk
  const { data, error } = await supabase
    .from('text_chunks')
    .update({ pinned, updated_at: new Date().toISOString() })
    .eq('id', chunkId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating pin status:', error);
    throw new Error('Failed to update chunk pin status');
  }

  if (!data) {
    throw new Error('Chunk not found or access denied');
  }

  return data;
}

export async function updateTextChunk(chunkId: string, userId: string, content: string, category: string): Promise<TextChunk> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('text_chunks')
    .update({ 
      content, 
      category, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', chunkId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating chunk:', error);
    throw new Error('Failed to update chunk');
  }

  if (!data) {
    throw new Error('Chunk not found or access denied');
  }

  return data;
}

export async function updateChunkStarStatus(chunkId: string, userId: string, starred: boolean): Promise<TextChunk> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('text_chunks')
    .update({ starred, updated_at: new Date().toISOString() })
    .eq('id', chunkId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating star status:', error);
    throw new Error('Failed to update chunk star status');
  }

  if (!data) {
    throw new Error('Chunk not found or access denied');
  }

  return data;
}

export async function deleteTextChunk(chunkId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('text_chunks')
    .delete()
    .eq('id', chunkId)
    .eq('user_id', userId);

  if (error) {
    console.error('Database error deleting chunk:', error);
    throw new Error('Failed to delete chunk');
  }
}

// Customer operations
export async function createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();

  if (error) {
    // Handle duplicate key constraint violation
    if (error.code === '23505') {
      console.log('Customer already exists, fetching existing customer:', customerData.stripe_customer_id);
      // Return the existing customer instead of throwing an error
      const existingCustomer = await getCustomerByStripeId(customerData.stripe_customer_id);
      if (!existingCustomer) {
        throw new Error('Customer exists but could not be retrieved');
      }
      return existingCustomer;
    }
    console.error('Database error creating customer:', error);
    throw new Error('Failed to create customer');
  }

  return data;
}

export async function updateCustomerSubscriptionStatus(stripeCustomerId: string, subscriptionStatus: string): Promise<Customer> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('customers')
    .update({ 
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', stripeCustomerId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating customer subscription status:', error);
    throw new Error('Failed to update customer subscription status');
  }

  if (!data) {
    throw new Error('Customer not found');
  }

  return data;
}

export async function getCustomerByStripeId(stripeCustomerId: string): Promise<Customer | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Database error fetching customer:', error);
    throw new Error('Failed to fetch customer');
  }

  return data;
}

export async function getCustomerByUserId(userId: string): Promise<Customer | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Database error fetching customer by user ID:', error);
    throw new Error('Failed to fetch customer by user ID');
  }

  return data;
}
