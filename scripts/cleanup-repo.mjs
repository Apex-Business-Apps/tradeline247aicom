#!/usr/bin/env node
/**
 * Production Repository Cleanup Script
 * 
 * Safely organizes and removes duplicate/junk files without breaking functionality.
 * 
 * Actions:
 * 1. Moves markdown documentation files to docs/archive/
 * 2. Removes temporary commit/PR message files
 * 3. Removes test CSV files
 * 4. Organizes documentation by category
 */

import { mkdir, rename, unlink, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');

// Files to keep in root (important documentation)
const KEEP_IN_ROOT = [
  'README.md',
  'CHANGELOG.md',
  'SECURITY.md',
  'SUPPORT.md',
];

// Temporary files to delete
const TEMP_FILES = [
  'ci-fix-commit-message.txt',
  'commit-message.txt',
  'CI_PERMANENT_FIX_COMMIT.txt',
  'pr_body.md',
  'pr_body.txt',
  'NEW_PR_DESCRIPTION.md',
  'warm_contacts_outreach.csv',
  'warm_contacts_template.csv',
  'verify-overlays.html',
];

// Documentation categories for organization
const DOC_CATEGORIES = {
  'audit': ['AUDIT', 'COMPREHENSIVE_AUDIT', 'AUDIT_COMPLETE'],
  'ci-cd': ['CI_', 'DEVOPS_', 'DEPLOYMENT_', 'CLOUDFLARE_', 'GITHUB_'],
  'security': ['SECURITY_', 'ENCRYPTION_', 'PII_', 'PROFILES_SECURITY', 'CONTACTS_SECURITY', 'APPOINTMENT_SECURITY'],
  'production': ['PRODUCTION_', 'ENTERPRISE_', 'LAUNCH_', 'INVESTOR_'],
  'features': ['HERO_', 'HEADER_', 'NAVIGATION_', 'DASHBOARD_', 'CHATBOX_', 'LIGHTHOUSE_'],
  'telephony': ['TWILIO_', 'VOICE_', 'SMS_', 'HOTLINE_', 'TELEPHONY_'],
  'supabase': ['SUPABASE_', 'RAG_'],
  'accessibility': ['ACCESSIBILITY', 'COLOR_CONTRAST', 'LONG_TERM_ACCESSIBILITY'],
  'mobile': ['MOBILE_', 'IOS_', 'PLAY_STORE_', 'CAPACITOR'],
  'other': [], // Catch-all
};

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function safeMove(src, dest) {
  try {
    const destDir = dirname(dest);
    await mkdir(destDir, { recursive: true });
    await rename(src, dest);
    console.log(`✅ Moved: ${src} → ${dest}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to move ${src}:`, error.message);
    return false;
  }
}

async function safeDelete(path) {
  try {
    await unlink(path);
    console.log(`🗑️  Deleted: ${path}`);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`❌ Failed to delete ${path}:`, error.message);
    }
    return false;
  }
}

function categorizeDoc(filename) {
  const upper = filename.toUpperCase();
  for (const [category, patterns] of Object.entries(DOC_CATEGORIES)) {
    for (const pattern of patterns) {
      if (upper.includes(pattern)) {
        return category;
      }
    }
  }
  return 'other';
}

async function main() {
  console.log('🧹 Starting Production Repository Cleanup...\n');

  // Step 1: Delete temporary files
  console.log('📋 Step 1: Removing temporary files...');
  let deletedCount = 0;
  for (const file of TEMP_FILES) {
    const path = join(repoRoot, file);
    if (await fileExists(path)) {
      if (await safeDelete(path)) {
        deletedCount++;
      }
    }
  }
  console.log(`   Deleted ${deletedCount} temporary file(s)\n`);

  // Step 2: Organize markdown files
  console.log('📚 Step 2: Organizing markdown documentation...');
  const { readdir } = await import('node:fs/promises');
  const files = await readdir(repoRoot);
  const mdFiles = files.filter(f => f.endsWith('.md') && !KEEP_IN_ROOT.includes(f));
  
  let movedCount = 0;
  for (const file of mdFiles) {
    const category = categorizeDoc(file);
    const src = join(repoRoot, file);
    const dest = join(repoRoot, 'docs', 'archive', category, file);
    
    if (await fileExists(src)) {
      if (await safeMove(src, dest)) {
        movedCount++;
      }
    }
  }
  console.log(`   Organized ${movedCount} markdown file(s) into docs/archive/\n`);

  // Step 3: Summary
  console.log('✅ Cleanup Complete!');
  console.log(`   - Deleted ${deletedCount} temporary file(s)`);
  console.log(`   - Organized ${movedCount} documentation file(s)`);
  console.log('\n⚠️  Review changes with: git status');
  console.log('⚠️  Test build with: npm run build');
}

main().catch(console.error);

