#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listEvents() {
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, org, starts_at')
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    process.exit(1);
  }

  console.log('\n📅 Available Events:\n');
  console.log('─'.repeat(100));

  if (events.length === 0) {
    console.log('No events found in the database.');
  } else {
    events.forEach((event, i) => {
      const date = new Date(event.starts_at).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      console.log(`${i + 1}. ${event.title}`);
      console.log(`   Organization: ${event.org}`);
      console.log(`   Date: ${date}`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Buy URL: http://localhost:3000/buy/${event.id}`);
      console.log('');
    });
  }

  console.log('─'.repeat(100));
  console.log(`\nTotal events: ${events.length}\n`);
}

listEvents().catch(console.error);
