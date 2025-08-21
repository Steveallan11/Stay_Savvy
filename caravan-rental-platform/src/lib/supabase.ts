import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Graceful handling of missing Supabase configuration
export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey)

// Create a mock client for when Supabase is not configured
const mockSupabaseClient = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    insert: () => Promise.resolve({ error: new Error('Supabase not configured') }),
    select: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ error: new Error('Supabase not configured') }),
    delete: () => Promise.resolve({ error: new Error('Supabase not configured') })
  }),
  functions: {
    invoke: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  }
}

export const supabase = isSupabaseEnabled 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : mockSupabaseClient as any

// Console warning for development
if (!isSupabaseEnabled && import.meta.env.DEV) {
  console.warn('Supabase configuration not found. Backend functionality will be disabled.')
}

// Helper function to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Prepare media files for upload to edge function
export const prepareMediaFiles = async (files: FileList | File[], captions: string[] = []) => {
  const mediaFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const base64Data = await fileToBase64(file);
    
    mediaFiles.push({
      fileData: base64Data,
      fileName: file.name,
      fileType: file.type,
      caption: captions[i] || '',
      isPrimary: i === 0, // First image is primary by default
      mediaType: file.type.startsWith('video/') ? 'video' : 
                 file.type.startsWith('image/') ? 'image' : 'document'
    });
  }
  
  return mediaFiles;
};

// Property Management API
export const propertyAPI = {
  // Create new property with comprehensive data
  async createProperty(propertyData: any, mediaFiles: any[] = []) {
    if (!isSupabaseEnabled) {
      throw new Error('Property management not available - backend not configured');
    }

    try {
      const { data, error } = await supabase.functions.invoke('property-management', {
        body: {
          action: 'create_property',
          propertyData,
          mediaFiles
        }
      });

      if (error) {
        throw new Error(`Property creation failed: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Property creation error:', error);
      throw error;
    }
  },

  // Upload media files
  async uploadMedia(mediaFiles: any[]) {
    if (!isSupabaseEnabled) {
      throw new Error('Media upload not available - backend not configured');
    }

    try {
      const { data, error } = await supabase.functions.invoke('property-management', {
        body: {
          action: 'upload_media',
          mediaFiles
        }
      });

      if (error) {
        throw new Error(`Media upload failed: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Media upload error:', error);
      throw error;
    }
  },

  // Update existing property
  async updateProperty(propertyId: string, updates: any) {
    if (!isSupabaseEnabled) {
      throw new Error('Property update not available - backend not configured');
    }

    try {
      const { data, error } = await supabase.functions.invoke('property-management', {
        body: {
          action: 'update_property',
          propertyData: {
            propertyId,
            updates
          }
        }
      });

      if (error) {
        throw new Error(`Property update failed: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Property update error:', error);
      throw error;
    }
  },

  // Get properties for owner
  async getProperties() {
    if (!isSupabaseEnabled) {
      // Return mock data for development
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch properties: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Fetch properties error:', error);
      throw error;
    }
  },

  // Get single property by ID
  async getProperty(propertyId: string) {
    if (!isSupabaseEnabled) {
      throw new Error('Property fetch not available - backend not configured');
    }

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch property: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Fetch property error:', error);
      throw error;
    }
  },

  // Delete property
  async deleteProperty(propertyId: string) {
    if (!isSupabaseEnabled) {
      throw new Error('Property deletion not available - backend not configured');
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        throw new Error(`Failed to delete property: ${error.message}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Delete property error:', error);
      throw error;
    }
  }
};

// Helper functions for common operations
export async function getCurrentUser() {
  if (!isSupabaseEnabled) {
    return null
  }
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

export async function signOut() {
  if (!isSupabaseEnabled) {
    console.warn('Supabase not configured - sign out disabled')
    return
  }
  
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseEnabled) {
    throw new Error('Authentication not available - backend not configured')
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    console.error('Error signing in:', error)
    throw error
  }
  
  return data
}

export async function signUpWithEmail(email: string, password: string, fullName: string, userType: 'guest' | 'owner' = 'guest') {
  if (!isSupabaseEnabled) {
    throw new Error('Registration not available - backend not configured')
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`,
      data: {
        full_name: fullName,
        user_type: userType
      }
    }
  })
  
  if (error) {
    console.error('Error signing up:', error)
    throw error
  }
  
  // Create profile after successful signup
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        user_type: userType
      })
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
    }
  }
  
  return data
}