#!/bin/bash

# Git workflow script for MCP Router Monorepo
# This script helps manage common git operations in a monorepo structure

set -e # Exit on error

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help text
function show_help {
  echo -e "${BLUE}MCP Router Git Workflow Helper${NC}"
  echo -e "Usage: $0 [command] [options]"
  echo
  echo -e "Commands:"
  echo -e "  ${GREEN}commit${NC} [package] [message]   Commit changes for a specific package"
  echo -e "  ${GREEN}push${NC}                         Push commits to remote repository"
  echo -e "  ${GREEN}feature${NC} [name]               Create a new feature branch"
  echo -e "  ${GREEN}pr${NC} [message]                 Create a pull request"
  echo -e "  ${GREEN}cleanup${NC}                      Clean up local branches that are already merged"
  echo -e "  ${GREEN}status${NC}                       Show status of all packages"
  echo
  echo -e "Options:"
  echo -e "  ${GREEN}--all${NC}                        Apply command to all packages (for commit)"
  echo -e "  ${GREEN}--help${NC}                       Show this help message"
  echo
  echo -e "Examples:"
  echo -e "  $0 commit frontend 'Update login component'"
  echo -e "  $0 commit --all 'Fix circular dependencies'"
  echo -e "  $0 feature user-authentication"
}

# Check if there are any uncommitted changes
function check_uncommitted_changes {
  if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    git status -s
    return 0
  fi
  return 1
}

# Check if in monorepo root
function check_root {
  if [[ ! -d "./packages" ]]; then
    echo -e "${RED}Error: Not in monorepo root directory${NC}"
    echo -e "Please run this script from the root of the monorepo"
    exit 1
  fi
}

# Commit changes for a specific package
function commit_package {
  local package=$1
  local message=$2
  
  if [[ "$package" == "--all" ]]; then
    echo -e "${BLUE}Committing all changes: ${message}${NC}"
    git add .
    git commit -m "$message"
  else
    # Verify package exists
    if [[ ! -d "./packages/$package" ]]; then
      echo -e "${RED}Error: Package '$package' not found${NC}"
      echo -e "Available packages:"
      ls -1 ./packages/
      exit 1
    fi
    
    echo -e "${BLUE}Committing changes for $package: ${message}${NC}"
    git add "./packages/$package"
    
    # Add shared if there are changes there too
    if [[ -n $(git status -s "./packages/shared") ]]; then
      echo -e "${YELLOW}Also including shared package changes${NC}"
      git add "./packages/shared"
    fi
    
    # Add test files if they exist
    if [[ -n $(git status -s "./tests") ]]; then
      echo -e "${YELLOW}Also including test files${NC}"
      git add "./tests"
    fi
    
    git commit -m "[$package] $message"
  fi
}

# Push commits to remote
function push_changes {
  local current_branch=$(git branch --show-current)
  
  echo -e "${BLUE}Pushing ${current_branch} to remote${NC}"
  
  # Check if branch exists on remote
  if git ls-remote --heads origin "$current_branch" | grep -q "$current_branch"; then
    git push
  else
    echo -e "${YELLOW}Branch doesn't exist on remote, setting upstream${NC}"
    git push --set-upstream origin "$current_branch"
  fi
}

# Create a new feature branch
function create_feature {
  local feature_name=$1
  
  if [[ -z "$feature_name" ]]; then
    echo -e "${RED}Error: No feature name provided${NC}"
    echo -e "Usage: $0 feature [name]"
    exit 1
  fi
  
  # Check if we need to branch from develop
  local current_branch=$(git branch --show-current)
  if [[ "$current_branch" != "develop" ]]; then
    echo -e "${YELLOW}Warning: You're not on the develop branch${NC}"
    read -p "Do you want to create branch from develop instead? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git checkout develop
      git pull
    fi
  fi
  
  # Create and switch to the new branch
  local branch_name="feature/${feature_name}"
  echo -e "${BLUE}Creating new branch: ${branch_name}${NC}"
  git checkout -b "$branch_name"
  
  echo -e "${GREEN}Branch ${branch_name} created!${NC}"
  echo -e "Make your changes and then use 'scripts/git-workflow.sh commit' to commit them"
}

# Create a pull request
function create_pr {
  local message=$1
  local current_branch=$(git branch --show-current)
  
  if [[ -z "$message" ]]; then
    echo -e "${RED}Error: No PR message provided${NC}"
    echo -e "Usage: $0 pr [message]"
    exit 1
  fi
  
  # Check if gh cli is installed
  if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI not installed${NC}"
    echo -e "Install it from: https://cli.github.com/"
    exit 1
  fi
  
  # Check for uncommitted changes
  if check_uncommitted_changes; then
    read -p "Do you want to commit these changes before creating PR? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      read -p "Commit message: " commit_message
      git add .
      git commit -m "$commit_message"
    else
      echo -e "${YELLOW}Continuing with uncommitted changes...${NC}"
    fi
  fi
  
  # Push changes
  push_changes
  
  # Create PR
  echo -e "${BLUE}Creating pull request...${NC}"
  gh pr create --title "$message" --body "## Changes
  
$message

## Packages Changed
- $(echo "$current_branch" | sed 's/feature\///')

## Testing Instructions
1. Pull the branch
2. Run tests
3. Verify functionality

## Screenshots
<!-- Add screenshots if applicable -->
"
  
  echo -e "${GREEN}Pull request created!${NC}"
}

# Clean up local branches
function cleanup_branches {
  echo -e "${BLUE}Cleaning up local branches...${NC}"
  
  # Switch to develop branch
  git checkout develop
  git pull
  
  # Get list of merged branches
  local merged_branches=$(git branch --merged | grep -v "develop\|main\|\*" | sed 's/^[ \t]*//')
  
  if [[ -z "$merged_branches" ]]; then
    echo -e "${GREEN}No branches to clean up!${NC}"
    return
  fi
  
  echo -e "${YELLOW}Branches to delete:${NC}"
  echo "$merged_branches"
  
  read -p "Delete these branches? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    for branch in $merged_branches; do
      git branch -d "$branch"
    done
    echo -e "${GREEN}Branches deleted!${NC}"
  else
    echo -e "${YELLOW}Operation cancelled${NC}"
  fi
}

# Show status of all packages
function show_status {
  echo -e "${BLUE}Status of monorepo:${NC}"
  
  # Show branch
  echo -e "${YELLOW}Current branch:${NC} $(git branch --show-current)"
  
  # Show changes by package
  echo -e "\n${YELLOW}Changes by package:${NC}"
  
  local has_changes=false
  
  for pkg in $(ls -1 packages/); do
    local pkg_changes=$(git status -s "./packages/$pkg")
    if [[ -n "$pkg_changes" ]]; then
      echo -e "\n${GREEN}$pkg:${NC}"
      echo "$pkg_changes"
      has_changes=true
    fi
  done
  
  # Check for changes to tests
  local test_changes=$(git status -s "./tests")
  if [[ -n "$test_changes" ]]; then
    echo -e "\n${GREEN}tests:${NC}"
    echo "$test_changes"
    has_changes=true
  fi
  
  # Check for other changes
  local other_changes=$(git status -s | grep -v "packages\|tests")
  if [[ -n "$other_changes" ]]; then
    echo -e "\n${GREEN}other:${NC}"
    echo "$other_changes"
    has_changes=true
  fi
  
  if [[ "$has_changes" == "false" ]]; then
    echo -e "${GREEN}No changes in any package${NC}"
  fi
}

# Main script execution
check_root

# Process arguments
if [[ $# -eq 0 || "$1" == "--help" ]]; then
  show_help
  exit 0
fi

command=$1
shift

case $command in
  commit)
    if [[ $# -lt 1 ]]; then
      echo -e "${RED}Error: Not enough arguments for commit${NC}"
      echo -e "Usage: $0 commit [package] [message] or $0 commit --all [message]"
      exit 1
    fi
    
    if [[ "$1" == "--all" ]]; then
      if [[ $# -lt 2 ]]; then
        echo -e "${RED}Error: No commit message provided${NC}"
        exit 1
      fi
      commit_package "--all" "$2"
    else
      if [[ $# -lt 2 ]]; then
        echo -e "${RED}Error: No commit message provided${NC}"
        exit 1
      fi
      commit_package "$1" "$2"
    fi
    ;;
    
  push)
    push_changes
    ;;
    
  feature)
    if [[ $# -lt 1 ]]; then
      echo -e "${RED}Error: No feature name provided${NC}"
      echo -e "Usage: $0 feature [name]"
      exit 1
    fi
    create_feature "$1"
    ;;
    
  pr)
    if [[ $# -lt 1 ]]; then
      echo -e "${RED}Error: No PR message provided${NC}"
      echo -e "Usage: $0 pr [message]"
      exit 1
    fi
    create_pr "$1"
    ;;
    
  cleanup)
    cleanup_branches
    ;;
    
  status)
    show_status
    ;;
    
  *)
    echo -e "${RED}Error: Unknown command '${command}'${NC}"
    show_help
    exit 1
    ;;
esac

exit 0 