# Database seed SQL layout under backend/database/seeds/.
DB_SEED_DIR="seeds"

DB_CONTENT_FILES=(
  content/scenario.sql
  content/scenario-base-conversion.sql
  content/scenario-piano-fraction.sql
  content/quiz-laurence.sql
)

DB_DEMO_FILES=(
  demo/users.sql
  demo/quizzes.sql
  demo/progressions.sql
)

db_include_demo() {
  [[ "${MATHEOPOLIS_INCLUDE_DEMO:-1}" == "1" ]]
}

db_seed_path() {
  local relative_path="$1"
  echo "${DB_DIR}/${DB_SEED_DIR}/${relative_path}"
}

# Apply order: scenario metadata, chapter scenarios, demo users (for quiz FK), quiz Laurence, remaining demo.
db_ordered_seed_files() {
  local -a ordered=(
    "content/scenario.sql"
    "content/scenario-base-conversion.sql"
    "content/scenario-piano-fraction.sql"
  )

  if db_include_demo; then
    ordered+=("demo/users.sql")
  fi

  ordered+=("content/quiz-laurence.sql")

  if db_include_demo; then
    ordered+=("demo/quizzes.sql" "demo/progressions.sql")
  fi

  printf '%s\n' "${ordered[@]}"
}

db_verify_seed_files() {
  local file
  for file in "${DB_CONTENT_FILES[@]}"; do
    if [[ ! -f "$(db_seed_path "${file}")" ]]; then
      echo "Missing $(db_seed_path "${file}")"
      return 1
    fi
  done

  if db_include_demo; then
    for file in "${DB_DEMO_FILES[@]}"; do
      if [[ ! -f "$(db_seed_path "${file}")" ]]; then
        echo "Missing $(db_seed_path "${file}")"
        return 1
      fi
    done
  fi

  return 0
}

db_apply_seed_files() {
  local file
  while IFS= read -r file; do
    mysql_apply_file "$(db_seed_path "${file}")"
  done < <(db_ordered_seed_files)
}

db_apply_demo_files() {
  local file
  for file in "${DB_DEMO_FILES[@]}"; do
    mysql_apply_file "$(db_seed_path "${file}")"
  done
}

# Demo user delete cascades to quiz Laurence (creator_id FK); restore content quiz after users.
db_reapply_demo_after_reset() {
  mysql_apply_file "$(db_seed_path "demo/users.sql")"
  mysql_apply_file "$(db_seed_path "content/quiz-laurence.sql")"
  mysql_apply_file "$(db_seed_path "demo/quizzes.sql")"
  mysql_apply_file "$(db_seed_path "demo/progressions.sql")"
}
