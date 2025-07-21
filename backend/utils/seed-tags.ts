import { supabase } from '../config/supabase';
import { generateSlug } from '../../src/utils/slug-generator';

/**
 * Sample tags data for testing
 */
const SAMPLE_TAGS = [
  // Popular tech tags
  { name: 'JavaScript', usage_count: 45 },
  { name: 'TypeScript', usage_count: 38 },
  { name: 'React', usage_count: 42 },
  { name: 'Vue.js', usage_count: 28 },
  { name: 'Angular', usage_count: 22 },
  { name: 'Node.js', usage_count: 35 },
  { name: 'Python', usage_count: 40 },
  { name: 'Java', usage_count: 30 },
  { name: 'PHP', usage_count: 25 },
  { name: 'CSS', usage_count: 33 },
  
  // Medium usage tags
  { name: 'HTML', usage_count: 20 },
  { name: 'SQL', usage_count: 18 },
  { name: 'MongoDB', usage_count: 15 },
  { name: 'PostgreSQL', usage_count: 16 },
  { name: 'Redis', usage_count: 12 },
  { name: 'Docker', usage_count: 14 },
  { name: 'Kubernetes', usage_count: 8 },
  { name: 'AWS', usage_count: 19 },
  { name: 'Firebase', usage_count: 13 },
  { name: 'GraphQL', usage_count: 11 },
  
  // Vietnamese content tags
  { name: 'Hướng dẫn', usage_count: 32 },
  { name: 'Tutorial', usage_count: 29 },
  { name: 'Kiến thức', usage_count: 24 },
  { name: 'Lập trình', usage_count: 36 },
  { name: 'Web Development', usage_count: 31 },
  { name: 'Frontend', usage_count: 27 },
  { name: 'Backend', usage_count: 26 },
  { name: 'Full Stack', usage_count: 21 },
  { name: 'Mobile', usage_count: 17 },
  { name: 'API', usage_count: 23 },
  
  // Newer tags (low usage)
  { name: 'Svelte', usage_count: 5 },
  { name: 'Deno', usage_count: 3 },
  { name: 'Rust', usage_count: 7 },
  { name: 'Go', usage_count: 9 },
  { name: 'WebAssembly', usage_count: 4 },
  { name: 'Micro Frontend', usage_count: 2 },
  { name: 'Serverless', usage_count: 6 },
  { name: 'JAMstack', usage_count: 8 },
  { name: 'Headless CMS', usage_count: 5 },
  { name: 'Progressive Web App', usage_count: 10 }
];

/**
 * Seed sample tags for testing
 */
export async function seedSampleTags(): Promise<{ success: boolean; error?: any }> {
  try {
    console.log('🌱 Seeding sample tags...');

    // Check if tags already exist
    const { data: existingTags, error: checkError } = await supabase
      .from('tags')
      .select('name')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing tags:', checkError);
      return { success: false, error: checkError };
    }

    if (existingTags && existingTags.length > 0) {
      console.log('✅ Tags already exist, skipping seed');
      return { success: true };
    }

    // Prepare tags data with staggered creation dates
    const now = new Date();
    const tagsToInsert = SAMPLE_TAGS.map((tag, index) => {
      // Create tags with different creation dates (newest first)
      const createdAt = new Date(now.getTime() - (index * 24 * 60 * 60 * 1000)); // 1 day apart
      
      return {
        name: tag.name,
        slug: generateSlug(tag.name),
        usage_count: tag.usage_count,
        created_at: createdAt.toISOString(),
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0') // Random color
      };
    });

    // Insert tags in batches
    const batchSize = 10;
    for (let i = 0; i < tagsToInsert.length; i += batchSize) {
      const batch = tagsToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('tags')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        return { success: false, error: insertError };
      }

      console.log(`✅ Inserted batch ${i / batchSize + 1}/${Math.ceil(tagsToInsert.length / batchSize)}`);
    }

    console.log(`🎉 Successfully seeded ${tagsToInsert.length} sample tags`);
    return { success: true };

  } catch (error) {
    console.error('Error seeding sample tags:', error);
    return { success: false, error };
  }
}

/**
 * Clear all tags (for testing)
 */
export async function clearAllTags(): Promise<{ success: boolean; error?: any }> {
  try {
    console.log('🗑️ Clearing all tags...');

    const { error } = await supabase
      .from('tags')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error clearing tags:', error);
      return { success: false, error };
    }

    console.log('✅ All tags cleared');
    return { success: true };

  } catch (error) {
    console.error('Error clearing tags:', error);
    return { success: false, error };
  }
}
