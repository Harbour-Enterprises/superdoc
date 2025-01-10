#!/bin/bash


# Unzip a .docx file to the tests directory
# Expects a file path to a docx file and optional second flag to indicate if the data is public safe
# If is_public_safe is true the data will be included in the git repo

# Check if the file name is provided
if [ -z "$1" ]; then
  echo "Usage: unzip.sh /path/to/my/file [is_public_safe]"
  echo "is_public_safe: optional flag to indicate if the data is public safe"
  exit 1
fi

# Original file path
FILE_PATH="$1"
IS_PUBLIC_SAFE="$2"

echo "🥡 Processing file: $FILE_PATH"

# Extract the file name without the extension
original_name=$(basename "$FILE_PATH" | sed 's/\.[^.]*$//')

# Remove special characters and replace spaces
safe_name=$(echo "$original_name" | sed 's/[^a-zA-Z0-9]/_/g' | tr '[:upper:]' '[:lower:]')
BASE_PATH=./packages/super-editor/src/tests/data
DIR_PATH=$BASE_PATH/$safe_name

if [ -d "$DIR_PATH" ]; then
  echo "🚫 The directory $DIR_PATH already exists..."
  echo "🚫 Please try a different file or remove the existing directory"
  echo "🥡 Done!"
  exit 0
fi

mkdir -p "$DIR_PATH"
echo "🥡 Created destination directory: $DIR_PATH"

cp "$FILE_PATH" "$DIR_PATH"
echo "🥡 Copied file to destination directory"

DATA_PATH="$DIR_PATH/docx"
unzip -d "$DATA_PATH" "$FILE_PATH"

ABSOLUTE_DATA_PATH=$(realpath "$DATA_PATH")
echo "🥡 Data path: $ABSOLUTE_DATA_PATH"
echo "🥡 Done!"

# Unless the user explicitly tells us that this data is git-safe, we will gitignore it
GITIGNORE_PATH=$BASE_PATH/.gitignore
if [ "$IS_PUBLIC_SAFE" != "true" ]; then
  echo "✅ The extracted data has been added to $GITIGNORE_PATH and will not be included in the git repo"
  echo "✅ If you intend to include it, please remove the folder name from $GITIGNORE_PATH"
  echo "✅ You can also use the is_public_safe flag to include the data in the git repo next time (add 'true' after the file path)"

  # Add to gitignore
  ENTRY=$safe_name/
  if ! grep -Fxq "$ENTRY" "$GITIGNORE_PATH"; then
    echo "$ENTRY" >> "$GITIGNORE_PATH"
  fi
else
  echo "⚠️ Warning"
  echo "⚠️ The extracted data will be included in the git repository"
  echo "⚠️ If you intend to keep it private, please add the folder name to $GITIGNORE_PATH"
fi
echo "---"