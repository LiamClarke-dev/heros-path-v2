#!/bin/bash

# Branch Cleanup Script for Hero's Path
# This script safely cleans up merged and stale branches

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=${DRY_RUN:-false}
STALE_DAYS=${STALE_DAYS:-30}
MAIN_BRANCH="main"
REMOTE_NAME="origin"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
}

# Check if working directory is clean
check_working_directory() {
    if ! git diff-index --quiet HEAD --; then
        error "Working directory is not clean. Please commit or stash your changes."
        exit 1
    fi
}

# Fetch latest changes from remote
fetch_latest() {
    log "Fetching latest changes from remote..."
    git fetch --prune --all
}

# Clean up local merged branches
cleanup_local_merged() {
    log "Cleaning up local merged branches..."
    
    local merged_branches=$(git branch --merged $MAIN_BRANCH | grep -v "^\*" | grep -v "$MAIN_BRANCH" | sed 's/^[[:space:]]*//')
    
    if [ -z "$merged_branches" ]; then
        log "No local merged branches to clean up."
        return
    fi
    
    echo "$merged_branches" | while read branch; do
        if [ -n "$branch" ]; then
            if [ "$DRY_RUN" = "true" ]; then
                log "Would delete local branch: $branch"
            else
                log "Deleting local branch: $branch"
                git branch -d "$branch" 2>/dev/null || git branch -D "$branch"
                success "Deleted local branch: $branch"
            fi
        fi
    done
}

# Clean up remote merged branches
cleanup_remote_merged() {
    log "Cleaning up remote merged branches..."
    
    local merged_remotes=$(git branch -r --merged $MAIN_BRANCH | grep -v "$MAIN_BRANCH" | grep -v "HEAD" | sed 's/origin\///')
    
    if [ -z "$merged_remotes" ]; then
        log "No remote merged branches to clean up."
        return
    fi
    
    echo "$merged_remotes" | while read branch; do
        if [ -n "$branch" ]; then
            if [ "$DRY_RUN" = "true" ]; then
                log "Would delete remote branch: $branch"
            else
                log "Deleting remote branch: $branch"
                git push $REMOTE_NAME --delete "$branch" 2>/dev/null || warn "Failed to delete remote branch: $branch"
                success "Deleted remote branch: $branch"
            fi
        fi
    done
}

# Find stale branches (branches with no activity for X days)
find_stale_branches() {
    log "Finding stale branches (no activity for $STALE_DAYS days)..."
    
    local stale_branches=""
    local current_time=$(date +%s)
    local stale_seconds=$((STALE_DAYS * 24 * 60 * 60))
    
    # Get all remote branches except main
    git branch -r | grep -v "$MAIN_BRANCH" | grep -v "HEAD" | while read branch; do
        local branch_name=$(echo "$branch" | sed 's/origin\///')
        local last_commit_time=$(git log -1 --format=%ct "$branch" 2>/dev/null || echo "0")
        
        if [ "$last_commit_time" != "0" ]; then
            local time_diff=$((current_time - last_commit_time))
            
            if [ $time_diff -gt $stale_seconds ]; then
                local days_old=$((time_diff / 86400))
                warn "Stale branch found: $branch_name (last activity: $days_old days ago)"
                stale_branches="$stale_branches $branch_name"
            fi
        fi
    done
    
    if [ -n "$stale_branches" ]; then
        log "Stale branches found: $stale_branches"
        if [ "$DRY_RUN" = "false" ]; then
            read -p "Do you want to delete these stale branches? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "$stale_branches" | while read branch; do
                    if [ -n "$branch" ]; then
                        log "Deleting stale branch: $branch"
                        git push $REMOTE_NAME --delete "$branch" 2>/dev/null || warn "Failed to delete stale branch: $branch"
                    fi
                done
            fi
        fi
    else
        log "No stale branches found."
    fi
}

# Show branch statistics
show_statistics() {
    log "Branch Statistics:"
    local total_branches=$(git branch -r | wc -l)
    local merged_branches=$(git branch -r --merged $MAIN_BRANCH | wc -l)
    local unmerged_branches=$(git branch -r --no-merged $MAIN_BRANCH | wc -l)
    
    echo "  Total remote branches: $total_branches"
    echo "  Merged branches: $merged_branches"
    echo "  Unmerged branches: $unmerged_branches"
}

# Main execution
main() {
    log "Starting branch cleanup process..."
    
    # Check prerequisites
    check_git_repo
    check_working_directory
    
    # Show current statistics
    show_statistics
    
    # Fetch latest changes
    fetch_latest
    
    # Clean up branches
    cleanup_local_merged
    cleanup_remote_merged
    
    # Find stale branches (interactive)
    find_stale_branches
    
    # Show final statistics
    log "Cleanup complete!"
    show_statistics
}

# Help function
show_help() {
    echo "Branch Cleanup Script for Hero's Path"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dry-run          Show what would be deleted without actually deleting"
    echo "  --stale-days=N     Consider branches stale after N days (default: 30)"
    echo "  --help             Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DRY_RUN=true       Same as --dry-run"
    echo "  STALE_DAYS=60      Same as --stale-days=60"
    echo ""
    echo "Examples:"
    echo "  $0                 # Normal cleanup"
    echo "  $0 --dry-run       # Preview what would be deleted"
    echo "  $0 --stale-days=7  # Consider branches stale after 7 days"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --stale-days=*)
            STALE_DAYS="${1#*=}"
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main
