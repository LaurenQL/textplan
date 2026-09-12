#!/bin/bash
rm -f "/Users/lauren/Downloads/textpapertest/.obsidian/plugins/textplan/main.js" \
      "/Users/lauren/Downloads/textpapertest/.obsidian/plugins/textplan/styles.css" \
      "/Users/lauren/Downloads/textpapertest/.obsidian/plugins/textplan/manifest.json"

cp "/Users/lauren/Library/Mobile Documents/com~apple~CloudDocs/Lauren Code/TextPlan/main.js" \
   "/Users/lauren/Library/Mobile Documents/com~apple~CloudDocs/Lauren Code/TextPlan/styles.css" \
   "/Users/lauren/Library/Mobile Documents/com~apple~CloudDocs/Lauren Code/TextPlan/manifest.json" \
   "/Users/lauren/Downloads/textpapertest/.obsidian/plugins/textplan/"

echo "Files copied successfully!"
